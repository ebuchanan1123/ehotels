BEGIN;

ALTER TABLE chaine
    ADD COLUMN IF NOT EXISTS nb_hotels integer;

ALTER TABLE client
    ADD COLUMN IF NOT EXISTS nas varchar(20),
    ADD COLUMN IF NOT EXISTS date_inscription date,
    ADD COLUMN IF NOT EXISTS type_piece_identite varchar(50),
    ADD COLUMN IF NOT EXISTS numero_piece_identite varchar(50);

ALTER TABLE chambre
    ADD COLUMN IF NOT EXISTS commodites text,
    ADD COLUMN IF NOT EXISTS vue varchar(100),
    ADD COLUMN IF NOT EXISTS lit_additionnel boolean,
    ADD COLUMN IF NOT EXISTS etat text,
    ADD COLUMN IF NOT EXISTS superficie numeric(10,2),
    ADD COLUMN IF NOT EXISTS nombre_chambres integer,
    ADD COLUMN IF NOT EXISTS nom_chambre varchar(120);

ALTER TABLE reservation
    ADD COLUMN IF NOT EXISTS date_reservation date DEFAULT CURRENT_DATE;

ALTER TABLE location
    ADD COLUMN IF NOT EXISTS date_checkin date,
    ADD COLUMN IF NOT EXISTS id_employe integer;

CREATE TABLE IF NOT EXISTS employe (
    id_employe serial PRIMARY KEY,
    nom_complet varchar(150) NOT NULL,
    adresse text,
    nas varchar(20) NOT NULL UNIQUE,
    role varchar(50) NOT NULL,
    id_hotel integer NOT NULL REFERENCES hotel(id_hotel) ON DELETE CASCADE
);

ALTER TABLE hotel
    ADD COLUMN IF NOT EXISTS id_gestionnaire integer;

UPDATE client
SET nas = COALESCE(nas, 'CLI' || LPAD(id_client::text, 6, '0')),
    date_inscription = COALESCE(date_inscription, CURRENT_DATE - (id_client || ' days')::interval),
    type_piece_identite = COALESCE(type_piece_identite, 'unknown'),
    numero_piece_identite = COALESCE(numero_piece_identite, 'ID-' || LPAD(id_client::text, 6, '0'));

UPDATE chambre
SET commodites = COALESCE(commodites, 'Wi-Fi, TV, climatisation'),
    vue = COALESCE(vue, CASE WHEN vue_mer THEN 'Mer' ELSE 'Ville' END),
    lit_additionnel = COALESCE(lit_additionnel, etendue, false),
    etat = COALESCE(etat, 'Excellent'),
    superficie = COALESCE(superficie, 18 + (capacite * 6)),
    nombre_chambres = COALESCE(nombre_chambres, CASE WHEN capacite >= 4 THEN 2 ELSE 1 END);

UPDATE chambre
SET nom_chambre = CASE
    WHEN superficie >= 42 AND prix >= 260 THEN 'Suite Deluxe'
    WHEN superficie >= 36 AND prix >= 220 AND capacite >= 2 THEN 'Suite Junior'
    WHEN capacite >= 4 THEN 'Suite Familiale'
    WHEN capacite = 3 AND superficie >= 32 THEN 'Chambre Familiale'
    WHEN capacite = 3 THEN 'Chambre Triple'
    WHEN capacite = 2 AND prix >= 180 THEN 'Chambre King'
    WHEN capacite = 2 THEN 'Chambre Double'
    WHEN capacite = 1 AND prix >= 170 THEN 'Chambre Queen'
    ELSE 'Chambre Simple'
END
WHERE nom_chambre IS NULL OR nom_chambre = '';

UPDATE reservation
SET date_reservation = COALESCE(date_reservation, date_debut - INTERVAL '7 days');

UPDATE location
SET date_checkin = COALESCE(date_checkin, date_debut);

INSERT INTO employe (nom_complet, adresse, nas, role, id_hotel)
SELECT
    'Gestionnaire ' || h.nom,
    h.adresse,
    'EMP' || LPAD(h.id_hotel::text, 6, '0'),
    'gestionnaire',
    h.id_hotel
FROM hotel h
LEFT JOIN employe e
    ON e.id_hotel = h.id_hotel
   AND e.role = 'gestionnaire'
WHERE e.id_employe IS NULL;

UPDATE hotel h
SET id_gestionnaire = e.id_employe
FROM employe e
WHERE e.id_hotel = h.id_hotel
  AND e.role = 'gestionnaire'
  AND h.id_gestionnaire IS NULL;

