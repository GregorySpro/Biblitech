# Jalon 3 – Modélisation de la Base de Données

**Projet :** BiblioTech
**Auteur :** Grégory Sergent
**Formation :** CDA – Concepteur Développeur d'Applications
**Période :** Janvier → Juin 2026
**Date :** 31/03/2026

---

## Sommaire

*(À générer dans Google Docs : **Insertion → Table des matières**)*

---

## 0) Évolution du périmètre fonctionnel

La phase de modélisation (Jalon 3) a conduit à affiner le périmètre défini dans le CDCF (Jalon 1). Les évolutions suivantes sont actées :

**Ajout : comptes adhérents**
Le Jalon 1 positionnait BiblioTech comme une application strictement interne au personnel. La conception de la base de données a mis en évidence la nécessité d'offrir aux adhérents un accès limité en lecture à l'application, afin de leur permettre de :

- Consulter le **catalogue et le stock** de leur bibliothèque (lecture seule, filtré par `bibliotheque_id`)
- Consulter leurs **prêts en cours** et leur historique de prêts
- Soumettre une **demande de migration** vers une autre bibliothèque

Ces actions n'impliquent aucune réservation en ligne ni modification de données — elles restent en lecture seule ou via un workflow validé par un admin. La contrainte "hors périmètre : réservation en ligne" du Jalon 1 est donc toujours respectée.

