<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_http_method('GET');

try {
    $pdo = db_connection();

    $sql = <<<SQL
        SELECT
            c.*,
            h.nom AS hotel_nom,
            h.adresse,
            h.categorie,
            h.nb_chambres,
            ch.nom AS nom_chaine
        FROM chambre c
        INNER JOIN hotel h ON h.id_hotel = c.id_hotel
        INNER JOIN chaine ch ON ch.id_chaine = h.id_chaine
        WHERE (:hotel_id::integer IS NULL OR c.id_hotel = :hotel_id::integer)
          AND (:location_like::text IS NULL OR LOWER(h.adresse) LIKE LOWER(:location_like::text))
          AND (
              :capacity::text IS NULL
              OR (:capacity::text = 'simple' AND c.capacite <= 1)
              OR (:capacity::text = 'double' AND c.capacite = 2)
              OR (:capacity::text = 'family' AND c.capacite >= 3)
          )
          AND LOWER(REPLACE(ch.nom, ' ', '')) = COALESCE(:chain_normalized::text, LOWER(REPLACE(ch.nom, ' ', '')))
          AND (:category::integer IS NULL OR h.categorie >= :category::integer)
          AND (:max_price::numeric IS NULL OR c.prix <= :max_price::numeric)
          AND (:min_area::numeric IS NULL OR c.superficie >= :min_area::numeric)
          AND (:room_count::integer IS NULL OR c.nombre_chambres >= :room_count::integer)
          AND (
              :date_debut::date IS NULL
              OR :date_fin::date IS NULL
              OR NOT EXISTS (
                  SELECT 1
                  FROM reservation r
                  WHERE r.id_chambre = c.id_chambre
                    AND COALESCE(LOWER(r.statut), '') <> 'annulee'
                    AND daterange(r.date_debut, r.date_fin, '[]') && daterange(:date_debut::date, :date_fin::date, '[]')
              )
          )
          AND (
              :date_debut::date IS NULL
              OR :date_fin::date IS NULL
              OR NOT EXISTS (
                  SELECT 1
                  FROM location l
                  WHERE l.id_chambre = c.id_chambre
                    AND daterange(l.date_debut, l.date_fin, '[]') && daterange(:date_debut::date, :date_fin::date, '[]')
              )
          )
        ORDER BY h.nom ASC, c.id_chambre ASC
    SQL;

    $params = [
        'hotel_id' => ($_GET['hotel'] ?? '') !== '' ? (int) $_GET['hotel'] : null,
        'location_like' => ($_GET['localisation'] ?? '') !== '' ? '%' . trim((string) $_GET['localisation']) . '%' : null,
        'capacity' => ($_GET['capacite'] ?? '') !== '' ? trim((string) $_GET['capacite']) : null,
        'chain_normalized' => ($_GET['chaine'] ?? '') !== '' ? strtolower(str_replace([' ', '-'], '', trim((string) $_GET['chaine']))) : null,
        'category' => ($_GET['categorie'] ?? '') !== '' ? (int) $_GET['categorie'] : null,
        'max_price' => ($_GET['prix_max'] ?? '') !== '' ? (float) $_GET['prix_max'] : null,
        'min_area' => ($_GET['superficie_min'] ?? '') !== '' ? (float) $_GET['superficie_min'] : null,
        'room_count' => ($_GET['nb_chambres'] ?? '') !== '' ? (int) $_GET['nb_chambres'] : null,
        'date_debut' => ($_GET['date_debut'] ?? '') !== '' ? (string) $_GET['date_debut'] : null,
        'date_fin' => ($_GET['date_fin'] ?? '') !== '' ? (string) $_GET['date_fin'] : null,
    ];

    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    $rows = $statement->fetchAll();

    json_response([
        'rooms' => array_map('normalize_room_row', $rows),
    ]);
} catch (Throwable $exception) {
    json_response([
        'error' => 'Erreur lors de la recherche des chambres.',
        'details' => $exception->getMessage(),
    ], 500);
}
