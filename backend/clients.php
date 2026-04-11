<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function normalize_optional_text(mixed $value): ?string
{
    $normalized = trim((string) ($value ?? ''));
    return $normalized === '' ? null : $normalized;
}

function normalize_required_text(mixed $value): string
{
    return trim((string) ($value ?? ''));
}

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
    $email = normalize_required_text($payload['email'] ?? '');

    if ($email === '') {
        json_response(['error' => 'Le courriel est obligatoire.'], 400);
    }

    if (!empty($payload['id'])) {
        $params = [
            'id_client' => (int) $payload['id'],
            'adresse' => normalize_required_text($payload['address'] ?? ''),
            'email' => $email,
            'telephone' => normalize_optional_text($payload['phone'] ?? ''),
            'type_piece_identite' => normalize_optional_text($payload['idType'] ?? ''),
            'numero_piece_identite' => normalize_optional_text($payload['idNumber'] ?? ''),
        ];
        $statement = $pdo->prepare(
            'UPDATE client
             SET adresse = :adresse,
                 email = :email,
                 telephone = :telephone,
                 type_piece_identite = COALESCE(NULLIF(:type_piece_identite, \'\'), type_piece_identite),
                 numero_piece_identite = COALESCE(NULLIF(:numero_piece_identite, \'\'), numero_piece_identite)
             WHERE id_client = :id_client
             RETURNING id_client, nom, prenom, adresse, email, telephone, nas, date_inscription, type_piece_identite, numero_piece_identite'
        );
    } else {
        $params = [
            'nom' => $nom,
            'prenom' => $prenom,
            'adresse' => normalize_required_text($payload['address'] ?? ''),
            'email' => $email,
            'telephone' => normalize_optional_text($payload['phone'] ?? preg_replace('/\D+/', '', (string) ($payload['nas'] ?? ''))),
            'nas' => normalize_required_text($payload['nas'] ?? ''),
            'date_inscription' => (string) ($payload['registrationDate'] ?? date('Y-m-d')),
            'type_piece_identite' => normalize_optional_text($payload['idType'] ?? 'national_id'),
            'numero_piece_identite' => normalize_optional_text($payload['idNumber'] ?? (string) ($payload['nas'] ?? '')),
        ];
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
} catch (PDOException $exception) {
    if ($exception->getCode() === '23505' && str_contains($exception->getMessage(), 'client_email_key')) {
        json_response([
            'error' => 'Ce courriel est déjà utilisé par un autre client.',
        ], 409);
    }

    json_response([
        'error' => 'Impossible de gérer les clients.',
        'details' => $exception->getMessage(),
    ], 500);
} catch (Throwable $exception) {
    json_response([
        'error' => 'Impossible de gérer les clients.',
        'details' => $exception->getMessage(),
    ], 500);
}
