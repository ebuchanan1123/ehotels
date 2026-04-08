<?php

declare(strict_types=1);

function db_config(): array
{
    return [
        'host' => getenv('EHOTELS_DB_HOST') ?: '127.0.0.1',
        'port' => getenv('EHOTELS_DB_PORT') ?: '5432',
        'dbname' => getenv('EHOTELS_DB_NAME') ?: 'ehotels',
        'user' => getenv('EHOTELS_DB_USER') ?: 'dahliasarina',
        'password' => getenv('EHOTELS_DB_PASSWORD') ?: '',
    ];
}

function db_connection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = db_config();
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        $config['host'],
        $config['port'],
        $config['dbname']
    );

    $pdo = new PDO(
        $dsn,
        $config['user'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    return $pdo;
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);

    if (!is_array($decoded)) {
        json_response(['error' => 'Corps JSON invalide.'], 400);
    }

    return $decoded;
}

function require_http_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        json_response(['ok' => true]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response(['error' => 'Méthode HTTP non autorisée.'], 405);
    }
}

function value_from_row(array $row, array $keys, mixed $fallback = null): mixed
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $row) && $row[$key] !== null && $row[$key] !== '') {
            return $row[$key];
        }
    }

    return $fallback;
}

function normalize_room_row(array $row): array
{
    $rawCapacity = (int) value_from_row($row, ['capacite', 'capacity'], 0);

    if ($rawCapacity <= 1) {
        $capacity = 'simple';
        $capacityLabel = 'Simple';
    } elseif ($rawCapacity === 2) {
        $capacity = 'double';
        $capacityLabel = 'Double';
    } else {
        $capacity = 'family';
        $capacityLabel = 'Familiale';
    }

    $chain = (string) value_from_row($row, ['chaine', 'nom_chaine', 'hotel_chain'], '');
    $address = (string) value_from_row($row, ['adresse', 'address'], '');
    $location = $address;

    if (str_contains($address, ',')) {
        $parts = array_map('trim', explode(',', $address));
        $location = $parts[0] !== '' ? $parts[0] : $address;
    }

    return [
        'id' => (int) value_from_row($row, ['id_chambre', 'room_id', 'chambre_id'], 0),
        'name' => (string) value_from_row($row, ['nom_chambre', 'room_name'], 'Chambre'),
        'hotelId' => (int) value_from_row($row, ['id_hotel', 'hotel_id'], 0),
        'hotelName' => (string) value_from_row($row, ['hotel_nom', 'nom_hotel', 'nom'], 'Hôtel'),
        'location' => $location,
        'address' => $address,
        'chain' => strtolower(str_replace([' ', '-'], '', $chain)),
        'chainLabel' => $chain,
        'category' => (int) value_from_row($row, ['categorie', 'category'], 0),
        'capacity' => $capacity,
        'capacityLabel' => $capacityLabel,
        'area' => (float) value_from_row($row, ['superficie', 'area'], 0),
        'roomCount' => (int) value_from_row($row, ['nombre_chambres', 'room_count'], 1),
        'price' => (float) value_from_row($row, ['prix', 'price'], 0),
        'view' => (string) value_from_row($row, ['vue', 'view'], ((bool) value_from_row($row, ['vue_mer', 'sea_view'], false)) ? 'Vue mer' : 'Standard'),
        'extendable' => (bool) value_from_row($row, ['lit_additionnel', 'etendue', 'extensible', 'is_extendable'], false),
        'extendableLabel' => ((bool) value_from_row($row, ['lit_additionnel', 'etendue', 'extensible', 'is_extendable'], false)) ? 'Oui' : 'Non',
        'state' => (string) value_from_row($row, ['etat', 'state'], 'Excellent'),
        'amenities' => (string) value_from_row($row, ['commodites', 'amenities'], ''),
        'roomNumber' => (int) value_from_row($row, ['numero', 'room_number'], 0),
    ];
}

function split_full_name(string $fullName): array
{
    $parts = preg_split('/\s+/', trim($fullName)) ?: [];
    $prenom = array_pop($parts) ?: trim($fullName);
    $nom = trim(implode(' ', $parts));

    if ($nom === '') {
        $nom = $prenom;
    }

    return [$nom, $prenom];
}