WITH hotel_slots AS (
    SELECT
        id_hotel,
        id_chaine,
        row_number() OVER (PARTITION BY id_chaine ORDER BY id_hotel) AS slot
    FROM hotel
),
hotel_catalog AS (
    SELECT * FROM (
        VALUES
            (1, 1, 'Hilton Midtown', 'New York, USA'),
            (1, 2, 'Hilton Downtown', 'Boston, USA'),
            (1, 3, 'Hilton Financial District', 'Toronto, Canada'),
            (1, 4, 'Hilton Harbourfront', 'Vancouver, Canada'),
            (1, 5, 'Hilton Old Montreal', 'Montreal, Canada'),
            (1, 6, 'Hilton South Beach', 'Miami, USA'),
            (1, 7, 'Hilton Magnificent Mile', 'Chicago, USA'),
            (1, 8, 'Hilton ByWard Market', 'Ottawa, Canada'),
            (2, 1, 'Marriott City Center', 'Toronto, Canada'),
            (2, 2, 'Marriott Airport', 'Toronto, Canada'),
            (2, 3, 'Marriott Times Square', 'New York, USA'),
            (2, 4, 'Marriott Back Bay', 'Boston, USA'),
            (2, 5, 'Marriott Gaslamp Quarter', 'San Diego, USA'),
            (2, 6, 'Marriott Old Port', 'Montreal, Canada'),
            (2, 7, 'Marriott River North', 'Chicago, USA'),
            (2, 8, 'Marriott Coral Gables', 'Miami, USA'),
            (3, 1, 'Hyatt Sunset', 'Los Angeles, USA'),
            (3, 2, 'Hyatt Downtown', 'Los Angeles, USA'),
            (3, 3, 'Hyatt Yonge Street', 'Toronto, Canada'),
            (3, 4, 'Hyatt Waterfront', 'Vancouver, Canada'),
            (3, 5, 'Hyatt Market Street', 'San Francisco, USA'),
            (3, 6, 'Hyatt South Beach', 'Miami, USA'),
            (3, 7, 'Hyatt Old Montreal', 'Montreal, Canada'),
            (3, 8, 'Hyatt Capitol Hill', 'Seattle, USA'),
            (4, 1, 'Sheraton Beach Resort', 'Miami, USA'),
            (4, 2, 'Sheraton Downtown', 'Miami, USA'),
            (4, 3, 'Sheraton Queen West', 'Toronto, Canada'),
            (4, 4, 'Sheraton Central Park', 'New York, USA'),
            (4, 5, 'Sheraton Old Quebec', 'Quebec City, Canada'),
            (4, 6, 'Sheraton Downtown', 'Calgary, Canada'),
            (4, 7, 'Sheraton River North', 'Chicago, USA'),
            (4, 8, 'Sheraton Harbour', 'Vancouver, Canada'),
            (5, 1, 'Holiday Inn Express', 'Chicago, USA'),
            (5, 2, 'Holiday Inn Downtown', 'Chicago, USA'),
            (5, 3, 'Holiday Inn Midtown', 'Atlanta, USA'),
            (5, 4, 'Holiday Inn Entertainment District', 'Toronto, Canada'),
            (5, 5, 'Holiday Inn Gare Centrale', 'Montreal, Canada'),
            (5, 6, 'Holiday Inn Brickell', 'Miami, USA'),
            (5, 7, 'Holiday Inn Downtown', 'Dallas, USA'),
            (5, 8, 'Holiday Inn Yaletown', 'Vancouver, Canada')
    ) AS t(id_chaine, slot, nom, adresse)
)
UPDATE hotel h
SET nom = hc.nom,
    adresse = hc.adresse
FROM hotel_slots hs
JOIN hotel_catalog hc
  ON hc.id_chaine = hs.id_chaine
 AND hc.slot = hs.slot
WHERE h.id_hotel = hs.id_hotel;

UPDATE employe e
SET adresse = h.adresse
FROM hotel h
WHERE h.id_hotel = e.id_hotel
  AND e.role = 'gestionnaire';

UPDATE location l
SET id_employe = h.id_gestionnaire
FROM chambre c
JOIN hotel h ON h.id_hotel = c.id_hotel
WHERE l.id_chambre = c.id_chambre
  AND l.id_employe IS NULL;

