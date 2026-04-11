<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_http_method('POST');

$payload = read_json_body();

try {
    $pdo = db_connection();
    $pdo->beginTransaction();

    $clientId = find_or_create_client($pdo, [
        'nom_complet' => $payload['nom_complet'] ?? '',
        'adresse' => $payload['adresse'] ?? '',
        'nas' => $payload['nas'] ?? '',
        'type_piece_identite' => 'unknown',
        'numero_piece_identite' => $payload['nas'] ?? '',
        'date_inscription' => date('Y-m-d'),
    ]);

    $insertReservation = $pdo->prepare(
        'INSERT INTO reservation (date_debut, date_fin, date_reservation, statut, id_client, id_chambre)
         VALUES (:date_debut, :date_fin, :date_reservation, :statut, :id_client, :id_chambre)
         RETURNING id_reservation, date_debut, date_fin, date_reservation, statut, id_client, id_chambre'
    );

    $insertReservation->execute([
        'date_debut' => $payload['date_debut'] ?? null,
        'date_fin' => $payload['date_fin'] ?? null,
        'date_reservation' => date('Y-m-d'),
        'statut' => 'Réservée',
        'id_client' => $clientId,
        'id_chambre' => isset($payload['id_chambre']) ? (int) $payload['id_chambre'] : null,
    ]);

    $reservation = $insertReservation->fetch();
    $pdo->commit();

    json_response([
        'message' => 'Réservation créée avec succès.',
        'reservation' => $reservation,
    ], 201);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response([
        'error' => 'Impossible de créer la réservation.',
        'details' => $exception->getMessage(),
    ], 500);
}
