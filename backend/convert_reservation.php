<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_http_method('POST');

$payload = read_json_body();

try {
    $pdo = db_connection();
    $pdo->beginTransaction();

    $reservationQuery = $pdo->prepare(
        'SELECT
             r.id_reservation,
             r.id_client,
             r.id_chambre,
             r.date_debut,
             r.date_fin,
             r.statut,
             TRIM(COALESCE(c.nom, \'\') || \' \' || COALESCE(c.prenom, \'\')) AS nom_client,
             COALESCE(ch.nom_chambre, \'Chambre\') AS nom_chambre,
             COALESCE(h.nom, \'Hôtel\') AS nom_hotel
         FROM reservation r
         INNER JOIN client c ON c.id_client = r.id_client
         INNER JOIN chambre ch ON ch.id_chambre = r.id_chambre
         INNER JOIN hotel h ON h.id_hotel = ch.id_hotel
         WHERE r.id_reservation = :id_reservation
         LIMIT 1'
    );
    $reservationQuery->execute([
        'id_reservation' => isset($payload['reservation_id']) ? (int) $payload['reservation_id'] : null,
    ]);

    $reservation = $reservationQuery->fetch();

    if (!$reservation) {
        $pdo->rollBack();
        json_response(['error' => 'Réservation introuvable.'], 404);
    }

    $existingRentalQuery = $pdo->prepare(
        'SELECT id_location
         FROM location
         WHERE id_reservation = :id_reservation
         LIMIT 1'
    );
    $existingRentalQuery->execute([
        'id_reservation' => (int) $reservation['id_reservation'],
    ]);

    if ($existingRentalQuery->fetch()) {
        $pdo->rollBack();
        json_response(['error' => 'Cette réservation a déjà été convertie en location.'], 409);
    }

    $insertRental = $pdo->prepare(
        'INSERT INTO location (date_debut, date_fin, date_checkin, id_client, id_chambre, id_reservation, id_employe)
         VALUES (:date_debut, :date_fin, :date_checkin, :id_client, :id_chambre, :id_reservation, :id_employe)
         RETURNING id_location, id_reservation, id_client, id_chambre, id_employe, date_checkin'
    );

    $insertRental->execute([
        'date_debut' => $payload['start_date'] ?? $reservation['date_debut'],
        'date_fin' => $payload['end_date'] ?? $reservation['date_fin'],
        'date_checkin' => $payload['checkin_date'] ?? $payload['start_date'] ?? $reservation['date_debut'],
        'id_client' => (int) $reservation['id_client'],
        'id_chambre' => (int) $reservation['id_chambre'],
        'id_reservation' => (int) $reservation['id_reservation'],
        'id_employe' => isset($payload['employee_id']) ? (int) $payload['employee_id'] : null,
    ]);

    $updateReservation = $pdo->prepare(
        'UPDATE reservation
         SET statut = :statut
         WHERE id_reservation = :id_reservation'
    );
    $updateReservation->execute([
        'statut' => 'convertie',
        'id_reservation' => (int) $reservation['id_reservation'],
    ]);

    $location = $insertRental->fetch();
    $pdo->commit();

    json_response([
        'message' => 'Réservation convertie en location avec succès.',
        'location' => $location,
        'reservation' => [
            'id_reservation' => (int) $reservation['id_reservation'],
            'statut' => 'convertie',
            'date_debut' => $reservation['date_debut'],
            'date_fin' => $reservation['date_fin'],
            'client_name' => (string) ($reservation['nom_client'] ?? ''),
            'room_id' => (int) $reservation['id_chambre'],
            'room_name' => (string) ($reservation['nom_chambre'] ?? 'Chambre'),
            'hotel_name' => (string) ($reservation['nom_hotel'] ?? 'Hôtel'),
        ],
    ]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response([
        'error' => 'Impossible de convertir la réservation.',
        'details' => $exception->getMessage(),
    ], 500);
}
