<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_http_method('POST');

$payload = read_json_body();

try {
    $pdo = db_connection();
    $pdo->beginTransaction();

    $reservationQuery = $pdo->prepare(
        'SELECT id_reservation, id_client, id_chambre, date_debut, date_fin, statut
         FROM reservation
         WHERE id_reservation = :id_reservation
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
