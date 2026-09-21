# Jalon 4 – Conception de l'Application & Architecture

**Projet :** BiblioTech
**Auteur :** Grégory Sergent
**Formation :** CDA – Concepteur Développeur d'Applications
**Période :** Janvier → Juin 2026
**Date :** 30/04/2026

---

## Sommaire

1. Introduction
2. Diagrammes de cas d'utilisation
   - 2.1 Acteurs identifiés
   - 2.2 Diagramme
   - 2.3 Cas d'utilisation principaux
3. Diagrammes de séquence
   - 3.1 Enregistrer un prêt
   - 3.2 Ajouter un livre via ISBN (Google Books API)
   - 3.3 Connexion et authentification JWT
4. Diagramme de classes
   - 4.1 Vue d'ensemble
   - 4.2 Correspondance Entities ↔ MPD (Jalon 3)
   - 4.3 Principes appliqués
5. Architecture multi-couches
   - 5.1 Pattern MVC avec Symfony
   - 5.2 Architecture n-tiers
   - 5.3 Conteneurisation Docker
   - 5.4 API externe – Google Books
   - 5.5 Sécurité – Vue d'ensemble
6. Endpoints de l'API REST
   - 6.1 Authentification
   - 6.2 Bibliothèques
   - 6.3 Utilisateurs
   - 6.4 Livres
   - 6.5 Exemplaires
   - 6.6 Prêts
   - 6.7 Demandes de migration
   - 6.8 Statistiques
7. Stratégie de tests
8. Gestion des erreurs API
9. État d'avancement du développement

---

## 1) Introduction

Ce dossier constitue le livrable du **Jalon 4** : la conception technique de l'application BiblioTech. Il fait suite aux jalons précédents :

- **Jalon 1** : Cahier des charges fonctionnel (périmètre, acteurs, fonctionnalités)
- **Jalon 2** : Méthodologie de projet & conception UI/UX (maquettes, charte graphique)
- **Jalon 3** : Modélisation de la base de données (MCD, MLD, MPD PostgreSQL)

L'objectif de ce jalon est de traduire les besoins fonctionnels en **diagrammes UML** et en une **description d'architecture** technique, qui serviront de guide pour le développement (Jalon 5).

---

## 2) Diagrammes de cas d'utilisation (Use Cases UML)

### 2.1 Acteurs identifiés

BiblioTech distingue **4 rôles** avec des périmètres d'action distincts :

- **Super Admin** : gestionnaire de la plateforme SaaS globale. N'appartient à aucune bibliothèque (`bibliotheque_id = NULL`). Gère les bibliothèques clientes et peut intervenir sur tous les comptes.
- **Admin** : gestionnaire d'une bibliothèque. Gère les comptes de sa bibliothèque, valide les demandes de migration, consulte les statistiques locales.
- **Bibliothécaire** : opérateur quotidien. Gère le catalogue (livres, exemplaires) et les prêts/retours de sa bibliothèque.
- **Adhérent** : utilisateur final en lecture seule. Consulte le catalogue et ses prêts, soumet des demandes de migration.

> Les rôles sont **cumulatifs par héritage** : le Super Admin peut tout faire, l'Admin peut tout faire sauf la gestion plateforme globale, etc.

### 2.2 Diagramme

![Use Cases BiblioTech](screen_jalon4/diagramme_cas_utilisations.png)

### 2.3 Cas d'utilisation principaux

| Acteur | Cas d'utilisation |
|---|---|
| Super Admin | Gérer les bibliothèques (CRUD), gérer tous les comptes, activer/désactiver une bibliothèque, consulter stats globales |
| Admin | Gérer les comptes (admin/biblio/adhérent), valider/refuser une migration, configurer la bibliothèque |
| Bibliothécaire | Ajouter un livre (ISBN/manuel), gérer les exemplaires, enregistrer un prêt/retour, consulter les retards |
| Adhérent | Consulter le catalogue, consulter ses prêts, soumettre une demande de migration |
| Tous | Se connecter (JWT), se déconnecter |

