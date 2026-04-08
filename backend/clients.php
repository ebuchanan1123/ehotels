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
            'SELECT id_client, nom, prenom, adresse, email, telephone, nas, date_inscription, type_piece_identite, numero_piece_identite
             FROM client
             ORDER BY nom, prenom'
        );

        json_response([
            'clients' => array_map('format_client_row', $statement->fetchAll()),
        ]);
    }

    if ($method === 'DELETE') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $statement = $pdo->prepare('DELETE FROM client WHERE id_client = :id');
        $statement->execute(['id' => $id]);

        json_response(['deleted' => $statement->rowCount() > 0]);
    }

    if (!in_array($method, ['POST', 'PUT'], true)) {
        json_response(['error' => 'Méthode HTTP non autorisée.'], 405);
    }

    $payload = read_json_body();
    [$nom, $prenom] = split_full_name((string) ($payload['fullName'] ?? ''));

    $params = [
        'nom' => $nom,
        'prenom' => $prenom,
        'adresse' => (string) ($payload['address'] ?? ''),
        'email' => (string) ($payload['email'] ?? ''),
        'telephone' => (string) ($payload['phone'] ?? preg_replace('/\D+/', '', (string) ($payload['nas'] ?? ''))),
        'nas' => (string) ($payload['nas'] ?? ''),
        'date_inscription' => (string) ($payload['registrationDate'] ?? date('Y-m-d')),
        'type_piece_identite' => (string) ($payload['idType'] ?? 'unknown'),
        'numero_piece_identite' => (string) ($payload['idNumber'] ?? ''),
    ];

    if (!empty($payload['id'])) {
        $params['id_client'] = (int) $payload['id'];
        $statement = $pdo->prepare(
            'UPDATE client
             SET nom = :nom,
                 prenom = :prenom,
                 adresse = :adresse,
                 email = :email,
                 telephone = :telephone,
                 nas = :nas,
                 date_inscription = :date_inscription,
                 type_piece_identite = :type_piece_identite,
                 numero_piece_identite = :numero_piece_identite
             WHERE id_client = :id_client
             RETURNING id_client, nom, prenom, adresse, email, telephone, nas, date_inscription, type_piece_identite, numero_piece_identite'
        );
    } else {
        $statement = $pdo->prepare(
            'INSERT INTO client (nom, prenom, adresse, email, telephone, nas, date_inscription, type_piece_identite, numero_piece_identite)
             VALUES (:nom, :prenom, :adresse, :email, :telephone, :nas, :date_inscription, :type_piece_identite, :numero_piece_identite)
             RETURNING id_client, nom, prenom, adresse, email, telephone, nas, date_inscription, type_piece_identite, numero_piece_identite'
        );
    }

    $statement->execute($params);
    json_response([
        'client' => format_client_row($statement->fetch()),
    ], empty($payload['id']) ? 201 : 200);
} catch (Throwable $exception) {
    json_response([
        'error' => 'Impossible de gérer les clients.',
        'details' => $exception->getMessage(),
    ], 500);
}
