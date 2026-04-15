BEGIN;

DROP VIEW IF EXISTS vue_capacite_totale_hotel;
DROP VIEW IF EXISTS vue_chambres_disponibles;

DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS employe CASCADE;
DROP TABLE IF EXISTS chambre CASCADE;
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS hotel CASCADE;
DROP TABLE IF EXISTS chaine CASCADE;

CREATE TABLE chaine (
    id_chaine serial PRIMARY KEY,
    nom varchar(100) NOT NULL UNIQUE,
    adresse_siege text NOT NULL,
    nb_hotels integer NOT NULL DEFAULT 0 CHECK (nb_hotels >= 0),
    email text NOT NULL,
    telephone varchar(20) NOT NULL
);

CREATE TABLE hotel (
    id_hotel serial PRIMARY KEY,
    nom varchar(150) NOT NULL,
    categorie integer NOT NULL CHECK (categorie BETWEEN 1 AND 5),
    adresse text NOT NULL,
    email text NOT NULL,
    telephone varchar(20) NOT NULL,
    nb_chambres integer NOT NULL DEFAULT 0 CHECK (nb_chambres >= 0),
    id_chaine integer NOT NULL REFERENCES chaine(id_chaine) ON DELETE CASCADE,
    id_gestionnaire integer
);

CREATE TABLE client (
    id_client serial PRIMARY KEY,
    nom varchar(100) NOT NULL,
    prenom varchar(100) NOT NULL,
    adresse text NOT NULL,
    email text UNIQUE,
    telephone varchar(20),
    nas varchar(20) NOT NULL UNIQUE,
    date_inscription date NOT NULL DEFAULT CURRENT_DATE,
    type_piece_identite varchar(50) NOT NULL DEFAULT 'unknown',
    numero_piece_identite varchar(50) NOT NULL
);

CREATE TABLE chambre (
    id_chambre serial PRIMARY KEY,
    numero integer NOT NULL,
    capacite integer NOT NULL CHECK (capacite > 0),
    prix numeric(10,2) NOT NULL CHECK (prix >= 0),
    vue_mer boolean NOT NULL DEFAULT false,
    etendue boolean NOT NULL DEFAULT false,
    id_hotel integer NOT NULL REFERENCES hotel(id_hotel) ON DELETE CASCADE,
    commodites text,
    vue varchar(100),
    lit_additionnel boolean NOT NULL DEFAULT false,
    etat text NOT NULL DEFAULT 'Excellent',
    superficie numeric(10,2) NOT NULL DEFAULT 0 CHECK (superficie >= 0),
    nombre_chambres integer NOT NULL DEFAULT 1 CHECK (nombre_chambres >= 1),
    nom_chambre varchar(120) NOT NULL DEFAULT 'Chambre',
    CONSTRAINT chambre_hotel_numero_key UNIQUE (id_hotel, numero)
);

CREATE TABLE employe (
    id_employe serial PRIMARY KEY,
    nom_complet varchar(150) NOT NULL,
    adresse text,
    nas varchar(20) NOT NULL UNIQUE,
    role varchar(50) NOT NULL,
    id_hotel integer NOT NULL REFERENCES hotel(id_hotel) ON DELETE CASCADE
);

ALTER TABLE hotel
    ADD CONSTRAINT hotel_id_gestionnaire_fkey
    FOREIGN KEY (id_gestionnaire)
    REFERENCES employe(id_employe)
    ON DELETE SET NULL;

CREATE TABLE reservation (
    id_reservation serial PRIMARY KEY,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    date_reservation date NOT NULL DEFAULT CURRENT_DATE,
    statut varchar(50) NOT NULL DEFAULT 'Réservée',
    id_client integer NOT NULL REFERENCES client(id_client) ON DELETE CASCADE,
    id_chambre integer NOT NULL REFERENCES chambre(id_chambre) ON DELETE CASCADE,
    CHECK (date_fin >= date_debut)
);

CREATE TABLE location (
    id_location serial PRIMARY KEY,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    date_checkin date NOT NULL,
    id_client integer NOT NULL REFERENCES client(id_client) ON DELETE CASCADE,
    id_chambre integer NOT NULL REFERENCES chambre(id_chambre) ON DELETE CASCADE,
    id_reservation integer REFERENCES reservation(id_reservation) ON DELETE SET NULL,
    id_employe integer REFERENCES employe(id_employe) ON DELETE SET NULL,
    CHECK (date_fin >= date_debut),
    CHECK (date_checkin >= date_debut)
);

INSERT INTO chaine (id_chaine, nom, adresse_siege, nb_hotels, email, telephone) VALUES
    (1, 'Hilton', '7930 Jones Branch Dr, McLean, VA, USA', 0, 'contact@hilton.example', '18004458667'),
    (2, 'Marriott', '10400 Fernwood Rd, Bethesda, MD, USA', 0, 'contact@marriott.example', '18005309454'),
    (3, 'Hyatt', '150 N Riverside Plaza, Chicago, IL, USA', 0, 'contact@hyatt.example', '13127807500'),
    (4, 'Sheraton', '1 Starwood Dr, Stamford, CT, USA', 0, 'contact@sheraton.example', '18003253535'),
    (5, 'Holiday Inn', '3 Ravinia Dr, Atlanta, GA, USA', 0, 'contact@holidayinn.example', '18004654329');

SELECT setval('chaine_id_chaine_seq', COALESCE((SELECT MAX(id_chaine) FROM chaine), 1), true);

COMMIT;
