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
        $baseSql = '
            SELECT
                c.*,
                h.nom AS hotel_nom,
                h.adresse,
                h.categorie,
                ch.nom AS nom_chaine
            FROM chambre c
            INNER JOIN hotel h ON h.id_hotel = c.id_hotel
            INNER JOIN chaine ch ON ch.id_chaine = h.id_chaine
        ';

        if (isset($_GET['id']) && (int) $_GET['id'] > 0) {
            $statement = $pdo->prepare($baseSql . ' WHERE c.id_chambre = :id_chambre LIMIT 1');
            $statement->execute(['id_chambre' => (int) $_GET['id']]);
            $room = $statement->fetch();

            if (!$room) {
                json_response(['error' => 'Chambre introuvable.'], 404);
            }

            json_response([
                'room' => normalize_room_row($room),
            ]);
        }

        $statement = $pdo->query($baseSql . ' ORDER BY h.nom, c.numero');

        json_response([
            'rooms' => array_map('normalize_room_row', $statement->fetchAll()),
        ]);
    }

    if ($method === 'DELETE') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if ($id <= 0) {
            json_response(['error' => 'ID de chambre invalide.'], 400);
        }

        $pdo->beginTransaction();

        $existingRoom = $pdo->prepare(
            'SELECT id_chambre
             FROM chambre
             WHERE id_chambre = :id
             LIMIT 1'
        );
        $existingRoom->execute(['id' => $id]);

        if (!$existingRoom->fetch()) {
            $pdo->rollBack();
            json_response(['deleted' => false], 404);
        }

        $dependencyCounts = delete_room_dependencies($pdo, $id);

        $statement = $pdo->prepare('DELETE FROM chambre WHERE id_chambre = :id');
        $statement->execute(['id' => $id]);

        $pdo->commit();

        json_response([
            'deleted' => $statement->rowCount() > 0,
            'cascade' => [
                'reservationsDeleted' => $dependencyCounts['reservationsDeleted'],
                'locationsDeleted' => $dependencyCounts['locationsDeleted'],
            ],
        ]);
    }

    if (!in_array($method, ['POST', 'PUT'], true)) {
        json_response(['error' => 'Méthode HTTP non autorisée.'], 405);
    }

    $payload = read_json_body();
    $capacityMap = [
        'simple' => 1,
        'double' => 2,
        'family' => 4,
    ];

    if (!empty($payload['id'])) {
        $hasSeaView = in_array(strtolower((string) ($payload['view'] ?? '')), ['mer', 'vue mer', 'ocean'], true);
        $isExtendable = !empty($payload['extendable']) && in_array((string) $payload['extendable'], ['yes', 'true', '1'], true);

        $params = [
            'id_chambre' => (int) $payload['id'],
            'capacite' => $capacityMap[$payload['capacity'] ?? 'double'] ?? max(1, (int) ($payload['capacityValue'] ?? 2)),
            'prix' => (float) ($payload['price'] ?? 0),
            'vue_mer' => pg_bool_param($hasSeaView),
            'etendue' => pg_bool_param($isExtendable),
            'commodites' => (string) ($payload['amenities'] ?? 'Wi-Fi, TV, climatisation'),
            'vue' => (string) ($payload['view'] ?? 'Ville'),
            'lit_additionnel' => pg_bool_param($isExtendable),
            'etat' => (string) ($payload['state'] ?? 'Excellent'),
            'superficie' => (float) ($payload['area'] ?? 0),
            'nombre_chambres' => isset($payload['roomCount']) ? (int) $payload['roomCount'] : 1,
        ];
        $statement = $pdo->prepare(
            'UPDATE chambre
             SET capacite = :capacite,
                 prix = :prix,
                 vue_mer = :vue_mer,
                 etendue = :etendue,
                 commodites = :commodites,
                 vue = :vue,
                 lit_additionnel = :lit_additionnel,
                 etat = :etat,
                 superficie = :superficie,
                 nombre_chambres = :nombre_chambres
             WHERE id_chambre = :id_chambre
             RETURNING *'
        );
    } else {
        $hasSeaView = in_array(strtolower((string) ($payload['view'] ?? '')), ['mer', 'vue mer', 'ocean'], true);
        $isExtendable = !empty($payload['extendable']) && in_array((string) $payload['extendable'], ['yes', 'true', '1'], true);

        $params = [
            'numero' => isset($payload['roomNumber']) ? (int) $payload['roomNumber'] : (isset($payload['id']) ? (int) $payload['id'] : null),
            'capacite' => $capacityMap[$payload['capacity'] ?? 'double'] ?? max(1, (int) ($payload['capacityValue'] ?? 2)),
            'prix' => (float) ($payload['price'] ?? 0),
            'vue_mer' => pg_bool_param($hasSeaView),
            'etendue' => pg_bool_param($isExtendable),
            'id_hotel' => isset($payload['hotelId']) ? (int) $payload['hotelId'] : null,
            'commodites' => (string) ($payload['amenities'] ?? 'Wi-Fi, TV, climatisation'),
            'vue' => (string) ($payload['view'] ?? 'Ville'),
            'lit_additionnel' => pg_bool_param($isExtendable),
            'etat' => (string) ($payload['state'] ?? 'Excellent'),
            'superficie' => (float) ($payload['area'] ?? 0),
            'nombre_chambres' => isset($payload['roomCount']) ? (int) $payload['roomCount'] : 1,
            'nom_chambre' => (string) ($payload['name'] ?? ''),
        ];
        $statement = $pdo->prepare(
            'INSERT INTO chambre (numero, capacite, prix, vue_mer, etendue, id_hotel, commodites, vue, lit_additionnel, etat, superficie, nombre_chambres, nom_chambre)
             VALUES (:numero, :capacite, :prix, :vue_mer, :etendue, :id_hotel, :commodites, :vue, :lit_additionnel, :etat, :superficie, :nombre_chambres, :nom_chambre)
             RETURNING *'
        );
    }

    $statement->execute($params);
    $room = $statement->fetch();

    $hotelStatement = $pdo->prepare(
        'SELECT h.nom AS hotel_nom, h.adresse, h.categorie, ch.nom AS nom_chaine
         FROM hotel h
         INNER JOIN chaine ch ON ch.id_chaine = h.id_chaine
         WHERE h.id_hotel = :id_hotel'
    );
    $hotelStatement->execute(['id_hotel' => (int) $room['id_hotel']]);
    $room = array_merge($room, $hotelStatement->fetch() ?: []);

    json_response([
        'room' => normalize_room_row($room),
    ], empty($payload['id']) ? 201 : 200);
} catch (Throwable $exception) {
    json_response([
        'error' => 'Impossible de gérer les chambres.',
        'details' => $exception->getMessage(),
    ], 500);
}
