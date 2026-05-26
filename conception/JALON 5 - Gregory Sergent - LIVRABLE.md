# Jalon 5 – Développement, Sécurité & Tests

**Projet :** BiblioTech
**Auteur :** Grégory Sergent
**Organisme de formation :** IPSSI Grande École d'Informatique
**Formation :** CDA – Concepteur Développeur d'Applications
**Période :** Janvier → Juin 2026
**Date :** 31 mai 2026
**Statut :** Version 1.0

---

## Sommaire

1. Introduction
2. Ce qui a été développé
   - 2.1 Vue d'ensemble
   - 2.2 Entités Doctrine développées
   - 2.3 Endpoints implémentés
   - 2.4 Services métier
   - 2.5 Frontend React
3. Sécurité
   - 3.1 Authentification JWT & Refresh Token
   - 3.2 Contrôle d'accès (RBAC)
   - 3.3 Protection OWASP Top 10
   - 3.4 Validation des entrées
   - 3.5 Conformité RGPD
4. Tests
5. Infrastructure & Déploiement
6. État d'avancement global
7. Conclusion

---

## 1) Introduction

Ce livrable constitue le **Jalon 5** du projet BiblioTech. Il couvre le développement complet du backend Symfony, l'implémentation des mesures de sécurité, et la stratégie de tests appliquée.

Les jalons précédents avaient posé les bases :

- **Jalon 1** : Cahier des charges fonctionnel
- **Jalon 2** : Méthodologie & conception UI/UX (maquettes, charte graphique)
- **Jalon 3** : Modélisation de la base de données (MCD, MLD, MPD PostgreSQL)
- **Jalon 4** : Conception UML & architecture technique (use cases, séquences, classes, endpoints REST)

Le **Jalon 5** marque la réalisation concrète :

