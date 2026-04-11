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
        $statement = $pdo->query(
            'SELECT
                h.id_hotel,
                h.nom,
                h.categorie,
                h.adresse,
                h.email,
                h.telephone,
                h.nb_chambres,
                h.id_chaine,
                h.id_gestionnaire,
                c.nom AS chaine_nom,
                e.nom_complet AS gestionnaire_nom
             FROM hotel h
             INNER JOIN chaine c ON c.id_chaine = h.id_chaine
             LEFT JOIN employe e ON e.id_employe = h.id_gestionnaire
             ORDER BY c.nom, h.nom'
        );

        json_response([
            'hotels' => array_map('format_hotel_row', $statement->fetchAll()),
        ]);
    }

    if ($method === 'DELETE') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if ($id <= 0) {
            json_response(['error' => 'ID d’hôtel invalide.'], 400);
        }

        $pdo->beginTransaction();

        $existingHotel = $pdo->prepare(
            'SELECT id_hotel
             FROM hotel
             WHERE id_hotel = :id
             LIMIT 1'
        );
        $existingHotel->execute(['id' => $id]);

        if (!$existingHotel->fetch()) {
            $pdo->rollBack();
            json_response(['deleted' => false], 404);
        }

        $dependencyCounts = delete_hotel_dependencies($pdo, $id);

        $statement = $pdo->prepare('DELETE FROM hotel WHERE id_hotel = :id');
        $statement->execute(['id' => $id]);

        $pdo->commit();

        json_response([
            'deleted' => $statement->rowCount() > 0,
            'cascade' => [
                'roomsDeleted' => $dependencyCounts['roomsDeleted'],
                'reservationsDeleted' => $dependencyCounts['reservationsDeleted'],
                'locationsDeleted' => $dependencyCounts['locationsDeleted'],
            ],
        ]);
    }

    if (!in_array($method, ['POST', 'PUT'], true)) {
        json_response(['error' => 'Méthode HTTP non autorisée.'], 405);
    }

    $payload = read_json_body();

    $pdo->beginTransaction();

    if (!empty($payload['id'])) {
        $params = [
            'id_hotel' => (int) $payload['id'],
            'categorie' => isset($payload['category']) ? (int) $payload['category'] : null,
            'adresse' => (string) ($payload['address'] ?? ''),
            'email' => (string) ($payload['email'] ?? ''),
            'telephone' => (string) ($payload['phone'] ?? ''),
            'id_gestionnaire' => !empty($payload['managerId']) ? (int) $payload['managerId'] : null,
        ];
        $statement = $pdo->prepare(
            'UPDATE hotel
             SET categorie = :categorie,
                 adresse = :adresse,
                 email = :email,
                 telephone = :telephone,
                 id_gestionnaire = :id_gestionnaire
             WHERE id_hotel = :id_hotel
             RETURNING id_hotel, nom, categorie, adresse, email, telephone, nb_chambres, id_chaine, id_gestionnaire'
        );
    } else {
        $params = [
            'nom' => (string) ($payload['name'] ?? ''),
            'categorie' => isset($payload['category']) ? (int) $payload['category'] : null,
            'adresse' => (string) ($payload['address'] ?? ''),
            'email' => (string) ($payload['email'] ?? ''),
            'telephone' => (string) ($payload['phone'] ?? ''),
            'id_chaine' => isset($payload['chainId']) ? (int) $payload['chainId'] : null,
            'id_gestionnaire' => !empty($payload['managerId']) ? (int) $payload['managerId'] : null,
        ];
        $statement = $pdo->prepare(
            'INSERT INTO hotel (nom, categorie, adresse, email, telephone, nb_chambres, id_chaine, id_gestionnaire)
             VALUES (:nom, :categorie, :adresse, :email, :telephone, 0, :id_chaine, :id_gestionnaire)
             RETURNING id_hotel, nom, categorie, adresse, email, telephone, nb_chambres, id_chaine, id_gestionnaire'
        );
    }

    $statement->execute($params);
    $hotel = $statement->fetch();

    if (empty($hotel['id_gestionnaire'])) {
        $defaultManager = $pdo->prepare(
            'INSERT INTO employe (nom_complet, adresse, nas, role, id_hotel)
             VALUES (:nom_complet, :adresse, :nas, :role, :id_hotel)
             RETURNING id_employe, nom_complet'
        );
        $defaultManager->execute([
            'nom_complet' => 'Gestionnaire ' . $hotel['nom'],
            'adresse' => $hotel['adresse'],
            'nas' => 'EMP' . str_pad((string) $hotel['id_hotel'], 6, '0', STR_PAD_LEFT) . 'G',
            'role' => 'Gestionnaire',
            'id_hotel' => (int) $hotel['id_hotel'],
        ]);
        $manager = $defaultManager->fetch();

        $setManager = $pdo->prepare(
            'UPDATE hotel
             SET id_gestionnaire = :id_gestionnaire
             WHERE id_hotel = :id_hotel'
        );
        $setManager->execute([
            'id_gestionnaire' => (int) $manager['id_employe'],
            'id_hotel' => (int) $hotel['id_hotel'],
        ]);

        $hotel['id_gestionnaire'] = (int) $manager['id_employe'];
        $hotel['gestionnaire_nom'] = (string) $manager['nom_complet'];
    }

    $chainStatement = $pdo->prepare('SELECT nom FROM chaine WHERE id_chaine = :id_chaine');
    $chainStatement->execute(['id_chaine' => (int) $hotel['id_chaine']]);
    $hotel['chaine_nom'] = (string) $chainStatement->fetchColumn();

    if (!empty($hotel['id_gestionnaire']) && empty($hotel['gestionnaire_nom'])) {
        $managerStatement = $pdo->prepare('SELECT nom_complet FROM employe WHERE id_employe = :id_employe');
        $managerStatement->execute(['id_employe' => (int) $hotel['id_gestionnaire']]);
        $hotel['gestionnaire_nom'] = (string) $managerStatement->fetchColumn();
    } elseif (empty($hotel['gestionnaire_nom'])) {
        $hotel['gestionnaire_nom'] = '';
    }

    $pdo->commit();

    json_response([
        'hotel' => format_hotel_row($hotel),
    ], empty($payload['id']) ? 201 : 200);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response([
        'error' => 'Impossible de gérer les hôtels.',
        'details' => $exception->getMessage(),
    ], 500);
}