**Relations `<<include>>` / `<<extend>>` :**
- *Ajouter un livre* `<<include>>` *Récupérer métadonnées via Google Books API* (appel systématique si ISBN fourni)
- *Enregistrer un prêt* `<<include>>` *Rechercher un adhérent / exemplaire*
- *Valider une demande de migration* `<<extend>>` *Soumettre une demande de migration* (l'admin agit en réponse à une demande existante)

---

## 3) Diagrammes de séquence

### 3.1 Séquence 1 – Enregistrer un prêt

Ce scénario illustre le flux complet d'enregistrement d'un prêt par un bibliothécaire, depuis la saisie dans l'interface React jusqu'à la mise à jour du statut de l'exemplaire en base.

**Composants impliqués :** React → `PretController` → `PretService` → `ExemplaireRepository` + `PretRepository` → PostgreSQL

**Points clés :**
- Vérification que l'exemplaire existe et est `disponible` avant création
- Transaction : création du prêt ET mise à jour du statut exemplaire (`emprunte`)
- Gestion des cas d'erreur : exemplaire non trouvé (404), exemplaire indisponible (409)

---

### 3.2 Séquence 2 – Ajouter un livre via ISBN (Google Books API)

Ce scénario couvre l'intégration de l'API externe Google Books, qui est l'API tierce imposée par le CDC technique.

**Composants impliqués :** React → `LivreController` → `GoogleBooksService` → API Google Books → `LivreService` → `LivreRepository` → PostgreSQL

**Points clés :**
- Vérification préalable que le livre n'est pas déjà dans le catalogue (unicité ISBN)
- Appel HTTP sortant vers `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
- La clé API est stockée dans la variable d'environnement `GOOGLE_BOOKS_API_KEY` (jamais en dur dans le code)
- Pré-remplissage du formulaire avec les métadonnées récupérées
- Fallback vers saisie manuelle si l'ISBN n'est pas trouvé

---

### 3.3 Séquence 3 – Connexion et authentification JWT

Ce scénario détaille le mécanisme d'authentification JWT (LexikJWTAuthenticationBundle) et son utilisation pour les requêtes authentifiées suivantes.

**Composants impliqués :** React → `AuthController` → `UtilisateurRepository` → `JWTManager` (LexikJWT)

**Points clés :**
- Vérification email + bcrypt/Argon2 hash du mot de passe
- Gestion des cas : identifiants invalides (401), compte désactivé (403)
- Payload JWT contient : `sub` (id), `email`, `role`, `bibliotheque_id`, `exp`
- Le frontend stocke le token en `localStorage` et l'injecte dans chaque requête via `Authorization: Bearer`
- Vérification RBAC (rôle + `bibliotheque_id`) sur chaque endpoint protégé

![Diagrammes de séquence BiblioTech](screen_jalon4/diagramme_de_sequences.png)

---

## 4) Diagramme de classes

### 4.1 Vue d'ensemble

Le diagramme de classes représente l'architecture interne du backend Symfony, organisée en **4 packages** :

- **Entities** : classes métier mappées par Doctrine ORM (= tables PostgreSQL du Jalon 3)
- **Repositories** : accès aux données (requêtes Doctrine DQL/SQL)
- **Services** : logique métier (règles, orchestration)
- **Controllers** : points d'entrée HTTP (routes API REST)

![Diagramme de classes BiblioTech](screen_jalon4/diagramme_de_classes.png)

### 4.2 Correspondance Entities ↔ MPD (Jalon 3)

| Entité Symfony | Table PostgreSQL |
|---|---|
| `Bibliotheque` | `bibliotheques` |
| `Utilisateur` | `utilisateurs` |
| `Livre` | `livres` |
| `Exemplaire` | `exemplaires` |
| `Pret` | `prets` |
| `DemandeMigration` | `demandes_migration` |

### 4.3 Principes appliqués

- **Single Responsibility** : chaque classe a une responsabilité unique. Ex : `GoogleBooksService` gère uniquement les appels à l'API externe, `PretService` uniquement la logique métier des prêts.
- **Dependency Injection** : les services sont injectés dans les contrôleurs via le container Symfony (pas de `new` direct).
- **Repository Pattern** : l'accès aux données est isolé dans les repositories, les services ne font jamais de requêtes SQL directes.

---

## 5) Architecture multi-couches

### 5.1 Pattern MVC avec Symfony

BiblioTech suit le pattern **MVC** adapté à une architecture API REST + SPA :

- **Modèle** : entités Doctrine (`src/Entity/`) + repositories (`src/Repository/`) + services (`src/Service/`)
- **Vue** : application React (frontend Tauri, côté client — aucun template Twig)
- **Contrôleur** : controllers Symfony (`src/Controller/`) exposant les routes `/api/*`

La logique métier est **entièrement encapsulée dans les Services**, les Controllers se limitant à valider la requête HTTP et sérialiser la réponse JSON.

### 5.2 Architecture n-tiers

    ┌──────────────────────────────────────────┐
    │  TIER 1 – Client                         │
    │  React 19 + Vite + TypeScript            │
    │  SPA web (déploiement Render)            │
    │  Appels HTTP/HTTPS vers l'API            │
    └────────────────┬─────────────────────────┘
                     │ HTTP/HTTPS (JWT Bearer)
    ┌────────────────▼─────────────────────────┐
    │  TIER 2 – Serveur applicatif             │
    │  Symfony 7 + API Platform                │
    │  PHP 8.3 + FrankenPHP / Nginx            │
    │  LexikJWT (authentification)             │
    │  Doctrine ORM (accès données)            │
    └────────────────┬─────────────────────────┘
                     │ TCP/5432 (Doctrine PDO)
    ┌────────────────▼─────────────────────────┐
    │  TIER 3 – Base de données                │
    │  PostgreSQL (Supabase)                   │
    │  6 tables, clés étrangères, contraintes  │
    └──────────────────────────────────────────┘

**Note :** Le Jalon 1 envisageait Tauri pour une application desktop native. Ce choix a été abandonné au profit d'une SPA web React 19 déployée sur Render (voir note d'évolution architecturale dans le Jalon 5).

### 5.3 Conteneurisation Docker

Trois services Docker Compose :

- **`app`** : image PHP 8.3 + Symfony + Nginx, expose le port 8080
- **`db`** : image PostgreSQL 16 (pour le développement local — en production : Supabase cloud)
- **`frontend`** : build Tauri/React pour le développement (hot-reload)

Les variables sensibles (clé API Google Books, JWT passphrase, DSN base de données) sont stockées dans `.env.local` (jamais versionné sur Git).

### 5.4 API externe – Google Books

Conformément aux exigences du CDC technique, BiblioTech intègre une API tierce externe : **Google Books API v1**.

- **Usage** : récupération automatique des métadonnées (titre, auteur, éditeur, résumé, couverture) lors de l'ajout d'un livre par ISBN
- **Sécurité** : clé API dans variable d'environnement `GOOGLE_BOOKS_API_KEY`
- **Composant** : classe `GoogleBooksService` (voir diagramme de classes §4)
- **Fallback** : si l'ISBN n'est pas trouvé, formulaire de saisie manuelle proposé

### 5.5 Sécurité – Vue d'ensemble

| Menace | Contre-mesure |
|---|---|
| Injection SQL | Doctrine ORM + requêtes préparées (aucun SQL dynamique sans paramètres) |
| XSS | React échappe les variables par défaut (pas de `dangerouslySetInnerHTML`) |
| CSRF | API REST stateless + JWT Bearer (pas de cookie session) |
| Brute force | Rate Limiter Symfony sur `/api/login` |
| Mots de passe | Hachage Argon2id via `UserPasswordHasher` Symfony |
| Secrets | Variables d'environnement `.env.local`, jamais en dur dans le code |
| RBAC | Vérification `role` + `bibliotheque_id` sur chaque endpoint Symfony |

---

## 6) Endpoints de l'API REST

L'API BiblioTech expose des routes REST sous le préfixe `/api`. Toutes les routes (sauf `/api/login`) nécessitent un header `Authorization: Bearer <token>`. Le contrôle d'accès est basé sur le champ `role` du payload JWT et, si applicable, sur `bibliotheque_id`.

### 6.1 Authentification

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| POST | `/api/login` | Aucun (public) | Authentification — retourne un token JWT |
| POST | `/api/logout` | Tout rôle | Invalidation côté client (suppression du token localStorage) |

**Body POST `/api/login` :**
```json
{ "email": "user@example.com", "password": "motdepasse" }
```
**Réponse 200 :**
```json
{ "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..." }
```

---

### 6.2 Bibliothèques

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/bibliotheques` | `super_admin` | Liste toutes les bibliothèques de la plateforme |
| POST | `/api/bibliotheques` | `super_admin` | Crée une nouvelle bibliothèque cliente |
| GET | `/api/bibliotheques/{id}` | `super_admin`, `admin` (propre) | Détail d'une bibliothèque |
| PUT | `/api/bibliotheques/{id}` | `super_admin`, `admin` (propre) | Modifie les informations d'une bibliothèque |
| DELETE | `/api/bibliotheques/{id}` | `super_admin` | Supprime (désactive) une bibliothèque |
| PATCH | `/api/bibliotheques/{id}/activer` | `super_admin` | Active ou désactive une bibliothèque |

---

### 6.3 Utilisateurs

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/utilisateurs` | `super_admin`, `admin` | Liste les utilisateurs (filtrés par `bibliotheque_id` pour admin) |
| POST | `/api/utilisateurs` | `super_admin`, `admin` | Crée un compte utilisateur |
| GET | `/api/utilisateurs/{id}` | `super_admin`, `admin`, soi-même | Détail d'un utilisateur |
| PUT | `/api/utilisateurs/{id}` | `super_admin`, `admin`, soi-même | Modifie un compte |
| DELETE | `/api/utilisateurs/{id}` | `super_admin`, `admin` | Supprime un compte |
| GET | `/api/utilisateurs/me` | Tout rôle | Profil de l'utilisateur connecté (issu du JWT) |

---

### 6.4 Livres

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/livres` | Tout rôle | Liste le catalogue de la bibliothèque (filtres : titre, auteur, ISBN) |
| POST | `/api/livres` | `bibliothecaire`, `admin` | Ajoute un livre au catalogue |
| GET | `/api/livres/{id}` | Tout rôle | Détail d'un livre |
| PUT | `/api/livres/{id}` | `bibliothecaire`, `admin` | Modifie les informations d'un livre |
| DELETE | `/api/livres/{id}` | `admin` | Supprime un livre du catalogue |
| GET | `/api/livres/isbn/{isbn}` | `bibliothecaire`, `admin` | Recherche via Google Books API et retourne les métadonnées |

---

### 6.5 Exemplaires

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/exemplaires` | Tout rôle | Liste les exemplaires (filtres : `livre_id`, `statut`) |
| POST | `/api/exemplaires` | `bibliothecaire`, `admin` | Crée un exemplaire pour un livre existant |
| GET | `/api/exemplaires/{id}` | Tout rôle | Détail d'un exemplaire |
| PUT | `/api/exemplaires/{id}` | `bibliothecaire`, `admin` | Modifie un exemplaire (statut, état) |
| DELETE | `/api/exemplaires/{id}` | `admin` | Supprime un exemplaire |

---

### 6.6 Prêts

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/prets` | `bibliothecaire`, `admin` | Liste les prêts (filtres : `adherent_id`, `statut`, `retard`) |
| POST | `/api/prets` | `bibliothecaire` | Enregistre un nouveau prêt |
| GET | `/api/prets/{id}` | `bibliothecaire`, `admin`, adhérent concerné | Détail d'un prêt |
| PATCH | `/api/prets/{id}/retour` | `bibliothecaire` | Enregistre le retour d'un exemplaire |
| GET | `/api/prets/retards` | `bibliothecaire`, `admin` | Liste les prêts en retard |
| GET | `/api/prets/adherent/{id}` | `bibliothecaire`, `admin`, adhérent concerné | Historique des prêts d'un adhérent |

---

### 6.7 Demandes de migration

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/migrations` | `admin`, `super_admin` | Liste les demandes de migration |
| POST | `/api/migrations` | `adherent` | Soumet une demande de migration vers une autre bibliothèque |
| GET | `/api/migrations/{id}` | `admin`, `super_admin`, adhérent concerné | Détail d'une demande |
| PATCH | `/api/migrations/{id}/valider` | `admin` | Valide la migration (change la `bibliotheque_id` de l'adhérent) |
| PATCH | `/api/migrations/{id}/refuser` | `admin` | Refuse la demande de migration |

---

### 6.8 Statistiques

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/stats/bibliotheque` | `admin` | Statistiques de la bibliothèque (nb livres, prêts en cours, retards, adhérents) |
| GET | `/api/stats/globales` | `super_admin` | Statistiques globales de la plateforme (nb bibliothèques, prêts totaux, utilisateurs) |

---

## 7) Stratégie de tests

### 7.1 Objectifs

La stratégie de tests vise à garantir la **fiabilité** et la **non-régression** de l'application à trois niveaux : unitaire, intégration et end-to-end. Elle s'appuie sur les outils standards de l'écosystème Symfony et React.

### 7.2 Types de tests et outils

| Type | Outil | Périmètre | Niveau |
|---|---|---|---|
| Tests unitaires backend | PHPUnit 11 | Services (PretService, GoogleBooksService, etc.) | Unitaire |
| Tests d'intégration API | Symfony WebTestCase / ApiTestCase | Endpoints REST (Controllers + BDD de test) | Intégration |
| Tests unitaires frontend | Vitest + React Testing Library | Composants React (rendering, props, events) | Unitaire |
| Tests E2E | Playwright | Scénarios utilisateur complets (login → prêt → retour) | End-to-End |

### 7.3 Couverture cible par composant

| Composant | Type de test | Scénarios prioritaires |
|---|---|---|
| `PretService` | Unitaire (PHPUnit) | Prêt OK, exemplaire indisponible, adhérent invalide |
| `GoogleBooksService` | Unitaire (PHPUnit + mock HTTP) | ISBN trouvé, ISBN inconnu, timeout API |
| `AuthController` | Intégration (WebTestCase) | Login OK (200 + JWT), mauvais mdp (401), compte désactivé (403) |
| `LivreController` | Intégration (WebTestCase) | CRUD complet, accès interdit selon rôle (403) |
| `PretController` | Intégration (WebTestCase) | POST prêt OK, POST doublon (409), PATCH retour |
| `UtilisateurController` | Intégration (WebTestCase) | Création, modification, suppression, accès `/me` |
| Composant `LoginForm` | Unitaire (Vitest) | Rendu correct, soumission formulaire, affichage erreur |
| Composant `CatalogueLivres` | Unitaire (Vitest) | Affichage liste, filtres, recherche ISBN |
| Scénario Prêt complet | E2E (Playwright) | Login biblio → recherche adhérent → enregistrer prêt → retour |
| Scénario Login | E2E (Playwright) | Login OK → redirection dashboard, Login KO → message erreur |

### 7.4 Organisation des tests

**Backend (Symfony) :**
```
dev/backend/
├── tests/
│   ├── Unit/
│   │   ├── Service/
│   │   │   ├── PretServiceTest.php
│   │   │   └── GoogleBooksServiceTest.php
│   │   └── Entity/
│   │       └── PretTest.php
│   └── Integration/
│       ├── Controller/
│       │   ├── AuthControllerTest.php
│       │   ├── LivreControllerTest.php
│       │   └── PretControllerTest.php
│       └── fixtures/         ← données de test (DataFixtures Doctrine)
```

**Frontend (React) :**
```
dev/frontend/
├── src/
│   └── __tests__/
│       ├── components/
│       │   ├── LoginForm.test.tsx
│       │   └── CatalogueLivres.test.tsx
│       └── hooks/
│           └── useAuth.test.ts
└── e2e/                      ← tests Playwright
    ├── login.spec.ts
    └── pret.spec.ts
```

### 7.5 Base de données de test

Les tests d'intégration utilisent une base PostgreSQL **dédiée** (ou SQLite en mémoire pour rapidité), alimentée par des **DataFixtures Doctrine** :
- Fixtures : 1 bibliothèque, 1 admin, 1 bibliothécaire, 2 adhérents, 5 livres, 10 exemplaires
- Réinitialisation de la base avant chaque suite de tests (`bin/console doctrine:database:drop --force --env=test`)

### 7.6 Intégration continue (CI)

Les tests seront exécutés automatiquement à chaque push via **GitHub Actions** :
- Job `test-backend` : `composer install` → `php bin/phpunit`
- Job `test-frontend` : `npm install` → `npm run test`
- Job `e2e` : `playwright install` → `playwright test` (sur environnement Docker)

---

## 8) Gestion des erreurs API

### 8.1 Format standard des réponses d'erreur

Toutes les erreurs retournées par l'API suivent un format JSON uniforme, facilitant leur traitement côté frontend React :

```json
{
  "status": 404,
  "code": "LIVRE_NOT_FOUND",
  "message": "Le livre avec l'identifiant 42 n'existe pas.",
  "details": null
}
```

Le champ `details` peut contenir des informations supplémentaires (ex : liste des champs invalides lors d'une erreur de validation).

### 8.2 Codes HTTP utilisés

| Code HTTP | Signification | Exemple d'usage |
|---|---|---|
| 200 OK | Requête réussie | GET, PUT réussis |
| 201 Created | Ressource créée | POST prêt, POST livre |
| 204 No Content | Suppression réussie | DELETE utilisateur |
| 400 Bad Request | Données invalides (validation) | Email mal formé, champ manquant |
| 401 Unauthorized | Token absent ou invalide | Requête sans JWT, token expiré |
| 403 Forbidden | Accès interdit (RBAC) | Admin tente d'accéder aux stats globales |
| 404 Not Found | Ressource inexistante | Livre, exemplaire ou prêt introuvable |
| 409 Conflict | Conflit métier | Exemplaire déjà emprunté, ISBN déjà dans le catalogue |
| 422 Unprocessable Entity | Règle métier violée | Prêt impossible (adhérent a déjà 3 prêts en cours) |
| 500 Internal Server Error | Erreur serveur inattendue | Echec appel Google Books API, erreur BDD |

### 8.3 Catalogue des erreurs métier

| Code erreur | HTTP | Description |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email ou mot de passe incorrect |
| `AUTH_ACCOUNT_DISABLED` | 403 | Compte désactivé par un admin |
| `AUTH_TOKEN_EXPIRED` | 401 | Token JWT expiré |
| `LIVRE_NOT_FOUND` | 404 | Livre introuvable en base |
| `LIVRE_ISBN_DUPLICATE` | 409 | Un livre avec cet ISBN existe déjà |
| `LIVRE_ISBN_NOT_FOUND_GOOGLE` | 404 | ISBN non trouvé dans Google Books API |
| `EXEMPLAIRE_NOT_FOUND` | 404 | Exemplaire introuvable |
| `EXEMPLAIRE_UNAVAILABLE` | 409 | Exemplaire déjà emprunté ou hors service |
| `PRET_NOT_FOUND` | 404 | Prêt introuvable |
| `PRET_ALREADY_RETURNED` | 409 | Retour déjà enregistré pour ce prêt |
| `PRET_MAX_REACHED` | 422 | L'adhérent a atteint le nombre maximum de prêts simultanés |
| `USER_NOT_FOUND` | 404 | Utilisateur introuvable |
| `USER_EMAIL_DUPLICATE` | 409 | Un compte avec cet email existe déjà |
| `MIGRATION_NOT_FOUND` | 404 | Demande de migration introuvable |
| `MIGRATION_ALREADY_PROCESSED` | 409 | Demande déjà validée ou refusée |
| `BIBLIOTHEQUE_NOT_FOUND` | 404 | Bibliothèque introuvable |
| `ACCESS_DENIED` | 403 | Action non autorisée pour ce rôle |
| `GOOGLE_BOOKS_API_ERROR` | 500 | Echec de la communication avec Google Books API |

---

## 9) État d'avancement du développement

La phase de conception étant finalisée avec ce livrable, le développement débutera immédiatement après validation du Jalon 4. La structure du projet a été mise en place pour permettre un démarrage rapide :

- Structure des dossiers du projet créée (`dev/backend`, `dev/frontend`)
- Architecture définie et documentée dans ce livrable (Controllers, Services, Entities, Repositories)
- Base de données modélisée et prête à être implémentée (MPD Jalon 3)
- Docker Compose à configurer (services : `app`, `db`, `frontend`)

Le développement complet des fonctionnalités sera livré au **Jalon 5 (mai 2026)**.
