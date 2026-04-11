<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

try {
    $pdo = db_connection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'OPTIONS') {
        json_response(['ok' => true]);
    }

    if ($method === 'GET') {
        $search = trim((string) ($_GET['q'] ?? ''));
        $status = normalize_reservation_status((string) ($_GET['status'] ?? ''));

        $statement = $pdo->prepare(
            'SELECT
                 r.id_reservation,
                 r.date_debut,
                 r.date_fin,
                 r.date_reservation,
                 r.statut,
                 r.id_client,
                 r.id_chambre,
                 TRIM(COALESCE(c.nom, \'\') || \' \' || COALESCE(c.prenom, \'\')) AS nom_client,
                 ch.nom_chambre,
                 h.nom AS nom_hotel
             FROM reservation r
             INNER JOIN client c ON c.id_client = r.id_client
             INNER JOIN chambre ch ON ch.id_chambre = r.id_chambre
             INNER JOIN hotel h ON h.id_hotel = ch.id_hotel
             WHERE (
                 :q = \'\'
                 OR CAST(r.id_reservation AS TEXT) ILIKE :q_like
                 OR TRIM(COALESCE(c.nom, \'\') || \' \' || COALESCE(c.prenom, \'\')) ILIKE :q_like
                 OR h.nom ILIKE :q_like
                 OR COALESCE(ch.nom_chambre, \'\') ILIKE :q_like
               )
               AND (
                 :status = \'\'
                 OR REPLACE(LOWER(COALESCE(r.statut, \'\')), \'é\', \'e\') = REPLACE(LOWER(:status), \'é\', \'e\')
               )
             ORDER BY r.date_reservation DESC, r.id_reservation DESC'
        );

        $statement->execute([
            'q' => $search,
            'q_like' => '%' . $search . '%',
            'status' => $status,
        ]);

        $reservations = array_map(
            static fn (array $row): array => [
                'id' => (int) $row['id_reservation'],
                'startDate' => (string) $row['date_debut'],
                'endDate' => (string) $row['date_fin'],
                'reservationDate' => (string) $row['date_reservation'],
                'status' => normalize_reservation_status((string) ($row['statut'] ?? '')),
                'clientId' => (int) $row['id_client'],
                'clientName' => (string) ($row['nom_client'] ?? ''),
                'roomId' => (int) $row['id_chambre'],
                'roomName' => (string) ($row['nom_chambre'] ?? 'Chambre'),
                'hotelName' => (string) ($row['nom_hotel'] ?? 'Hôtel'),
            ],
            $statement->fetchAll()
        );

        json_response([
            'reservations' => $reservations,
        ]);
    } elseif ($method === 'PUT') {
        $payload = read_json_body();

        $reservationId = isset($payload['reservation_id']) ? (int) $payload['reservation_id'] : null;

        if (!$reservationId) {
            json_response(['error' => 'ID de réservation manquant.'], 400);
        }

        $pdo->beginTransaction();

        $checkQuery = $pdo->prepare('SELECT id_reservation FROM reservation WHERE id_reservation = :id LIMIT 1');
        $checkQuery->execute([':id' => $reservationId]);

        if (!$checkQuery->fetch()) {
            $pdo->rollBack();
            json_response(['error' => 'Réservation introuvable.'], 404);
        }

        $updateStatement = $pdo->prepare(
            'UPDATE reservation
             SET date_debut = :date_debut, date_fin = :date_fin
             WHERE id_reservation = :id
             RETURNING id_reservation, date_debut, date_fin, statut'
        );

        $updateStatement->execute([
            ':date_debut' => $payload['start_date'] ?? null,
            ':date_fin' => $payload['end_date'] ?? null,
            ':id' => $reservationId,
        ]);

        $updated = $updateStatement->fetch();
        $pdo->commit();

        if ($updated) {
            json_response([
                'message' => 'Réservation mise à jour avec succès.',
                'reservation' => [
                    'id' => (int) $updated['id_reservation'],
                    'startDate' => (string) $updated['date_debut'],
                    'endDate' => (string) $updated['date_fin'],
                    'status' => normalize_reservation_status((string) ($updated['statut'] ?? '')),
                ],
            ]);
        } else {
            json_response(['error' => 'Impossible de mettre à jour la réservation.'], 500);
        }
    } else {
        json_response(['error' => 'Méthode HTTP non autorisée.'], 405);
    }
} catch (Throwable $exception) {
    json_response([
        'error' => 'Impossible de traiter la réservation.',
        'details' => $exception->getMessage(),
    ], 500);
}