**Ce que les adhérents ne peuvent PAS faire :**
- Réserver un exemplaire
- Modifier leurs informations personnelles (géré par l'admin/bibliothécaire)
- Accéder au catalogue d'autres bibliothèques
- Accéder à toute fonctionnalité d'administration

Cette évolution est prise en compte dans le dictionnaire des données (rôle `adherent` dans `utilisateurs`) et dans la table `demandes_migration`.

---

## 1) Introduction – Démarche MERISE

La modélisation de la base de données suit la méthode **MERISE**, en trois niveaux progressifs :

- **MCD** (Modèle Conceptuel de Données) : représente les entités métier et leurs relations, sans considération technique.
- **MLD** (Modèle Logique de Données) : traduit le MCD en tables relationnelles avec clés primaires et étrangères.
- **MPD** (Modèle Physique de Données) : décline le MLD avec les types SQL concrets et les contraintes de la base cible (PostgreSQL).

Cette démarche garantit une conception rigoureuse, indépendante du SGBD dans un premier temps, avant d'être adaptée à PostgreSQL via Supabase.

---

## 2) Dictionnaire des données

Le dictionnaire des données liste l'ensemble des attributs de chaque entité, leur type générique, leur rôle et leurs contraintes.

### 2.1 Entité : bibliotheques

Représente une bibliothèque cliente de la plateforme.

- **id** – Entier – Identifiant unique – Clé primaire, auto-incrémenté
- **nom** – Texte – Nom de la bibliothèque – Obligatoire
- **adresse** – Texte – Adresse postale complète – Obligatoire
- **email_contact** – Texte – Email de contact principal – Obligatoire, unique
- **telephone** – Texte – Numéro de téléphone – Optionnel
- **date_inscription** – Date – Date d'enregistrement sur la plateforme – Obligatoire, générée automatiquement
- **actif** – Booléen – Indique si la bibliothèque est active – Par défaut : vrai

### 2.2 Entité : utilisateurs

Représente tous les comptes de la plateforme, tous rôles confondus (super-admin, admin, bibliothécaire, adhérent).

- **id** – Entier – Identifiant unique – Clé primaire, auto-incrémenté
- **nom** – Texte – Nom de famille – Obligatoire
- **prenom** – Texte – Prénom – Obligatoire
- **email** – Texte – Adresse email – Obligatoire, unique
- **mot_de_passe** – Texte – Hash du mot de passe – Obligatoire
- **role** – Énumération – Rôle de l'utilisateur : super_admin, admin, bibliothecaire, adherent – Obligatoire
- **bibliotheque_id** – Entier – Référence vers la bibliothèque – Obligatoire sauf pour super_admin (NULL autorisé)
- **date_inscription** – Date – Date de création du compte – Obligatoire, générée automatiquement
- **actif** – Booléen – Compte actif ou désactivé – Par défaut : vrai

### 2.3 Entité : livres

Catalogue global de tous les livres référencés sur la plateforme, indépendamment des bibliothèques. Les informations peuvent être pré-remplies via l'API Google Books.

- **id** – Entier – Identifiant unique – Clé primaire, auto-incrémenté
- **isbn** – Texte – Code ISBN-13 – Obligatoire, unique
- **titre** – Texte – Titre du livre – Obligatoire
- **auteur** – Texte – Nom de l'auteur principal – Obligatoire
- **editeur** – Texte – Nom de l'éditeur – Optionnel
- **annee_publication** – Entier – Année de publication – Optionnel
- **genre** – Texte – Genre littéraire – Optionnel
- **resume** – Texte long – Résumé du livre – Optionnel
- **couverture_url** – Texte – URL de l'image de couverture (fournie par Google Books) – Optionnel
- **date_ajout** – Date – Date d'ajout dans le catalogue – Obligatoire, générée automatiquement

### 2.4 Entité : exemplaires

Représente un exemplaire physique d'un livre appartenant à une bibliothèque spécifique.

- **id** – Entier – Identifiant unique – Clé primaire, auto-incrémenté
- **livre_id** – Entier – Référence vers le livre – Obligatoire, clé étrangère vers livres
- **bibliotheque_id** – Entier – Référence vers la bibliothèque propriétaire – Obligatoire, clé étrangère vers bibliotheques
- **statut** – Énumération – État de l'exemplaire : disponible, emprunte, perdu, retire – Par défaut : disponible
- **date_ajout** – Date – Date d'ajout de l'exemplaire au stock – Obligatoire, générée automatiquement
- **notes** – Texte – Observations sur l'état physique – Optionnel

### 2.5 Entité : prets

Représente l'emprunt d'un exemplaire par un adhérent.

- **id** – Entier – Identifiant unique – Clé primaire, auto-incrémenté
- **exemplaire_id** – Entier – Référence vers l'exemplaire emprunté – Obligatoire, clé étrangère vers exemplaires
- **adherent_id** – Entier – Référence vers l'adhérent emprunteur – Obligatoire, clé étrangère vers utilisateurs
- **bibliotheque_id** – Entier – Référence vers la bibliothèque concernée – Obligatoire, clé étrangère vers bibliotheques
- **date_emprunt** – Date – Date de début du prêt – Obligatoire, générée automatiquement
- **date_retour_prevue** – Date – Date de retour attendue – Obligatoire
- **date_retour_effective** – Date – Date de retour réel – Optionnel (NULL tant que non rendu)
- **statut** – Énumération – État du prêt : en_cours, rendu, en_retard – Par défaut : en_cours

### 2.6 Entité : demandes_migration

Représente une demande d'un adhérent pour changer de bibliothèque.

- **id** – Entier – Identifiant unique – Clé primaire, auto-incrémenté
- **adherent_id** – Entier – Référence vers l'adhérent demandeur – Obligatoire, clé étrangère vers utilisateurs
- **bibliotheque_source_id** – Entier – Bibliothèque actuelle de l'adhérent – Obligatoire, clé étrangère vers bibliotheques
- **bibliotheque_cible_id** – Entier – Bibliothèque souhaitée – Obligatoire, clé étrangère vers bibliotheques
- **statut** – Énumération – État de la demande : en_attente, validee, refusee – Par défaut : en_attente
- **date_demande** – Date – Date de la demande – Obligatoire, générée automatiquement
- **date_traitement** – Date – Date de validation ou refus – Optionnel (NULL tant que non traitée)
- **commentaire** – Texte – Motif de refus ou remarque de l'admin – Optionnel

---

## 3) MCD – Modèle Conceptuel de Données

> **Rôles utilisateurs** : `super_admin` (global, sans bibliothèque) · `admin` (gestion complète d'une bibliothèque) · `bibliothecaire` (livres et prêts) · `adherent` (self-service + migration)
>
> ⚠️ `super_admin` : `bibliotheque_id` est NULL — il n'appartient à aucune bibliothèque, d'où la cardinalité **(0,1)** côté utilisateur.

![MCD BiblioTech](screen_jalon3/MCD.png)

### Relations et cardinalités

- **bibliotheques – utilisateurs** : une bibliothèque peut avoir plusieurs utilisateurs (admins, bibliothécaires, adhérents) ; un utilisateur appartient à une seule bibliothèque. *(1,1) – (0,n)*
- **bibliotheques – exemplaires** : une bibliothèque possède plusieurs exemplaires ; un exemplaire appartient à une seule bibliothèque. *(1,1) – (0,n)*
- **livres – exemplaires** : un livre peut avoir plusieurs exemplaires dans différentes bibliothèques ; un exemplaire correspond à un seul livre. *(1,1) – (0,n)*
- **exemplaires – prets** : un exemplaire peut avoir plusieurs prêts (successifs) ; un prêt porte sur un seul exemplaire. *(1,1) – (0,n)*
- **utilisateurs (adhérent) – prets** : un adhérent peut avoir plusieurs prêts ; un prêt appartient à un seul adhérent. *(1,1) – (0,n)*
- **utilisateurs (adhérent) – demandes_migration** : un adhérent peut faire plusieurs demandes (successives) ; une demande appartient à un seul adhérent. *(1,1) – (0,n)*
- **bibliotheques – demandes_migration (source)** : une bibliothèque peut recevoir plusieurs demandes de départ. *(1,1) – (0,n)*
- **bibliotheques – demandes_migration (cible)** : une bibliothèque peut recevoir plusieurs demandes d'arrivée. *(1,1) – (0,n)*

---

## 4) MLD – Modèle Logique de Données

Traduction du MCD en tables relationnelles. Les clés primaires sont notées **PK**, les clés étrangères **FK**.

- **bibliotheques** (id PK, nom, adresse, email_contact, telephone, date_inscription, actif)
- **utilisateurs** (id PK, nom, prenom, email, mot_de_passe, role, bibliotheque_id FK→bibliotheques, date_inscription, actif)
- **livres** (id PK, isbn, titre, auteur, editeur, annee_publication, genre, resume, couverture_url, date_ajout)
- **exemplaires** (id PK, livre_id FK→livres, bibliotheque_id FK→bibliotheques, statut, date_ajout, notes)
- **prets** (id PK, exemplaire_id FK→exemplaires, adherent_id FK→utilisateurs, bibliotheque_id FK→bibliotheques, date_emprunt, date_retour_prevue, date_retour_effective, statut)
- **demandes_migration** (id PK, adherent_id FK→utilisateurs, bibliotheque_source_id FK→bibliotheques, bibliotheque_cible_id FK→bibliotheques, statut, date_demande, date_traitement, commentaire)

---

## 5) MPD – Modèle Physique de Données (PostgreSQL)

> **MPD PostgreSQL** — types physiques, contraintes et clés étrangères explicites.
> Toutes les FK ont `ON DELETE RESTRICT` sauf `bibliotheque_id` dans `utilisateurs` (`ON DELETE SET NULL`, pour permettre la suppression d'une bibliothèque sans supprimer le compte `super_admin`).

![MPD BiblioTech](screen_jalon3/MPD.png)

### Script SQL – CREATE TABLE

    CREATE TABLE bibliotheques (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        adresse TEXT NOT NULL,
        email_contact VARCHAR(255) NOT NULL UNIQUE,
        telephone VARCHAR(20),
        date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
        actif BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE utilisateurs (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mot_de_passe VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'bibliothecaire', 'adherent')),
        bibliotheque_id INTEGER REFERENCES bibliotheques(id) ON DELETE SET NULL,
        date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
        actif BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE livres (
        id SERIAL PRIMARY KEY,
        isbn VARCHAR(13) NOT NULL UNIQUE,
        titre VARCHAR(500) NOT NULL,
        auteur VARCHAR(255) NOT NULL,
        editeur VARCHAR(255),
        annee_publication SMALLINT,
        genre VARCHAR(100),
        resume TEXT,
        couverture_url TEXT,
        date_ajout DATE NOT NULL DEFAULT CURRENT_DATE
    );

    CREATE TABLE exemplaires (
        id SERIAL PRIMARY KEY,
        livre_id INTEGER NOT NULL REFERENCES livres(id) ON DELETE RESTRICT,
        bibliotheque_id INTEGER NOT NULL REFERENCES bibliotheques(id) ON DELETE RESTRICT,
        statut VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible', 'emprunte', 'perdu', 'retire')),
        date_ajout DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT
    );

    CREATE TABLE prets (
        id SERIAL PRIMARY KEY,
        exemplaire_id INTEGER NOT NULL REFERENCES exemplaires(id) ON DELETE RESTRICT,
        adherent_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
        bibliotheque_id INTEGER NOT NULL REFERENCES bibliotheques(id) ON DELETE RESTRICT,
        date_emprunt DATE NOT NULL DEFAULT CURRENT_DATE,
        date_retour_prevue DATE NOT NULL,
        date_retour_effective DATE,
        statut VARCHAR(20) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'rendu', 'en_retard'))
    );

    CREATE TABLE demandes_migration (
        id SERIAL PRIMARY KEY,
        adherent_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
        bibliotheque_source_id INTEGER NOT NULL REFERENCES bibliotheques(id) ON DELETE RESTRICT,
        bibliotheque_cible_id INTEGER NOT NULL REFERENCES bibliotheques(id) ON DELETE RESTRICT,
        statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
        date_demande DATE NOT NULL DEFAULT CURRENT_DATE,
        date_traitement DATE,
        commentaire TEXT
    );

---

## 6) Justifications de modélisation

- **Catalogue global + exemplaires séparés** : évite la duplication des métadonnées d'un livre présent dans plusieurs bibliothèques. Les informations (titre, auteur, ISBN) sont stockées une seule fois dans `livres`, tandis que le stock physique est géré dans `exemplaires` par bibliothèque.
- **`bibliotheque_id` dans `prets`** : redondant par rapport à `exemplaire.bibliotheque_id`, mais conservé pour simplifier et optimiser les requêtes de reporting par bibliothèque sans jointure supplémentaire.
- **`role` dans `utilisateurs`** : une seule table d'authentification pour tous les profils. Le filtre par `bibliotheque_id` garantit l'isolation des données entre bibliothèques (principe de moindre privilège, recommandation ANSSI).
- **`ON DELETE RESTRICT`** sur les clés étrangères critiques : empêche la suppression accidentelle d'une bibliothèque ou d'un exemplaire tant qu'il existe des prêts ou des adhérents rattachés.
- **Normalisation 3NF** : aucune dépendance transitive. Chaque attribut dépend uniquement de la clé primaire de sa table.
