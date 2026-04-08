<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_http_method('POST');

$payload = read_json_body();

try {
    $pdo = db_connection();
    $pdo->beginTransaction();

    $clientId = find_or_create_client($pdo, [
        'nom_complet' => $payload['client_name'] ?? '',
        'adresse' => $payload['client_address'] ?? '',
        'nas' => $payload['client_nas'] ?? '',
    ]);

    $insertRental = $pdo->prepare(
        'INSERT INTO location (date_debut, date_fin, date_checkin, id_client, id_chambre, id_reservation, id_employe)
         VALUES (:date_debut, :date_fin, :date_checkin, :id_client, :id_chambre, NULL, :id_employe)
         RETURNING id_location, date_debut, date_fin, date_checkin, id_client, id_chambre, id_reservation, id_employe'
    );

    $insertRental->execute([
        'date_debut' => $payload['start_date'] ?? null,
        'date_fin' => $payload['end_date'] ?? null,
        'date_checkin' => $payload['checkin_date'] ?? $payload['start_date'] ?? null,
        'id_client' => $clientId,
        'id_chambre' => isset($payload['room_id']) ? (int) $payload['room_id'] : null,
        'id_employe' => isset($payload['employee_id']) ? (int) $payload['employee_id'] : null,
    ]);

    $rental = $insertRental->fetch();
    $pdo->commit();

    json_response([
        'message' => 'Location créée avec succès.',
        'rental' => $rental,
    ], 201);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response([
        'error' => 'Impossible de créer la location.',
        'details' => $exception->getMessage(),
    ], 500);
}
