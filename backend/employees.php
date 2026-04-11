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
            'SELECT e.id_employe, e.nom_complet, e.adresse, e.nas, e.role, e.id_hotel, h.nom AS hotel_nom
             FROM employe e
             INNER JOIN hotel h ON h.id_hotel = e.id_hotel
             ORDER BY e.nom_complet'
        );

        json_response([
            'employees' => array_map('format_employee_row', $statement->fetchAll()),
        ]);
    }

    if ($method === 'DELETE') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $statement = $pdo->prepare('DELETE FROM employe WHERE id_employe = :id');
        $statement->execute(['id' => $id]);

        json_response(['deleted' => $statement->rowCount() > 0]);
    }

    if (!in_array($method, ['POST', 'PUT'], true)) {
        json_response(['error' => 'Méthode HTTP non autorisée.'], 405);
    }

    $payload = read_json_body();
    $normalizedRole = normalize_employee_role((string) ($payload['role'] ?? ''));

    if (!empty($payload['id'])) {
        $params = [
            'id_employe' => (int) $payload['id'],
            'adresse' => (string) ($payload['address'] ?? ''),
            'role' => $normalizedRole !== '' ? $normalizedRole : 'Service',
            'id_hotel' => isset($payload['hotelId']) ? (int) $payload['hotelId'] : null,
        ];
        $statement = $pdo->prepare(
            'UPDATE employe
             SET adresse = :adresse,
                 role = :role,
                 id_hotel = :id_hotel
             WHERE id_employe = :id_employe
             RETURNING id_employe, nom_complet, adresse, nas, role, id_hotel'
        );
    } else {
        $params = [
            'nom_complet' => (string) ($payload['fullName'] ?? ''),
            'adresse' => (string) ($payload['address'] ?? ''),
            'nas' => (string) ($payload['nas'] ?? ''),
            'role' => $normalizedRole !== '' ? $normalizedRole : 'Service',
            'id_hotel' => isset($payload['hotelId']) ? (int) $payload['hotelId'] : null,
        ];
        $statement = $pdo->prepare(
            'INSERT INTO employe (nom_complet, adresse, nas, role, id_hotel)
             VALUES (:nom_complet, :adresse, :nas, :role, :id_hotel)
             RETURNING id_employe, nom_complet, adresse, nas, role, id_hotel'
        );
    }

    $pdo->beginTransaction();
    $statement->execute($params);
    $employee = $statement->fetch();

    if (($employee['role'] ?? '') === 'Gestionnaire') {
        $setManager = $pdo->prepare(
            'UPDATE hotel
             SET id_gestionnaire = :id_employe
             WHERE id_hotel = :id_hotel'
        );
        $setManager->execute([
            'id_employe' => (int) $employee['id_employe'],
            'id_hotel' => (int) $employee['id_hotel'],
        ]);
    } else {
        $clearManager = $pdo->prepare(
            'UPDATE hotel
             SET id_gestionnaire = NULL
             WHERE id_gestionnaire = :id_employe'
        );
        $clearManager->execute([
            'id_employe' => (int) $employee['id_employe'],
        ]);
    }

    $hotelStatement = $pdo->prepare('SELECT nom AS hotel_nom FROM hotel WHERE id_hotel = :id_hotel');
    $hotelStatement->execute(['id_hotel' => (int) $employee['id_hotel']]);
    $employee['hotel_nom'] = (string) $hotelStatement->fetchColumn();

    $pdo->commit();

    json_response([
        'employee' => format_employee_row($employee),
    ], empty($payload['id']) ? 201 : 200);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response([
        'error' => 'Impossible de gérer les employés.',
        'details' => $exception->getMessage(),
    ], 500);
}
