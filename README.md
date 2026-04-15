# eHotels

Projet du cours CSI2532 - Bases de donnees I.

Cette application permet de consulter des chambres, effectuer des reservations et des locations, convertir une reservation en location, et gerer les donnees de clients, employes, hotels et chambres.

## Technologies utilisees

- Base de donnees : PostgreSQL
- Backend : PHP 8 avec PDO (`pdo_pgsql`)
- Frontend : HTML, CSS, JavaScript
- Serveur local de developpement : serveur integre de PHP

## Structure du projet

- `frontend/` : pages HTML, feuilles de style et logique JavaScript cote client
- `backend/` : points d'entree API en PHP et connexion a la base de donnees
- `database/` : scripts SQL, vues, index, triggers et migrations complementaires

## Fonctionnalites principales

- Recherche de chambres avec filtres
- Reservation d'une chambre
- Location directe d'une chambre
- Conversion reservation vers location
- Gestion des clients
- Gestion des employes
- Gestion des hotels
- Gestion des chambres

## Prerequis

- PHP 8 ou plus recent
- Extension PHP `pdo_pgsql`
- PostgreSQL
- `psql` pour executer les scripts SQL

## Configuration locale

Le projet utilise un fichier local `backend/db.local.php` pour la configuration PostgreSQL.

Le fichier d'exemple fourni est :

```bash
backend/db.local.example.php
```

Si `backend/db.local.php` n'existe pas encore, creez-le avec :

```bash
cp backend/db.local.example.php backend/db.local.php
```

Ensuite, modifiez `backend/db.local.php` pour y mettre vos parametres PostgreSQL :

```php
<?php

declare(strict_types=1);

return [
    'host' => '',
    'port' => '',
    'dbname' => 'ehotels',
    'user' => 'votre-utilisateur-postgres',
    'password' => '',
];
```

Note :
- `backend/db.local.php` est un fichier local et ne devrait pas etre partage avec des secrets personnels.
- Dans ce projet, il est ignore par Git via `.gitignore`.

## Installation de la base de donnees

1. Creez une base PostgreSQL nommee `ehotels`.

Exemple :

```bash
createdb ehotels
```

2. Executez ensuite les scripts SQL disponibles dans le dossier `database/` :

```bash
psql -d ehotels -f database/2026-04-08_conformity_migration.sql
psql -d ehotels -f database/2026-04-11_employee_role_casing_migration.sql
psql -d ehotels -f database/2026-04-11_reservation_status_casing_migration.sql
```

## Contenu SQL inclus

Les scripts SQL presents dans `database/` incluent notamment :

- des modifications de schema avec `ALTER TABLE`
- la creation de la table `employe`
- des contraintes supplementaires
- 3 index
- 2 triggers
- 2 vues SQL
- des insertions et mises a jour de donnees de conformite

Exemples presents dans `database/2026-04-08_conformity_migration.sql` :

- Index :
  - `idx_employe_hotel`
  - `idx_hotel_chaine`
  - `idx_client_nas`
- Triggers :
  - `trigger_maj_nb_hotels_chaine`
  - `trigger_maj_nb_chambres_hotel`
- Vues :
  - `vue_chambres_disponibles`
  - `vue_capacite_totale_hotel`

## Point important sur l'initialisation SQL

Les scripts fournis dans `database/` ressemblent a des scripts de conformite et de migration, pas a un script complet de creation initiale de toute la base depuis zero.

Autrement dit :

- ils supposent que certaines tables principales existent deja, comme `chaine`, `hotel`, `client`, `chambre`, `reservation` et `location`
- ils ajoutent ensuite des colonnes, des contraintes, des triggers, des vues, des index et des donnees complementaires

Si la base de depart est completement vide, un script DDL initial supplementaire peut etre necessaire selon l'environnement de correction.

## Demarrage de l'application

Depuis la racine du projet, lancez le serveur web integre de PHP :

```bash
php -S localhost:8000 -t .
```

Puis ouvrez dans le navigateur :

```text
http://localhost:8000/frontend/index.html
```

## Utilisation

- La page d'accueil se trouve dans `frontend/index.html`
- Le frontend communique avec les fichiers PHP du dossier `backend/`
- Il faut servir la racine du projet avec `-t .` afin que les appels du frontend vers `../backend` fonctionnent correctement

## Guide rapide de verification

1. Demarrer PostgreSQL
2. Verifier la configuration dans `backend/db.local.php`
3. Executer les scripts SQL du dossier `database/`
4. Lancer `php -S localhost:8000 -t .`
5. Ouvrir `http://localhost:8000/frontend/index.html`

Si une page s'affiche mais que les donnees ne se chargent pas, verifier :

- les identifiants PostgreSQL
- l'existence de la base `ehotels`
- l'execution correcte des scripts SQL
- la presence de l'extension PHP `pdo_pgsql`

## Remarque pour la remise

Ce depot contient le code de l'application web, les points d'entree backend PHP, ainsi que les scripts SQL complementaires utilises pour les vues, les index, les triggers et la mise en conformite des donnees.

Pour une remise finale, il est recommande d'accompagner ce depot d'un court rapport PDF contenant :

- le SGBD utilise
- les technologies utilisees
- le guide d'installation
- le schema ou le DDL initial complet, si celui-ci est fourni separement
