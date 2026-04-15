# eHotels

Projet du cours CSI2532 - Bases de donnees I.

Cette application permet de rechercher des chambres, creer des reservations, creer des locations, convertir une reservation en location, et gerer les clients, employes, hotels et chambres.

Projet complété par:

Evan Buchanan - 300303602
Dalya Atrouche - 300294003

## Technologies utilisees

- Base de donnees : PostgreSQL
- Backend : PHP 8 avec PDO (`pdo_pgsql`)
- Frontend : HTML, CSS, JavaScript
- Serveur local : serveur web integre de PHP

## Structure du depot

- `frontend/` : pages HTML, CSS et JavaScript
- `backend/` : API PHP et connexion a la base de donnees
- `database/` : scripts SQL de creation, migration, index, triggers et vues

## Demarrage rapide

Depuis la racine du projet, suivre ces etapes.

### 1. Creer la base PostgreSQL

```bash
createdb ehotels
```

### 2. Configurer la connexion a la base

Creer le fichier local de configuration si necessaire :

```bash
cp backend/db.local.example.php backend/db.local.php
```

Puis modifier `backend/db.local.php` avec vos parametres PostgreSQL.

Exemple :

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

### 3. Reconstruire toute la base depuis zero

Executer le script principal de reconstruction :

```bash
psql -v ON_ERROR_STOP=1 -d ehotels -f database/rebuild_from_scratch.sql
```

Ce script execute automatiquement :

- `database/000_init_schema.sql`
- `database/2026-04-08_conformity_migration.sql`
- `database/2026-04-11_employee_role_casing_migration.sql`
- `database/2026-04-11_reservation_status_casing_migration.sql`

### 4. Demarrer l'application

```bash
php -S localhost:8000 -t .
```

### 5. Ouvrir le site

Ouvrir dans le navigateur :

```text
http://localhost:8000/frontend/index.html
```

## Ce que le correcteur doit faire

Si le projet est ouvert sur une machine avec PostgreSQL et PHP installes, les commandes minimales sont :

```bash
createdb ehotels
cp backend/db.local.example.php backend/db.local.php
psql -v ON_ERROR_STOP=1 -d ehotels -f database/rebuild_from_scratch.sql
php -S localhost:8000 -t .
```

Puis ouvrir :

```text
http://localhost:8000/frontend/index.html
```

## Contenu reconstruit par le script SQL

Apres execution de `database/rebuild_from_scratch.sql`, la base contient :

- 5 chaines hotelieres
- 40 hotels
- 200 chambres
- 40 employes

Les scripts SQL incluent aussi :

- les contraintes principales
- 3 index
- 2 triggers
- 2 vues SQL

## Fichiers SQL importants

- `database/000_init_schema.sql` : creation initiale du schema relationnel de base
- `database/rebuild_from_scratch.sql` : reconstruction complete de la base depuis zero
- `database/2026-04-08_conformity_migration.sql` : migration principale, vues, index, triggers et donnees
- `database/2026-04-11_employee_role_casing_migration.sql` : normalisation des roles des employes
- `database/2026-04-11_reservation_status_casing_migration.sql` : normalisation des statuts de reservation

## Fonctionnalites principales

- Recherche de chambres avec filtres
- Reservation d'une chambre
- Location directe
- Conversion reservation vers location
- Gestion des clients
- Gestion des employes
- Gestion des hotels
- Gestion des chambres

## Remarques utiles

- Il faut servir la racine du projet avec `php -S localhost:8000 -t .` pour que le frontend puisse appeler correctement le dossier `backend/`.
- Le fichier `backend/db.local.php` est un fichier local de configuration et est ignore par Git.
- Si les pages s'affichent mais que les donnees ne se chargent pas, verifier d'abord la configuration PostgreSQL et l'execution du script `database/rebuild_from_scratch.sql`.
