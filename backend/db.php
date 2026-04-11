<?php

declare(strict_types=1);

function load_local_db_config(): array
{
    $localConfigPath = __DIR__ . '/db.local.php';

    if (!is_file($localConfigPath)) {
        return [];
    }

    $config = require $localConfigPath;

    return is_array($config) ? $config : [];
}

function db_config(): array
{
    $defaults = [
        // Leave host/port empty by default so local development can use the
        // PostgreSQL unix socket and the current macOS user.
        'host' => '',
        'port' => '',
        'dbname' => 'ehotels',
        'user' => getenv('USER') ?: 'postgres',
        'password' => '',
    ];

    $localConfig = load_local_db_config();

    $environmentConfig = [
        'host' => getenv('EHOTELS_DB_HOST') !== false ? getenv('EHOTELS_DB_HOST') : null,
        'port' => getenv('EHOTELS_DB_PORT') !== false ? getenv('EHOTELS_DB_PORT') : null,
        'dbname' => getenv('EHOTELS_DB_NAME') !== false ? getenv('EHOTELS_DB_NAME') : null,
        'user' => getenv('EHOTELS_DB_USER') !== false ? getenv('EHOTELS_DB_USER') : null,
        'password' => getenv('EHOTELS_DB_PASSWORD') !== false ? getenv('EHOTELS_DB_PASSWORD') : null,
    ];

    return array_merge(
        $defaults,
        array_filter($localConfig, static fn ($value) => $value !== null),
        array_filter($environmentConfig, static fn ($value) => $value !== null)
    );
}

function db_connection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = db_config();
    $dsnParts = [];

    if ($config['host'] !== '') {
        $dsnParts[] = sprintf('host=%s', $config['host']);
    }

    if ($config['port'] !== '') {
        $dsnParts[] = sprintf('port=%s', $config['port']);
    }

    $dsnParts[] = sprintf('dbname=%s', $config['dbname']);
    $dsn = 'pgsql:' . implode(';', $dsnParts);

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
    $email = trim((string) ($clientData['email'] ?? ''));
    $email = $email !== '' ? $email : null;
    $nas = preg_replace('/\D+/', '', trim((string) ($clientData['nas'] ?? '')));
    $dateInscription = (string) ($clientData['date_inscription'] ?? date('Y-m-d'));
    $address = trim((string) ($clientData['adresse'] ?? ''));

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

function normalize_employee_role(?string $role): string
{
    $value = trim((string) ($role ?? ''));
    $normalized = strtolower(str_replace('é', 'e', $value));

    return match ($normalized) {
        'gestionnaire' => 'Gestionnaire',
        'reception' => 'Réception',
        'service' => 'Service',
        default => $value !== '' ? ucfirst($value) : '',
    };
}

function format_employee_row(array $row): array
{
    return [
        'id' => (int) $row['id_employe'],
        'fullName' => (string) $row['nom_complet'],
        'address' => (string) ($row['adresse'] ?? ''),
        'nas' => (string) ($row['nas'] ?? ''),
        'role' => normalize_employee_role((string) ($row['role'] ?? '')),
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

function delete_room_dependencies(PDO $pdo, int $roomId): array
{
    $deleteLocations = $pdo->prepare(
        'DELETE FROM location
         WHERE id_chambre = :id_chambre'
    );
    $deleteLocations->execute([
        'id_chambre' => $roomId,
    ]);

    $deleteReservations = $pdo->prepare(
        'DELETE FROM reservation
         WHERE id_chambre = :id_chambre'
    );
    $deleteReservations->execute([
        'id_chambre' => $roomId,
    ]);

    return [
        'locationsDeleted' => $deleteLocations->rowCount(),
        'reservationsDeleted' => $deleteReservations->rowCount(),
    ];
}

function delete_hotel_dependencies(PDO $pdo, int $hotelId): array
{
    $roomIdsStatement = $pdo->prepare(
        'SELECT id_chambre
         FROM chambre
         WHERE id_hotel = :id_hotel'
    );
    $roomIdsStatement->execute([
        'id_hotel' => $hotelId,
    ]);

    $roomIds = array_map(
        static fn (array $row): int => (int) $row['id_chambre'],
        $roomIdsStatement->fetchAll()
    );

    $locationsDeleted = 0;
    $reservationsDeleted = 0;

    foreach ($roomIds as $roomId) {
        $counts = delete_room_dependencies($pdo, $roomId);
        $locationsDeleted += $counts['locationsDeleted'];
        $reservationsDeleted += $counts['reservationsDeleted'];
    }

    return [
        'roomIds' => $roomIds,
        'roomsDeleted' => count($roomIds),
        'locationsDeleted' => $locationsDeleted,
        'reservationsDeleted' => $reservationsDeleted,
    ];
}

function pg_bool_param(bool $value): string
{
    return $value ? 'true' : 'false';
}
