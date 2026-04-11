<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

try {
    $pdo = db_connection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'OPTIONS') {
        json_response(['ok' => true]);
    }

    if ($method !== 'GET') {
        json_response(['error' => 'Méthode HTTP non autorisée.'], 405);
    }

    $search = trim((string) ($_GET['q'] ?? ''));

    $statement = $pdo->prepare(
        'SELECT
             l.id_location,
             l.date_debut,
             l.date_fin,
             l.date_checkin,
             l.id_client,
             l.id_chambre,
             l.id_reservation,
             l.id_employe,
             TRIM(COALESCE(c.nom, \'\') || \' \' || COALESCE(c.prenom, \'\')) AS nom_client,
             COALESCE(ch.nom_chambre, \'Chambre\') AS nom_chambre,
             h.nom AS nom_hotel,
             COALESCE(e.nom_complet, \'Employé introuvable\') AS nom_employe
         FROM location l
         INNER JOIN client c ON c.id_client = l.id_client
         INNER JOIN chambre ch ON ch.id_chambre = l.id_chambre
         INNER JOIN hotel h ON h.id_hotel = ch.id_hotel
         LEFT JOIN employe e ON e.id_employe = l.id_employe
         WHERE (
             :q = \'\'
             OR CAST(l.id_location AS TEXT) ILIKE :q_like
             OR CAST(COALESCE(l.id_reservation, 0) AS TEXT) ILIKE :q_like
             OR TRIM(COALESCE(c.nom, \'\') || \' \' || COALESCE(c.prenom, \'\')) ILIKE :q_like
             OR h.nom ILIKE :q_like
             OR COALESCE(e.nom_complet, \'\') ILIKE :q_like
         )
         ORDER BY l.date_checkin DESC, l.id_location DESC'
    );

    $statement->execute([
        'q' => $search,
        'q_like' => '%' . $search . '%',
    ]);

    $locations = array_map(
        static fn (array $row): array => [
            'id' => (int) $row['id_location'],
            'startDate' => (string) $row['date_debut'],
            'endDate' => (string) $row['date_fin'],
            'checkinDate' => (string) $row['date_checkin'],
            'clientId' => (int) $row['id_client'],
            'clientName' => (string) ($row['nom_client'] ?? ''),
            'roomId' => (int) $row['id_chambre'],
            'roomName' => (string) ($row['nom_chambre'] ?? 'Chambre'),
            'reservationId' => isset($row['id_reservation']) ? (int) $row['id_reservation'] : null,
            'employeeId' => isset($row['id_employe']) ? (int) $row['id_employe'] : null,
            'employeeName' => (string) ($row['nom_employe'] ?? ''),
            'hotelName' => (string) ($row['nom_hotel'] ?? 'Hôtel'),
        ],
        $statement->fetchAll()
    );

    json_response([
        'locations' => $locations,
    ]);
} catch (Throwable $exception) {
    json_response([
        'error' => 'Impossible de charger les locations.',
        'details' => $exception->getMessage(),
    ], 500);
}