function find_or_create_client(PDO $pdo, array $clientData): int
{
    $fullName = trim((string) ($clientData['nom_complet'] ?? ''));
    [$nom, $prenom] = split_full_name($fullName);

    $telephone = preg_replace('/\D+/', '', (string) ($clientData['telephone'] ?? $clientData['nas'] ?? ''));
    $telephone = $telephone !== '' ? $telephone : '0000000000';
    $email = (string) ($clientData['email'] ?? '');
    $nas = preg_replace('/\D+/', '', trim((string) ($clientData['nas'] ?? '')));
    $dateInscription = (string) ($clientData['date_inscription'] ?? date('Y-m-d'));
    $address = trim((string) ($clientData['adresse'] ?? ''));

    if ($email === '') {
        $slugNom = strtolower(preg_replace('/[^a-z0-9]+/i', '.', $nom));
        $slugPrenom = strtolower(preg_replace('/[^a-z0-9]+/i', '.', $prenom));
        $email = trim($slugPrenom . '.' . $slugNom, '.');
        if ($nas !== '') {
          $email .= '.' . substr($nas, -4);
        }
        $email .= '@ehotels.local';
    }

    $existingId = false;

    if ($nas !== '') {
        $lookup = $pdo->prepare(
            'SELECT id_client
             FROM client
             WHERE nas = :nas
             LIMIT 1'
        );
        $lookup->execute([
            'nas' => $nas,
        ]);
        $existingId = $lookup->fetchColumn();
    }

    if ($existingId === false) {
        $lookupByIdentity = $pdo->prepare(
            'SELECT id_client
             FROM client
             WHERE LOWER(nom) = LOWER(:nom)
               AND LOWER(prenom) = LOWER(:prenom)
               AND LOWER(COALESCE(adresse, \'\')) = LOWER(:adresse)
             LIMIT 1'
        );
        $lookupByIdentity->execute([
            'nom' => $nom,
            'prenom' => $prenom,
            'adresse' => $address,
        ]);
        $existingId = $lookupByIdentity->fetchColumn();
    }

    if ($existingId !== false) {
        $updateExisting = $pdo->prepare(
            'UPDATE client
             SET nas = COALESCE(NULLIF(:nas, \'\'), nas),
                 telephone = COALESCE(NULLIF(:telephone, \'\'), telephone),
                 email = COALESCE(NULLIF(:email, \'\'), email),
                 type_piece_identite = COALESCE(NULLIF(:type_piece_identite, \'\'), type_piece_identite),
                 numero_piece_identite = COALESCE(NULLIF(:numero_piece_identite, \'\'), numero_piece_identite)
             WHERE id_client = :id_client'
        );
        $updateExisting->execute([
            'id_client' => (int) $existingId,
            'nas' => $nas,
            'telephone' => $telephone,
            'email' => $email,
            'type_piece_identite' => (string) ($clientData['type_piece_identite'] ?? 'unknown'),
            'numero_piece_identite' => (string) ($clientData['numero_piece_identite'] ?? ($nas !== '' ? 'ID-' . $nas : '')),
        ]);
        return (int) $existingId;
    }

    $insert = $pdo->prepare(
        'INSERT INTO client (nom, prenom, adresse, email, telephone, nas, date_inscription, type_piece_identite, numero_piece_identite)
         VALUES (:nom, :prenom, :adresse, :email, :telephone, :nas, :date_inscription, :type_piece_identite, :numero_piece_identite)
         RETURNING id_client'
    );

    $insert->execute([
        'nom' => $nom,
        'prenom' => $prenom,
        'adresse' => $address,
        'email' => $email,
        'telephone' => $telephone,
        'nas' => $nas,
        'date_inscription' => $dateInscription,
        'type_piece_identite' => (string) ($clientData['type_piece_identite'] ?? 'unknown'),
        'numero_piece_identite' => (string) ($clientData['numero_piece_identite'] ?? ('ID-' . $nas)),
    ]);

    return (int) $insert->fetchColumn();
}

function format_client_row(array $row): array
{
    return [
        'id' => (int) $row['id_client'],
        'fullName' => trim($row['nom'] . ' ' . $row['prenom']),
        'address' => (string) ($row['adresse'] ?? ''),
        'nas' => (string) ($row['nas'] ?? ''),
        'email' => (string) ($row['email'] ?? ''),
        'phone' => (string) ($row['telephone'] ?? ''),
        'idType' => (string) ($row['type_piece_identite'] ?? 'unknown'),
        'idNumber' => (string) ($row['numero_piece_identite'] ?? ''),
        'registrationDate' => (string) ($row['date_inscription'] ?? ''),
    ];
}

function format_employee_row(array $row): array
{
    return [
        'id' => (int) $row['id_employe'],
        'fullName' => (string) $row['nom_complet'],
        'address' => (string) ($row['adresse'] ?? ''),
        'nas' => (string) ($row['nas'] ?? ''),
        'role' => (string) $row['role'],
        'hotelId' => (int) $row['id_hotel'],
        'hotelName' => (string) ($row['hotel_nom'] ?? ''),
    ];
}

function format_hotel_row(array $row): array
{
    return [
        'id' => (int) $row['id_hotel'],
        'name' => (string) $row['nom'],
        'category' => (int) $row['categorie'],
        'address' => (string) $row['adresse'],
        'email' => (string) ($row['email'] ?? ''),
        'phone' => (string) ($row['telephone'] ?? ''),
        'roomCount' => (int) ($row['nb_chambres'] ?? 0),
        'chainId' => (int) $row['id_chaine'],
        'chainName' => (string) ($row['chaine_nom'] ?? ''),
        'managerId' => isset($row['id_gestionnaire']) ? (int) $row['id_gestionnaire'] : null,
        'managerName' => (string) ($row['gestionnaire_nom'] ?? ''),
    ];
}
