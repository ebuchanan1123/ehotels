<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_http_method('GET');

try {
    $pdo = db_connection();

    $chains = $pdo->query(
        'SELECT id_chaine AS id, nom
         FROM chaine
         ORDER BY nom'
    )->fetchAll();

    $hotels = $pdo->query(
        'SELECT id_hotel AS id, nom
         FROM hotel
         ORDER BY nom'
    )->fetchAll();

    $employees = $pdo->query(
        "SELECT id_employe AS id, nom_complet AS nom, role, id_hotel
         FROM employe
         ORDER BY nom_complet"
    )->fetchAll();

    json_response([
        'chains' => $chains,
        'hotels' => $hotels,
        'employees' => $employees,
    ]);
} catch (Throwable $exception) {
    json_response([
        'error' => 'Impossible de charger les données de référence.',
        'details' => $exception->getMessage(),
    ], 500);
}
