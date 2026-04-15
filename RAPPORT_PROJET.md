# Rapport de projet - CSI2532 - eHotels

## 1. Presentation du projet

Le projet eHotels est une application web de gestion hoteliere permettant :

- la recherche de chambres disponibles
- la creation de reservations
- la creation de locations directes
- la conversion d'une reservation en location
- la gestion des clients, employes, hotels et chambres

Le projet combine une base de donnees relationnelle PostgreSQL, un backend PHP et une interface web en HTML, CSS et JavaScript.

## 2. SGBD utilise

Le systeme de gestion de base de donnees utilise est **PostgreSQL**.

Le projet exploite notamment :

- les tables relationnelles pour les entites principales
- les cles primaires et etrangeres
- les index
- les triggers
- les vues SQL
- certaines fonctionnalites PostgreSQL comme `daterange`

## 3. Technologies utilisees

- **Base de donnees** : PostgreSQL
- **Backend** : PHP 8
- **Connexion a la base** : PDO avec `pdo_pgsql`
- **Frontend** : HTML, CSS, JavaScript
- **Serveur local** : serveur web integre de PHP

## 4. Organisation du depot

- `frontend/` : pages HTML, styles CSS et logique JavaScript
- `backend/` : points d'entree PHP et logique de connexion a la base
- `database/` : scripts SQL de creation, migration, index, triggers et vues

## 5. Fonctionnalites implementees

- recherche de chambres avec filtres combines
- reservation d'une chambre
- location directe
- conversion reservation -> location
- gestion des clients
- gestion des employes
- gestion des hotels
- gestion des chambres

## 6. Guide d'installation

### 6.1 Prerequis

Pour executer le projet, il faut disposer de :

- PostgreSQL
- PHP 8 ou plus recent
- l'extension PHP `pdo_pgsql`
- l'outil `psql`

### 6.2 Configuration locale PostgreSQL

Le projet utilise un fichier local de configuration :

```text
backend/db.local.php
```

Si ce fichier n'existe pas, il peut etre cree a partir du modele fourni :

```bash
cp backend/db.local.example.php backend/db.local.php
```

Exemple de configuration :

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

### 6.3 Reconstruction complete de la base depuis zero

Creer d'abord une base PostgreSQL nommee `ehotels` :

```bash
createdb ehotels
```

Puis executer le script principal de reconstruction :

```bash
psql -v ON_ERROR_STOP=1 -d ehotels -f database/rebuild_from_scratch.sql
```

Ce script rejoue automatiquement :

- `database/000_init_schema.sql`
- `database/2026-04-08_conformity_migration.sql`
- `database/2026-04-11_employee_role_casing_migration.sql`
- `database/2026-04-11_reservation_status_casing_migration.sql`

### 6.4 Demarrage de l'application

Depuis la racine du projet :

```bash
php -S localhost:8000 -t .
```

Ensuite ouvrir :

```text
http://localhost:8000/frontend/index.html
```

### 6.5 Procedure minimale pour le correcteur

Les commandes minimales pour ouvrir le projet sont :

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

## 7. DDL et creation de la base de donnees

### 7.1 Script principal de creation

Le projet contient maintenant un vrai point d'entree de reconstruction complete :

```text
database/rebuild_from_scratch.sql
```

Ce fichier permet de reconstruire toute la base a partir de zero avec les fichiers du depot uniquement.

### 7.2 Script de schema initial

Le fichier :

```text
database/000_init_schema.sql
```

cree les tables de base suivantes :

- `chaine`
- `hotel`
- `client`
- `chambre`
- `employe`
- `reservation`
- `location`

Il insere egalement les 5 chaines hotelieres de depart.

### 7.3 Scripts SQL complementaires

Le script de migration principal :

```text
database/2026-04-08_conformity_migration.sql
```

ajoute ou complete :

- certaines colonnes
- des donnees de conformite
- les hotels
- les chambres
- les employes gestionnaires
- les index
- les triggers
- les vues

Les deux autres scripts servent a normaliser :

- la casse des roles d'employes
- la casse des statuts de reservation

## 8. Structure logique de la base