WITH hotels_per_chain AS (
    SELECT c.id_chaine, c.nom, COUNT(h.id_hotel) AS existing_hotels
    FROM chaine c
    LEFT JOIN hotel h ON h.id_chaine = c.id_chaine
    GROUP BY c.id_chaine, c.nom
),
missing_hotels AS (
    SELECT
        hpc.id_chaine,
        hpc.nom,
        generate_series(1, GREATEST(0, 8 - hpc.existing_hotels)) AS seq
    FROM hotels_per_chain hpc
),
inserted_hotels AS (
    INSERT INTO hotel (nom, categorie, adresse, email, telephone, nb_chambres, id_chaine)
    SELECT
        mh.nom || ' Expansion ' || mh.seq,
        ((mh.seq - 1) % 5) + 1,
        mh.nom || ' City ' || mh.seq || ', Canada',
        lower(replace(mh.nom, ' ', '')) || '.hotel' || mh.seq || '@ehotels.local',
        '800' || LPAD((mh.id_chaine * 100 + mh.seq)::text, 7, '0'),
        5,
        mh.id_chaine
    FROM missing_hotels mh
    RETURNING id_hotel, nom, adresse
)
INSERT INTO employe (nom_complet, adresse, nas, role, id_hotel)
SELECT
    'Gestionnaire ' || ih.nom,
    ih.adresse,
    'EMP' || LPAD(ih.id_hotel::text, 6, '0'),
    'gestionnaire',
    ih.id_hotel
FROM inserted_hotels ih
ON CONFLICT (nas) DO NOTHING;

UPDATE hotel h
SET id_gestionnaire = e.id_employe
FROM employe e
WHERE e.id_hotel = h.id_hotel
  AND e.role = 'gestionnaire'
  AND h.id_gestionnaire IS NULL;

WITH room_counts AS (
    SELECT h.id_hotel, COUNT(c.id_chambre) AS existing_rooms
    FROM hotel h
    LEFT JOIN chambre c ON c.id_hotel = h.id_hotel
    GROUP BY h.id_hotel
),
missing_rooms AS (
    SELECT
        rc.id_hotel,
        rc.existing_rooms,
        generate_series(1, GREATEST(0, 5 - rc.existing_rooms)) AS seq
    FROM room_counts rc
),
room_base AS (
    SELECT
        mr.id_hotel,
        mr.existing_rooms,
        mr.seq,
        row_number() OVER (PARTITION BY mr.id_hotel ORDER BY mr.seq) AS local_row
    FROM missing_rooms mr
)
INSERT INTO chambre (
    numero,
    capacite,
    prix,
    vue_mer,
    etendue,
    id_hotel,
    commodites,
    vue,
    lit_additionnel,
    etat,
    superficie,
    nombre_chambres,
    nom_chambre
)
SELECT
    100 + rb.existing_rooms + rb.local_row,
    ((rb.local_row - 1) % 4) + 1,
    110 + (rb.local_row * 25) + (rb.id_hotel * 3),
    (rb.local_row % 2 = 0),
    (rb.local_row % 3 = 0),
    rb.id_hotel,
    CASE
        WHEN rb.local_row % 2 = 0 THEN 'Wi-Fi, TV, climatisation, minibar'
        ELSE 'Wi-Fi, TV, climatisation'
    END,
    CASE
        WHEN rb.local_row % 2 = 0 THEN 'Mer'
        ELSE 'Ville'
    END,
    (rb.local_row % 3 = 0),
    'Excellent',
    20 + (rb.local_row * 4),
    CASE WHEN rb.local_row % 4 = 0 THEN 2 ELSE 1 END,
    CASE
        WHEN (20 + (rb.local_row * 4)) >= 42 AND (110 + (rb.local_row * 25) + (rb.id_hotel * 3)) >= 260 THEN 'Suite Deluxe'
        WHEN (20 + (rb.local_row * 4)) >= 36 AND (110 + (rb.local_row * 25) + (rb.id_hotel * 3)) >= 220 AND (((rb.local_row - 1) % 4) + 1) >= 2 THEN 'Suite Junior'
        WHEN (((rb.local_row - 1) % 4) + 1) >= 4 THEN 'Suite Familiale'
        WHEN (((rb.local_row - 1) % 4) + 1) = 3 AND (20 + (rb.local_row * 4)) >= 32 THEN 'Chambre Familiale'
        WHEN (((rb.local_row - 1) % 4) + 1) = 3 THEN 'Chambre Triple'
        WHEN (((rb.local_row - 1) % 4) + 1) = 2 AND (110 + (rb.local_row * 25) + (rb.id_hotel * 3)) >= 180 THEN 'Chambre King'
        WHEN (((rb.local_row - 1) % 4) + 1) = 2 THEN 'Chambre Double'
        WHEN (((rb.local_row - 1) % 4) + 1) = 1 AND (110 + (rb.local_row * 25) + (rb.id_hotel * 3)) >= 170 THEN 'Chambre Queen'
        ELSE 'Chambre Simple'
    END
FROM room_base rb;

UPDATE hotel h
SET nb_chambres = room_totals.total_rooms
FROM (
    SELECT id_hotel, COUNT(*) AS total_rooms
    FROM chambre
    GROUP BY id_hotel
) AS room_totals
WHERE room_totals.id_hotel = h.id_hotel;