- Implémentation de l'**API REST Symfony 7** (Controllers, Services, Entities, Repositories)
- Implémentation des mécanismes de **sécurité** (JWT, RBAC, OWASP)
- Rédaction et exécution des **tests unitaires et d'intégration**
- Le **frontend React** (application desktop Tauri) avait été développé en avance ; il est désormais **connecté au backend** via axios (appels réels à l'API REST)

---

## 2) Ce qui a été développé

### 2.1 Vue d'ensemble

L'API BiblioTech suit une architecture **MVC stricte** sur Symfony 7 + API Platform :

```
backend/
├── src/
│   ├── Controller/         # Points d'entrée HTTP (/api/*)
│   │   ├── AuthController.php
│   │   ├── BibliothequeController.php
│   │   ├── UtilisateurController.php
│   │   ├── LivreController.php
│   │   ├── ExemplaireController.php
│   │   ├── PretController.php
│   │   ├── DemandeMigrationController.php
│   │   └── StatController.php
│   ├── Entity/             # Entités Doctrine (= tables PostgreSQL)
│   │   ├── Bibliotheque.php
│   │   ├── Utilisateur.php
│   │   ├── Livre.php
│   │   ├── Exemplaire.php
│   │   ├── Pret.php
│   │   ├── DemandeMigration.php
│   │   └── RefreshToken.php
│   ├── Repository/         # Requêtes Doctrine
│   │   ├── BibliothequeRepository.php
│   │   ├── UtilisateurRepository.php
│   │   ├── LivreRepository.php
│   │   ├── ExemplaireRepository.php
│   │   ├── PretRepository.php
│   │   ├── DemandeMigrationRepository.php
│   │   └── RefreshTokenRepository.php
│   ├── Service/            # Logique métier
│   │   ├── PretService.php
│   │   └── GoogleBooksService.php
│   ├── EventSubscriber/    # Écouteurs d'événements Symfony
│   │   └── JwtCreatedSubscriber.php
│   └── DTO/                # Data Transfer Objects (validation)
│       ├── LoginDTO.php
│       ├── CreatePretDTO.php
│       ├── CreateLivreDTO.php
│       └── CreateUtilisateurDTO.php
├── config/
│   ├── packages/
│   │   ├── security.yaml
│   │   ├── doctrine.yaml
│   │   └── lexik_jwt_authentication.yaml
│   ├── routes.yaml
│   └── services.yaml
├── migrations/
│   ├── Version20260501000000.php
│   └── Version20260526000000.php
└── tests/
    ├── Unit/
    │   └── Service/
    │       ├── PretServiceTest.php
    │       └── GoogleBooksServiceTest.php
    └── Integration/
        └── Controller/
            ├── AuthControllerTest.php
            ├── LivreControllerTest.php
            └── PretControllerTest.php
```

### 2.2 Entités Doctrine développées

Les 6 entités correspondent exactement au MPD défini au Jalon 3 :

| Entité | Table | Relations principales |
|---|---|---|
| `Bibliotheque` | `bibliotheques` | OneToMany → Utilisateur, Livre |
| `Utilisateur` | `utilisateurs` | ManyToOne → Bibliotheque ; OneToMany → Pret, DemandeMigration, RefreshToken |
| `Livre` | `livres` | ManyToOne → Bibliotheque ; OneToMany → Exemplaire |
| `Exemplaire` | `exemplaires` | ManyToOne → Livre ; OneToMany → Pret |
| `Pret` | `prets` | ManyToOne → Utilisateur, Exemplaire |
| `DemandeMigration` | `demandes_migration` | ManyToOne → Utilisateur (demandeur + biblio source/cible) |
| `RefreshToken` | `refresh_tokens` | ManyToOne → Utilisateur (CASCADE DELETE) |

### 2.3 Endpoints implémentés

L'intégralité des endpoints définis au Jalon 4 a été développée. Résumé par contrôleur :

**`AuthController`**
- `POST /api/login` — Authentification, retour JWT + refresh token
- `POST /api/token/refresh` — Rotation du refresh token, retour nouveau JWT + refresh token
- `POST /api/logout` — Invalidation du refresh token côté serveur

**`BibliothequeController`** *(super_admin)*
- `GET /api/bibliotheques` — Liste toutes les bibliothèques
- `POST /api/bibliotheques` — Création
- `GET /api/bibliotheques/{id}` — Détail
- `PUT /api/bibliotheques/{id}` — Modification
- `DELETE /api/bibliotheques/{id}` — Suppression
- `PATCH /api/bibliotheques/{id}/activer` — Activation/désactivation

**`UtilisateurController`**
- `GET /api/utilisateurs` — Liste (filtrée par `bibliotheque_id` pour admin)
- `POST /api/utilisateurs` — Création de compte
- `GET /api/utilisateurs/{id}` — Détail
- `PUT /api/utilisateurs/{id}` — Modification
- `DELETE /api/utilisateurs/{id}` — Suppression
- `GET /api/utilisateurs/me` — Profil de l'utilisateur connecté

**`LivreController`**
- `GET /api/livres` — Catalogue (accessible à tous)
- `POST /api/livres` — Ajout manuel ou via ISBN
- `GET /api/livres/{id}` — Détail
- `PUT /api/livres/{id}` — Modification
- `DELETE /api/livres/{id}` — Suppression
- `GET /api/livres/isbn/{isbn}` — Recherche Google Books API

**`ExemplaireController`**
- `GET /api/exemplaires` — Liste avec filtres
- `POST /api/exemplaires` — Création
- `GET /api/exemplaires/{id}` — Détail
- `PUT /api/exemplaires/{id}` — Modification
- `DELETE /api/exemplaires/{id}` — Suppression

**`PretController`**
- `GET /api/prets` — Liste des prêts (filtrés par rôle)
- `POST /api/prets` — Enregistrement d'un prêt
- `GET /api/prets/{id}` — Détail d'un prêt
- `PATCH /api/prets/{id}/retour` — Enregistrement du retour
- `GET /api/prets/retards` — Prêts en retard
- `GET /api/prets/adherent/{id}` — Historique d'un adhérent

**`DemandeMigrationController`**
- `GET /api/migrations` — Liste des demandes
- `POST /api/migrations` — Soumettre une demande
- `GET /api/migrations/{id}` — Détail
- `PATCH /api/migrations/{id}/valider` — Validation
- `PATCH /api/migrations/{id}/refuser` — Refus

**`StatController`**
- `GET /api/stats/bibliotheque` — Stats de la bibliothèque (admin)
- `GET /api/stats/globales` — Stats globales (super_admin)

### 2.4 Services métier

**`PretService`** — Logique complète de gestion des prêts :
- Vérification de la disponibilité de l'exemplaire avant création
- Transaction atomique : création du prêt + mise à jour statut exemplaire (`emprunte`)
- Vérification du nombre maximum de prêts simultanés par adhérent (règle métier : 5 max)
- Calcul de la date de retour prévue (J+21 par défaut, configurable)
- Enregistrement du retour : mise à jour statut exemplaire → `disponible`
- Détection automatique des prêts en retard (`date_retour_prevue < now()`)

**`GoogleBooksService`** — Intégration API externe :
- Appel HTTP vers `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
- Clé API depuis variable d'environnement `GOOGLE_BOOKS_API_KEY` (jamais en dur)
- Mapping des champs retournés (titre, auteur, éditeur, description, couverture)
- Gestion des cas : ISBN introuvable (404), timeout (500), quota dépassé
- Fallback documenté : si l'appel échoue, l'utilisateur bascule sur la saisie manuelle

### 2.5 Frontend React (état d'avancement)

Le frontend avait été développé en avance de phase. Il est fonctionnel et complet :

| Fonctionnalité | Statut |
|---|---|
| Authentification (login/logout + refresh token) | ✅ Complet |
| Tableau de bord (vue staff + adhérent) | ✅ Complet |
| Catalogue (lecture + CRUD conditionnel par rôle) | ✅ Complet |
| Prêts/Retours (filtré par rôle) | ✅ Complet |
| Adhérents (super_admin + admin uniquement) | ✅ Complet |
| Navigation filtrée par rôle | ✅ Complet |
| Route guards (ProtectedRoute + rôles) | ✅ Complet |
| Version mobile (drawer + BottomSheet) | ✅ Complet |
| Connexion réelle au backend API | ✅ Complet (appels axios vers `/api/*`) |

Le frontend est **entièrement connecté au backend**. Les données mock ont été remplacées par des appels axios réels. L'intercepteur 401 gère le refresh token silencieux et la rotation automatique des tokens.

---

## 3) Sécurité

### 3.1 Authentification JWT & Refresh Token

BiblioTech utilise **LexikJWTAuthenticationBundle** pour l'authentification sans état (stateless), complété par un système de **refresh token** pour éviter les déconnexions intempestives.

**Flux d'authentification :**

```
Client                          API Symfony
  │                                  │
  │── POST /api/login ──────────────>│
  │   { email, password }            │
  │                                  │── Vérifie email en base (UtilisateurRepository)
  │                                  │── Vérifie password (password_hasher Argon2id)
  │                                  │── Génère JWT (RS256, exp: 8h)
  │                                  │── Génère RefreshToken (hex 64 chars, exp: 30j)
  │<── 200 { token, refresh_token } ─│
  │                                  │
  │── GET /api/prets ───────────────>│
  │   Authorization: Bearer eyJ...   │
  │                                  │── Vérifie signature JWT
  │                                  │── Extrait sub, role, bibliotheque_id
  │                                  │── Vérifie rôle (RBAC)
  │<── 200 [...] ────────────────────│
  │                                  │
  │── POST /api/token/refresh ──────>│  (avant expiration, auto. par le frontend)
  │   { refresh_token: "abc..." }    │
  │                                  │── Vérifie RT en base (non expiré)
  │                                  │── Supprime l'ancien RT (rotation)
  │                                  │── Génère nouveau JWT + nouveau RT
  │<── 200 { token, refresh_token } ─│
```

**Payload JWT :**
```json
{
  "sub": 42,
  "email": "bibliothecaire@ipssitheque.fr",
  "role": "bibliothecaire",
  "bibliotheque_id": 1,
  "iat": 1746691200,
  "exp": 1746720000
}
```

Le payload custom (`role`, `bibliotheque_id`) est injecté via un `JwtCreatedSubscriber` qui écoute l'événement `lexik_jwt_authentication.on_jwt_created`.

**Configuration :**
- Algorithme : **RS256** (clés asymétriques RSA — plus sécurisé que HS256)
- Durée access token : **8 heures**
- Durée refresh token : **30 jours** (rotation à chaque utilisation)
- Stockage côté client : `localStorage` (`biblitech_token` + `biblitech_refresh_token`)
- Injection : header `Authorization: Bearer <token>` sur toutes les requêtes protégées
- Refresh silencieux : déclenché automatiquement 5 minutes avant l'expiration du JWT

### 3.2 Contrôle d'accès (RBAC)

Chaque endpoint vérifie le rôle **et** le `bibliotheque_id` du token. Un utilisateur ne peut accéder qu'aux données de sa propre bibliothèque (isolation multi-tenant).

| Rôle | Accès | Isolation |
|---|---|---|
| `super_admin` | Tout | Aucune (accès global) |
| `admin` | Sa bibliothèque + gestion comptes | `bibliotheque_id` du token |
| `bibliothecaire` | Catalogue + prêts de sa bibliothèque | `bibliotheque_id` du token |
| `adherent` | Lecture catalogue + ses propres prêts | `bibliotheque_id` + `sub` du token |

Implémentation via un `AttributeVoter` Symfony sur chaque route sensible :

```php
// Exemple : vérification dans PretController
$this->denyAccessUnlessGranted('PRET_ACCESS', $pret);

// BiblioTechVoter.php
protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
{
    $user = $token->getUser();
    if ($attribute === 'PRET_ACCESS') {
        // Un adhérent ne peut voir que ses propres prêts
        if ($user->getRole() === 'adherent') {
            return $subject->getUtilisateur()->getId() === $user->getId();
        }
        // Staff : isolation par bibliothèque
        return $subject->getExemplaire()->getLivre()->getBibliotheque()->getId()
            === $user->getBibliothequeId();
    }
    return false;
}
```

### 3.3 Protection OWASP Top 10

| Menace OWASP | Contre-mesure implémentée |
|---|---|
| **A01 - Broken Access Control** | RBAC strict via AttributeVoter Symfony + isolation `bibliotheque_id` |
| **A02 - Cryptographic Failures** | Argon2id (mots de passe), RS256 (JWT), HTTPS enforced en production |
| **A03 - Injection SQL** | Doctrine ORM + requêtes préparées uniquement. Aucun SQL dynamique sans paramètres |
| **A04 - Insecure Design** | Architecture stateless JWT, séparation frontend/backend, validation des DTOs |
| **A05 - Security Misconfiguration** | Variables sensibles dans `.env.local` (non versionné), clés JWT hors du code source |
| **A06 - Vulnerable Components** | Dépendances Symfony et npm vérifiées via `composer audit` et `npm audit` |
| **A07 - Auth Failures** | Rate Limiter Symfony sur `/api/login` (5 tentatives/minute par IP) |
| **A08 - Data Integrity Failures** | Validation des entrées via Symfony Validator sur tous les DTOs |
| **A09 - Logging Failures** | Monolog configuré pour logger les tentatives échouées et les accès refusés |
| **A10 - SSRF** | Le seul appel externe (Google Books API) passe par `GoogleBooksService`, URL non paramétrable par l'utilisateur |

### 3.4 Validation des entrées

Toutes les entrées utilisateur passent par des **DTOs validés** avec les contraintes Symfony Validator avant d'atteindre la logique métier :

```php
// CreatePretDTO.php — exemple de validation
class CreatePretDTO
{
    #[NotBlank]
    #[Positive]
    public int $exemplaire_id;

    #[NotBlank]
    #[Positive]
    public int $utilisateur_id;

    #[Type('datetime')]
    public ?DateTimeImmutable $date_retour_prevue = null;
}
```

### 3.5 Conformité RGPD

Conformément aux engagements du Jalon 1 (objectif SMART), les mesures RGPD suivantes sont implémentées :

- **Registre de traitement** : documenté dans `docs/registre_traitement.md`
- **Droit à l'oubli** : endpoint `DELETE /api/utilisateurs/{id}` avec anonymisation des prêts associés (le prêt est conservé pour l'historique, mais les données personnelles sont remplacées par `[SUPPRIMÉ]`)
- **Minimisation** : seules les données nécessaires sont stockées (pas de date de naissance, pas de numéro de téléphone obligatoire)
- **Mots de passe** : jamais stockés en clair, hachés avec Argon2id (facteur mémoire 65536, itérations 4)

---

## 4) Tests

### 4.1 Stratégie appliquée

| Type | Outil | Nombre de tests |
|---|---|---|
| Tests unitaires | PHPUnit 11 | 14 tests |
| Tests d'intégration | Symfony WebTestCase | 22 tests |
| **Total** | | **36 tests** |

### 4.2 Tests unitaires — `PretService`

Fichier : `tests/Unit/Service/PretServiceTest.php`

| Test | Description | Résultat attendu |
|---|---|---|
| `testEnregistrerPretExemplaireDisponible` | Prêt créé avec un exemplaire disponible | Prêt créé, statut exemplaire → `emprunte` |
| `testEnregistrerPretExemplaireIndisponible` | Exemplaire déjà emprunté | Exception `ExemplaireUnavailableException` |
| `testEnregistrerPretMaxPrets` | Adhérent a déjà 5 prêts en cours | Exception `PretMaxReachedException` |
| `testEnregistrerPretAdherentInvalide` | `utilisateur_id` inexistant | Exception `UserNotFoundException` |
| `testEnregistrerRetourPretEnCours` | Retour d'un prêt en cours | Statut prêt → `rendu`, statut exemplaire → `disponible` |
| `testEnregistrerRetourPretDejaRendu` | Retour d'un prêt déjà rendu | Exception `PretAlreadyReturnedException` |
| `testCalculDateRetourDefaut` | Aucune date fournie | Date = J+21 |
| `testCalculDateRetourPersonnalisee` | Date fournie explicitement | Date = date fournie |

### 4.3 Tests unitaires — `GoogleBooksService`

Fichier : `tests/Unit/Service/GoogleBooksServiceTest.php`

| Test | Description | Résultat attendu |
|---|---|---|
| `testRechercherIsbnTrouve` | ISBN valide trouvé dans Google Books | Retour des métadonnées (titre, auteur, etc.) |
| `testRechercherIsbnInconnu` | ISBN inconnu de Google Books | Exception `IsbnNotFoundException` |
| `testRechercherIsbnTimeoutApi` | Simulation d'un timeout HTTP | Exception `GoogleBooksApiException` |
| `testRechercherIsbnQuotaDepasse` | Réponse 429 de l'API | Exception `GoogleBooksApiException` |
| `testCleApiNonConfiguree` | Variable d'env absente | Exception `\RuntimeException` |
| `testMappingMetadonnees` | Vérification du mapping des champs | Objet bien formé avec tous les champs attendus |

### 4.4 Tests d'intégration — `AuthController`

Fichier : `tests/Integration/Controller/AuthControllerTest.php`

| Test | Requête | Résultat attendu |
|---|---|---|
| `testLoginSucces` | POST /api/login credentials valides | 200 + token JWT dans la réponse |
| `testLoginMauvaisMotDePasse` | POST /api/login mauvais mdp | 401 + code `AUTH_INVALID_CREDENTIALS` |
| `testLoginEmailInexistant` | POST /api/login email inconnu | 401 + code `AUTH_INVALID_CREDENTIALS` |
| `testLoginCompteDesactive` | POST /api/login compte désactivé | 403 + code `AUTH_ACCOUNT_DISABLED` |
| `testLoginRateLimiter` | POST /api/login 6 tentatives/minute | 429 après la 5ème tentative |
| `testAccesSansToken` | GET /api/prets sans header Authorization | 401 |
| `testAccesTokenExpire` | GET /api/prets token expiré | 401 + code `AUTH_TOKEN_EXPIRED` |
| `testAccesTokenMalformate` | GET /api/prets token invalide | 401 |

### 4.5 Tests d'intégration — `LivreController`

Fichier : `tests/Integration/Controller/LivreControllerTest.php`

| Test | Requête | Rôle | Résultat attendu |
|---|---|---|---|
| `testGetCatalogueAdherent` | GET /api/livres | adherent | 200 + liste livres |
| `testGetCatalogueFiltre` | GET /api/livres?titre=Dune | bibliothecaire | 200 + liste filtrée |
| `testPostLivreBibliothecaire` | POST /api/livres | bibliothecaire | 201 + livre créé |
| `testPostLivreAdherentInterdit` | POST /api/livres | adherent | 403 |
| `testPostLivreIsbnDuplique` | POST /api/livres ISBN existant | bibliothecaire | 409 + code `LIVRE_ISBN_DUPLICATE` |
| `testPutLivre` | PUT /api/livres/{id} | bibliothecaire | 200 + livre modifié |
| `testDeleteLivreAdmin` | DELETE /api/livres/{id} | admin | 204 |
| `testDeleteLivreBibliothecaireInterdit` | DELETE /api/livres/{id} | bibliothecaire | 403 |
| `testGetLivreAutreBibliotheque` | GET /api/livres/{id} (autre biblio) | admin | 403 (isolation tenant) |

### 4.6 Tests d'intégration — `PretController`

Fichier : `tests/Integration/Controller/PretControllerTest.php`

| Test | Requête | Rôle | Résultat attendu |
|---|---|---|---|
| `testPostPretSucces` | POST /api/prets | bibliothecaire | 201 + prêt créé |
| `testPostPretExemplaireIndisponible` | POST /api/prets exemplaire emprunté | bibliothecaire | 409 + code `EXEMPLAIRE_UNAVAILABLE` |
| `testPostPretMaxAtteint` | POST /api/prets (5 prêts en cours) | bibliothecaire | 422 + code `PRET_MAX_REACHED` |
| `testPatchRetour` | PATCH /api/prets/{id}/retour | bibliothecaire | 200 + statut `rendu` |
| `testPatchRetourDejaRendu` | PATCH /api/prets/{id}/retour déjà rendu | bibliothecaire | 409 + code `PRET_ALREADY_RETURNED` |
| `testAdherentVoitSesPrets` | GET /api/prets | adherent | 200 + uniquement ses prêts |
| `testAdherentNeVoitPasAutresPrets` | GET /api/prets/{id} prêt d'un autre | adherent | 403 |
| `testRetardsBibliothecaire` | GET /api/prets/retards | bibliothecaire | 200 + liste retards |
| `testEnregistrerRetourAdherentInterdit` | PATCH /api/prets/{id}/retour | adherent | 403 |

### 4.7 Résultats d'exécution

```
PHPUnit 11.x

Unit/Service/PretServiceTest .............. 8 tests OK
Unit/Service/GoogleBooksServiceTest ....... 6 tests OK
Integration/Controller/AuthControllerTest . 8 tests OK
Integration/Controller/LivreControllerTest  9 tests OK
Integration/Controller/PretControllerTest . 9 tests OK

Time: 1.432s
Tests: 40, Assertions: 127, OK (40 tests, 127 assertions)
```

> **Note :** les tests d'intégration utilisent une base PostgreSQL de test distincte, réinitialisée avant chaque suite via DataFixtures Doctrine (1 bibliothèque, 1 admin, 1 bibliothécaire, 3 adhérents, 5 livres, 8 exemplaires).

---

## 5) Infrastructure & Déploiement

### 5.1 Docker Compose

Le projet fonctionne avec 3 services Docker :

| Service | Image | Port | Rôle |
|---|---|---|---|
| `app` | PHP 8.3 + Nginx + Symfony | 8080 | API REST |
| `db` | PostgreSQL 16 Alpine | 5432 | Base de données (dev local) |
| `frontend` | Node 20 Alpine | 5173 | Dev server React (hot-reload) |

Variables d'environnement sensibles (non versionnées) dans `.env.local` :
```env
JWT_PASSPHRASE=votre_passphrase_rsa
GOOGLE_BOOKS_API_KEY=AIzaSy...
DATABASE_URL=postgresql://bibliotech:secret@db:5432/bibliotech
```

### 5.2 Migrations Doctrine

Une migration unique couvre l'intégralité du schéma défini au Jalon 3 :

```
migrations/Version20260501000000.php
```

Elle crée les 6 tables, les clés étrangères, les contraintes d'unicité et les index de performance (sur `isbn`, `email`, `statut`).

### 5.3 Variables d'environnement

| Variable | Usage | Obligatoire |
|---|---|---|
| `DATABASE_URL` | DSN PostgreSQL | ✅ |
| `JWT_SECRET_KEY` | Chemin clé privée RSA | ✅ |
| `JWT_PUBLIC_KEY` | Chemin clé publique RSA | ✅ |
| `JWT_PASSPHRASE` | Passphrase clé RSA | ✅ |
| `GOOGLE_BOOKS_API_KEY` | Clé API Google Books | ✅ |
| `APP_ENV` | `dev` / `prod` / `test` | ✅ |
| `CORS_ALLOW_ORIGIN` | Origines autorisées (CORS) | ✅ en prod |

---

## 6) État d'avancement global du projet

| Composant | Statut | Détail |
|---|---|---|
| **Backend Symfony** | ✅ Développé | Controllers, Services, Entities, Repositories, Config |
| **Authentification JWT** | ✅ Opérationnel | Login, refresh token (rotation), logout, RBAC, RS256 |
| **Sécurité OWASP** | ✅ Implémentée | Rate limiter, validation DTOs, Argon2id |
| **RGPD** | ✅ Conforme | Droit à l'oubli, minimisation, registre |
| **Tests** | ✅ 40 tests, 127 assertions | Unitaires + intégration, pipeline CI |
| **Frontend React** | ✅ Complet | Toutes les pages + gestion des rôles |
| **Connexion API ↔ Frontend** | ✅ Opérationnel | Appels axios réels, intercepteur 401, auto-refresh |
| **Déploiement production** | 🕐 Jalon 6 | Supabase (BDD) ✅ configuré ; serveur cloud API à venir |

---

## 7) Conclusion

Le Jalon 5 concrétise la vision technique posée lors des jalons précédents. Le backend Symfony est opérationnel avec :

- **38 endpoints REST** couvrant l'ensemble des besoins fonctionnels
- Un système d'**authentification JWT RS256** robuste avec refresh token (rotation à chaque utilisation)
- Un **contrôle d'accès RBAC** granulaire (rôle + isolation par bibliothèque)
- Des **mesures de sécurité** couvrant le Top 10 OWASP
- **40 tests** automatisés garantissant la non-régression
- Le **frontend React est entièrement connecté** au backend via des appels axios réels, avec gestion silencieuse du refresh token côté client

La prochaine étape (Jalon 6 — Juin 2026) consistera à :
1. Déployer le backend sur un serveur cloud
2. Réaliser les tests end-to-end Playwright sur l'application complète
3. Préparer l'installateur Tauri (`.exe` / `.msi`) pour la livraison finale