### Chaine

Principaux attributs :

- `id_chaine`
- `nom`
- `adresse_siege`
- `nb_hotels`
- `email`
- `telephone`

### Hotel

Principaux attributs :

- `id_hotel`
- `nom`
- `categorie`
- `adresse`
- `email`
- `telephone`
- `nb_chambres`
- `id_chaine`
- `id_gestionnaire`

### Chambre

Principaux attributs :

- `id_chambre`
- `numero`
- `capacite`
- `prix`
- `vue_mer`
- `etendue`
- `id_hotel`
- `commodites`
- `vue`
- `lit_additionnel`
- `etat`
- `superficie`
- `nombre_chambres`
- `nom_chambre`

### Client

Principaux attributs :

- `id_client`
- `nom`
- `prenom`
- `adresse`
- `email`
- `telephone`
- `nas`
- `date_inscription`
- `type_piece_identite`
- `numero_piece_identite`

### Employe

Principaux attributs :

- `id_employe`
- `nom_complet`
- `adresse`
- `nas`
- `role`
- `id_hotel`

### Reservation

Principaux attributs :

- `id_reservation`
- `date_debut`
- `date_fin`
- `date_reservation`
- `statut`
- `id_client`
- `id_chambre`

### Location

Principaux attributs :

- `id_location`
- `date_debut`
- `date_fin`
- `date_checkin`
- `id_client`
- `id_chambre`
- `id_reservation`
- `id_employe`

## 9. Relations principales

- une chaine possede plusieurs hotels
- un hotel appartient a une chaine
- un hotel possede plusieurs chambres
- un hotel peut avoir un gestionnaire
- un client peut avoir plusieurs reservations
- un client peut avoir plusieurs locations
- une reservation est liee a une chambre
- une location est liee a une chambre
- une location peut provenir d'une reservation
- une location peut etre associee a un employe

## 10. Code SQL complet fourni

Le code SQL du projet est contenu dans :

- `database/000_init_schema.sql`
- `database/rebuild_from_scratch.sql`
- `database/2026-04-08_conformity_migration.sql`
- `database/2026-04-11_employee_role_casing_migration.sql`
- `database/2026-04-11_reservation_status_casing_migration.sql`

Ces fichiers couvrent :

- la creation initiale du schema
- la reconstruction complete depuis zero
- les migrations de conformite
- les insertions de donnees de depart
- les index
- les triggers
- les vues SQL

## 11. Index, triggers et vues

### Index

Les index incluent notamment :

- `idx_employe_hotel`
- `idx_hotel_chaine`
- `idx_client_nas`

### Triggers

Les triggers maintiennent automatiquement :

- le nombre d'hotels par chaine
- le nombre de chambres par hotel

### Vues

Le projet contient les deux vues demandees :

- `vue_chambres_disponibles`
- `vue_capacite_totale_hotel`

## 12. Resultat de la reconstruction

Apres execution de `database/rebuild_from_scratch.sql`, la base reconstruite contient :

- 5 chaines
- 40 hotels
- 200 chambres
- 40 employes

## 13. Description du code de l'application

### Frontend

Le frontend est compose de pages HTML et d'un fichier JavaScript principal qui :

- recupere les donnees depuis le backend
- affiche les resultats de recherche
- envoie les formulaires de creation et de mise a jour
- gere les pages de consultation et d'administration

### Backend

Le backend PHP contient notamment :

- `backend/search_rooms.php`
- `backend/create_reservation.php`
- `backend/create_rental.php`
- `backend/convert_reservation.php`
- `backend/clients.php`
- `backend/employees.php`
- `backend/hotels.php`
- `backend/rooms.php`
- `backend/reservations.php`
- `backend/locations.php`

Le fichier `backend/db.php` centralise la connexion PostgreSQL et plusieurs fonctions utilitaires communes.

## 14. Conclusion

Le depot contient :

- le code de l'application
- le code SQL complet
- un script de reconstruction complete depuis zero
- un guide d'installation clair

Le projet peut donc etre reconstruit et execute uniquement a partir des fichiers fournis dans le depot.