UPDATE chaine c
SET nb_hotels = hotel_totals.total_hotels
FROM (
    SELECT id_chaine, COUNT(*) AS total_hotels
    FROM hotel
    GROUP BY id_chaine
) AS hotel_totals
WHERE hotel_totals.id_chaine = c.id_chaine;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'client_nas_key'
    ) THEN
        ALTER TABLE client
            ADD CONSTRAINT client_nas_key UNIQUE (nas);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'hotel_id_gestionnaire_fkey'
    ) THEN
        ALTER TABLE hotel
            ADD CONSTRAINT hotel_id_gestionnaire_fkey
            FOREIGN KEY (id_gestionnaire)
            REFERENCES employe(id_employe)
            ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'location_id_employe_fkey'
    ) THEN
        ALTER TABLE location
            ADD CONSTRAINT location_id_employe_fkey
            FOREIGN KEY (id_employe)
            REFERENCES employe(id_employe)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employe_hotel ON employe(id_hotel);
CREATE INDEX IF NOT EXISTS idx_hotel_chaine ON hotel(id_chaine);
CREATE INDEX IF NOT EXISTS idx_client_nas ON client(nas);

DROP TRIGGER IF EXISTS trigger_creer_location ON reservation;
DROP FUNCTION IF EXISTS creer_location_auto();

CREATE OR REPLACE FUNCTION maj_nb_hotels_chaine()
RETURNS trigger AS $$
DECLARE
    target_chain integer;
BEGIN
    target_chain := COALESCE(NEW.id_chaine, OLD.id_chaine);

    UPDATE chaine
    SET nb_hotels = (
        SELECT COUNT(*)
        FROM hotel
        WHERE id_chaine = target_chain
    )
    WHERE id_chaine = target_chain;

    IF TG_OP = 'UPDATE' AND NEW.id_chaine <> OLD.id_chaine THEN
        UPDATE chaine
        SET nb_hotels = (
            SELECT COUNT(*)
            FROM hotel
            WHERE id_chaine = OLD.id_chaine
        )
        WHERE id_chaine = OLD.id_chaine;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION maj_nb_chambres_hotel()
RETURNS trigger AS $$
DECLARE
    target_hotel integer;
BEGIN
    target_hotel := COALESCE(NEW.id_hotel, OLD.id_hotel);

    UPDATE hotel
    SET nb_chambres = (
        SELECT COUNT(*)
        FROM chambre
        WHERE id_hotel = target_hotel
    )
    WHERE id_hotel = target_hotel;

    IF TG_OP = 'UPDATE' AND NEW.id_hotel <> OLD.id_hotel THEN
        UPDATE hotel
        SET nb_chambres = (
            SELECT COUNT(*)
            FROM chambre
            WHERE id_hotel = OLD.id_hotel
        )
        WHERE id_hotel = OLD.id_hotel;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maj_nb_hotels_chaine ON hotel;
CREATE TRIGGER trigger_maj_nb_hotels_chaine
AFTER INSERT OR UPDATE OR DELETE ON hotel
FOR EACH ROW
EXECUTE FUNCTION maj_nb_hotels_chaine();

DROP TRIGGER IF EXISTS trigger_maj_nb_chambres_hotel ON chambre;
CREATE TRIGGER trigger_maj_nb_chambres_hotel
AFTER INSERT OR UPDATE OR DELETE ON chambre
FOR EACH ROW
EXECUTE FUNCTION maj_nb_chambres_hotel();

DROP VIEW IF EXISTS vue_chambres_disponibles;
CREATE VIEW vue_chambres_disponibles AS
SELECT
    split_part(h.adresse, ',', 1) AS zone,
    COUNT(*) AS nombre_chambres_disponibles
FROM chambre c
JOIN hotel h ON h.id_hotel = c.id_hotel
WHERE NOT EXISTS (
    SELECT 1
    FROM reservation r
    WHERE r.id_chambre = c.id_chambre
      AND COALESCE(LOWER(r.statut), '') <> 'annulee'
      AND CURRENT_DATE BETWEEN r.date_debut AND r.date_fin
)
AND NOT EXISTS (
    SELECT 1
    FROM location l
    WHERE l.id_chambre = c.id_chambre
      AND CURRENT_DATE BETWEEN l.date_debut AND l.date_fin
)
GROUP BY split_part(h.adresse, ',', 1);

CREATE OR REPLACE VIEW vue_capacite_totale_hotel AS
SELECT
    h.id_hotel,
    h.nom AS hotel,
    SUM(c.capacite) AS capacite_totale
FROM hotel h
LEFT JOIN chambre c ON c.id_hotel = h.id_hotel
GROUP BY h.id_hotel, h.nom;

COMMIT;
