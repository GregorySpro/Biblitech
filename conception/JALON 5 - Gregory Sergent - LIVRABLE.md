# Jalon 5 – Développement, Sécurité & Tests

**Projet :** BiblioTech
**Auteur :** Grégory Sergent
**Organisme de formation :** IPSSI Grande École d'Informatique
**Formation :** CDA – Concepteur Développeur d'Applications
**Période :** Janvier → Juin 2026
**Date :** 1er juin 2026 *(rendu avec 1 jour de retard — fonctionnalités finalisées le 31 mai)*
**Statut :** Version 1.1

---

## Sommaire

1. Introduction
2. Ce qui a été développé
   - 2.1 Vue d'ensemble
   - 2.2 Entités Doctrine développées
   - 2.3 Endpoints implémentés
   - 2.4 Services métier
   - 2.5 Frontend React
3. Fonctionnalités avancées implémentées
   - 3.1 Système de premier login (mot de passe + CGU)
   - 3.2 Protection anti-brute force
   - 3.3 Versionnement des CGU & CMS intégré
   - 3.4 Gestion des prêts perdus
   - 3.5 Durée de prêt configurable par bibliothèque
4. Sécurité
   - 4.1 Authentification JWT & Refresh Token
   - 4.2 Contrôle d'accès (RBAC)
   - 4.3 Protection OWASP Top 10
   - 4.4 Validation des entrées
   - 4.5 Conformité RGPD
5. Tests
6. Infrastructure, CI/CD & Déploiement
   - 6.1 Docker Compose
   - 6.2 Migrations Doctrine
   - 6.3 Variables d'environnement
   - 6.4 CI/CD — état des lieux
7. État d'avancement global
8. Conclusion

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
- Implémentation des mécanismes de **sécurité** (JWT, RBAC, OWASP, brute-force protection)
- Développement de fonctionnalités avancées : **premier login**, **CGU versionnées avec CMS**, **prêts perdus**, **durée de prêt configurable**
- Rédaction et exécution des **tests unitaires et d'intégration**
- Le **frontend React** est désormais **entièrement connecté au backend** via axios (appels réels à l'API REST)

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
│   │   ├── CguController.php           ← nouveau (versionnement CGU)
│   │   ├── UtilisateurController.php
│   │   ├── LivreController.php
│   │   ├── ExemplaireController.php
│   │   ├── PretController.php
│   │   ├── DemandeMigrationController.php
│   │   └── StatController.php
│   ├── Entity/             # Entités Doctrine (= tables PostgreSQL)
│   │   ├── Bibliotheque.php            ← duretPretJours ajouté
│   │   ├── Utilisateur.php             ← mustChangePassword, cguAcceptedVersion, loginAttempts, lockedUntil, pretsSuspendus
│   │   ├── Livre.php
│   │   ├── Exemplaire.php              ← STATUT_PERDU ajouté
│   │   ├── Pret.php                    ← STATUT_PERDU, etatDepart, etatRetour ajoutés
│   │   ├── CguVersion.php              ← nouveau (versionnement CGU)
│   │   ├── DemandeMigration.php
│   │   └── RefreshToken.php
│   ├── Repository/         # Requêtes Doctrine
│   │   ├── BibliothequeRepository.php
│   │   ├── UtilisateurRepository.php
│   │   ├── LivreRepository.php
│   │   ├── ExemplaireRepository.php
│   │   ├── PretRepository.php
│   │   ├── CguVersionRepository.php    ← nouveau
│   │   ├── DemandeMigrationRepository.php
│   │   └── RefreshTokenRepository.php
│   ├── Service/            # Logique métier
│   │   ├── PretService.php             ← mise à jour (prêts perdus, durée configurable)
│   │   └── GoogleBooksService.php
│   └── EventSubscriber/    # Écouteurs d'événements Symfony
│       └── JwtCreatedSubscriber.php    ← payload étendu
├── config/
│   └── packages/
│       ├── security.yaml
│       ├── framework.yaml              ← rate limiter configuré
│       ├── doctrine.yaml
│       └── lexik_jwt_authentication.yaml
├── migrations/
│   ├── Version20260501000000.php
│   ├── Version20260526000000.php       ← refresh tokens
│   ├── Version20260601000000.php       ← mustChangePassword, loginAttempts, lockedUntil
│   ├── Version20260602000000.php       ← cguAcceptedVersion, pretsSuspendus, duretPretJours
│   └── Version20260603000000.php       ← table cgu_versions, etatDepart/etatRetour sur prêts
└── tests/
    ├── Unit/
    │   └── Service/
    │       ├── PretServiceTest.php
    │       └── GoogleBooksServiceTest.php
    └── Integration/
        └── Controller/
            ├── AuthControllerTest.php
            ├── BibliothequeControllerTest.php
            ├── ExemplaireControllerTest.php
            ├── LivreControllerTest.php
            ├── PretControllerTest.php
            └── UtilisateurControllerTest.php
```

### 2.2 Entités Doctrine développées

| Entité | Table | Champs notables ajoutés au Jalon 5 |
|---|---|---|
| `Bibliotheque` | `bibliotheques` | `duret_pret_jours` (durée de prêt configurable par bibliothèque) |
| `Utilisateur` | `utilisateurs` | `must_change_password`, `cgu_accepted_version`, `prets_suspendus`, `login_attempts`, `locked_until` |
| `Livre` | `livres` | — |
| `Exemplaire` | `exemplaires` | constante `STATUT_PERDU` |
| `Pret` | `prets` | `STATUT_PERDU`, `etat_depart`, `etat_retour` |
| `CguVersion` | `cgu_versions` | `version`, `contenu` (TEXT brut, paragraphes séparés par `\n`), `date_effet`, `date_publication`, `publie_par` |
| `DemandeMigration` | `demandes_migration` | — |
| `RefreshToken` | `refresh_tokens` | — |

### 2.3 Endpoints implémentés

**`AuthController`**
- `POST /api/login` — Authentification, retour JWT + refresh token. Incrémente `login_attempts`. Si ≥ 5 tentatives → verrou 15 minutes (HTTP 429).
- `POST /api/token/refresh` — Rotation du refresh token
- `POST /api/logout` — Invalidation du refresh token

**`BibliothequeController`** *(super_admin)*
- `GET /api/bibliotheques` — Liste toutes les bibliothèques
- `POST /api/bibliotheques` — Création
- `GET /api/bibliotheques/{id}` — Détail
- `PUT /api/bibliotheques/{id}` — Modification (dont `duret_pret_jours`)
- `DELETE /api/bibliotheques/{id}` — Suppression
- `PATCH /api/bibliotheques/{id}/activer` — Activation/désactivation

**`CguController`** *(nouveau)*
- `GET /api/cgu/current` — Version CGU actuellement en vigueur
- `GET /api/cgu/pending` — CGU en préavis (publiée mais pas encore en vigueur)
- `GET /api/cgu/history` — Historique de toutes les versions
- `POST /api/cgu` *(super_admin)* — Publication d'une nouvelle version (validation backend : date_effet >= aujourd'hui + 15 jours, sinon HTTP 422)

**`UtilisateurController`**
- `GET /api/utilisateurs` — Liste (filtrée par `bibliotheque_id` pour admin/bibliothécaire)
- `POST /api/utilisateurs` — Création de compte
- `GET /api/utilisateurs/{id}` — Détail
- `PUT /api/utilisateurs/{id}` — Modification
- `DELETE /api/utilisateurs/{id}` — Suppression
- `GET /api/utilisateurs/me` — Profil de l'utilisateur connecté
- `POST /api/utilisateurs/me/accept-cgu` — Enregistrement de l'acceptation des CGU (`cgu_accepted_version`)
- `POST /api/utilisateurs/{id}/changer-mot-de-passe` — Changement de mot de passe (premier login)
- `PATCH /api/utilisateurs/{id}/suspendre` — Suspendre/réactiver les prêts d'un adhérent

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
- `PATCH /api/exemplaires/{id}/perdu` *(nouveau)* — Marquer un exemplaire comme perdu

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
- Calcul de la date de retour prévue selon `duret_pret_jours` de la bibliothèque (J+21 par défaut, configurable par bibliothèque)
- Enregistrement du retour : mise à jour statut exemplaire → `disponible`
- Gestion du statut `perdu` : exemplaire et prêt marqués `perdu`, date de retour non renseignée
- Détection automatique des prêts en retard (`date_retour_prevue < now()`)

**`GoogleBooksService`** — Intégration API externe :
- Appel HTTP vers `https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`
- Clé API depuis variable d'environnement `GOOGLE_BOOKS_API_KEY` (jamais en dur)
- Mapping des champs retournés (titre, auteur, éditeur, description, couverture)
- Gestion des cas : ISBN introuvable (404), timeout (500), quota dépassé
- Fallback documenté : si l'appel échoue, l'utilisateur bascule sur la saisie manuelle

> **Note :** La clé API Google Books n'est pas encore configurée en environnement de production. Le fallback saisie manuelle reste l'option par défaut jusqu'à la configuration de la clé.

### 2.5 Frontend React (état d'avancement)

Le frontend React est fonctionnel, complet et entièrement connecté au backend.

**Pages existantes :**

| Page / Composant | Statut | Rôles concernés |
|---|---|---|
| `LoginPage` | ✅ Complet | Tous — message explicite en cas de blocage brute-force (429) |
| `PremierLoginMotDePassePage` | ✅ Complet | Tous — redirection forcée au premier login |
| `PremierLoginCguPage` | ✅ Complet | Tous — acceptation CGU obligatoire (version dynamique) |
| `DashboardPage` | ✅ Complet | Staff + adhérent |
| `CataloguePage` | ✅ Complet | Tous |
| `PretsPage` | ✅ Complet | Staff — affiche "PERDU" sans date de rendu pour les prêts perdus |
| `AdherentsPage` | ✅ Complet | Admin + super_admin — gestion des suspensions |
| `DemandeMigrationPage` | ✅ Complet | Tous |
| `BibliothequeManagementPage` | ✅ Complet | Admin (sa propre bibliothèque) + super_admin (toutes) — durée de prêt configurable |
| `MonComptePage` | ✅ Complet | Tous — profil, changement mdp, zone danger + section **Gestion CGU** (super_admin uniquement : historique + formulaire publication nouvelle version) |

**Composants et contextes :**

| Composant | Statut | Rôle |
|---|---|---|
| `AuthContext` | ✅ Complet | Gestion du JWT, refresh silencieux, flags `must_change_password`, `cgu_accepted_version` |
| `CguContext` | ✅ Complet | Expose `currentVersion`, `cguContenu`, `pendingVersion`, `pendingDateEffet` (CGU en préavis) |
| `ProtectedRoute` | ✅ Complet | Guards : authentification + redirection premier login + redirection CGU |
| `Sidebar` | ✅ Complet | Navigation filtrée par rôle — onglet Bibliothèque accessible aux admins |
| `PageLayout` | ✅ Complet | Layout responsive desktop/mobile |

**Services frontend :**

| Service | Statut |
|---|---|
| `authService` | ✅ |
| `utilisateurService` | ✅ |
| `livreService` | ✅ |
| `exemplaireService` | ✅ |
| `pretService` | ✅ |
| `bibliothequeService` | ✅ |
| `demandesMigrationService` | ✅ |
| `cguService` | ✅ |
| `statsService` | ✅ |

---

## 3) Fonctionnalités avancées implémentées

### 3.1 Système de premier login (mot de passe + CGU)

Lors de la création d'un compte par un admin/super_admin, le flag `must_change_password = true` est positionné sur l'utilisateur. Au premier login :

1. Le JWT retourné contient `must_change_password: true`
2. Le `ProtectedRoute` intercepte toute navigation et redirige vers `/premier-login/mot-de-passe`
3. L'utilisateur définit son propre mot de passe (validation : 8 caractères min, majuscule, chiffre, caractère spécial)
4. Après changement : redirection vers `/premier-login/cgu`
5. L'utilisateur lit et accepte les CGU (version dynamique)
6. `cgu_accepted_version` est mis à jour en base via `POST /api/utilisateurs/me/accept-cgu`
7. Accès normal à l'application

Ce flux garantit qu'aucun utilisateur ne peut utiliser l'application sans avoir explicitement changé son mot de passe temporaire et accepté les CGU en vigueur.

### 3.2 Protection anti-brute force

Le login est protégé contre les attaques par force brute à deux niveaux :

**Niveau applicatif (Symfony)** — `AuthController.php` :
- Chaque tentative échouée incrémente `login_attempts` sur l'entité `Utilisateur`
- À partir de 5 tentatives : `locked_until = now() + 15 minutes`
- Si le compte est verrouillé, toute tentative retourne immédiatement HTTP 429 avec le message et la date de déverrouillage

**Niveau infrastructure (Symfony Rate Limiter)** — `framework.yaml` :
- Rate limiter global sur `/api/login` par adresse IP
- Limite : 10 tentatives par tranche de 5 minutes

**Côté frontend** — `LoginPage.tsx` :
- Réponse HTTP 429 → affichage d'un message explicite : *"Trop de tentatives infructueuses. Compte temporairement verrouillé. Réessayez dans X minutes."*

### 3.3 Versionnement des CGU & CMS intégré

BiblioTech dispose d'un système complet de gestion des CGU sans intervention sur le code :

**Fonctionnement :**
- Les CGU sont stockées en base dans la table `cgu_versions` (texte brut, paragraphes séparés par `\n`)
- Le `super_admin` publie une nouvelle version via la section **Gestion CGU** de `MonComptePage` (formulaire : numéro de version, contenu, date d'effet)
- La nouvelle version entre en vigueur **15 jours après publication minimum** (préavis obligatoire, validé côté backend : HTTP 422 si délai insuffisant)
- Durant ces 15 jours, une **bannière de préavis** est affichée dans la Sidebar à tous les utilisateurs connectés (via `CguContext.pendingVersion`)
- À la date d'effet, les utilisateurs dont `cgu_accepted_version ≠ version_courante` sont redirigés vers la page d'acceptation
- Après acceptation, `POST /api/utilisateurs/me/accept-cgu` met à jour `cgu_accepted_version` en base

**Contraintes techniques respectées :**
- Contenu texte brut (paragraphes séparés par retours à la ligne) — rendu direct dans l'UI sans parsing JSON
- Historique complet des versions consultable via `GET /api/cgu/history`
- Version et date affichées dynamiquement sur la page d'acceptation (pas de valeur en dur)

### 3.4 Gestion des prêts perdus

Un exemplaire peut être déclaré perdu par un bibliothécaire. Le processus :

1. `PATCH /api/exemplaires/{id}/perdu` → statut exemplaire → `perdu`
2. Le prêt associé passe au statut `perdu`
3. `etat_retour` reste `null` (le livre n'a pas été rendu)
4. **Côté frontend** : la colonne "Date de rendu" affiche **"PERDU"** et non une date, ce qui serait contradictoire

### 3.5 Durée de prêt configurable par bibliothèque

Chaque bibliothèque peut définir sa propre durée de prêt standard :

- Champ `duret_pret_jours` sur l'entité `Bibliotheque` (défaut : 21 jours)
- Configurable par le `super_admin` (toutes bibliothèques) ou par l'`admin` (sa propre bibliothèque) depuis la page `BibliothequeManagementPage`
- `PretService` utilise cette valeur pour calculer `date_retour_prevue` à la création du prêt
- La valeur est incluse dans le payload JWT (`duret_pret_jours`) pour éviter un appel API supplémentaire

---

## 4) Sécurité

### 4.1 Authentification JWT & Refresh Token

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

**Payload JWT étendu :**
```json
{
  "sub": 42,
  "email": "bibliothecaire@ipssitheque.fr",
  "role": "bibliothecaire",
  "bibliotheque_id": 1,
  "bibliotheque_nom": "IPSSIthèque",
  "must_change_password": false,
  "cgu_accepted_version": "1.1",
  "prets_suspendus": false,
  "duret_pret_jours": 21,
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

### 4.2 Contrôle d'accès (RBAC)

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

### 4.3 Protection OWASP Top 10

| Menace OWASP | Contre-mesure implémentée |
|---|---|
| **A01 - Broken Access Control** | RBAC strict via AttributeVoter Symfony + isolation `bibliotheque_id` |
| **A02 - Cryptographic Failures** | Argon2id (mots de passe), RS256 (JWT), HTTPS enforced en production |
| **A03 - Injection SQL** | Doctrine ORM + requêtes préparées uniquement. Aucun SQL dynamique sans paramètres |
| **A04 - Insecure Design** | Architecture stateless JWT, séparation frontend/backend, validation des DTOs |
| **A05 - Security Misconfiguration** | Variables sensibles dans `.env.local` (non versionné), clés JWT hors du code source |
| **A06 - Vulnerable Components** | Dépendances Symfony et npm vérifiées via `composer audit` et `npm audit` |
| **A07 - Auth Failures** | Rate Limiter Symfony sur `/api/login` + verrou applicatif 15 min après 5 tentatives |
| **A08 - Data Integrity Failures** | Validation des entrées via Symfony Validator sur tous les DTOs |
| **A09 - Logging Failures** | Monolog configuré pour logger les tentatives échouées et les accès refusés |
| **A10 - SSRF** | Le seul appel externe (Google Books API) passe par `GoogleBooksService`, URL non paramétrable par l'utilisateur |

### 4.4 Validation des entrées

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

### 4.5 Conformité RGPD

Conformément aux engagements du Jalon 1 (objectif SMART), les mesures RGPD suivantes sont implémentées :

- **Registre de traitement** : documenté dans `docs/registre_traitement.md`
- **Droit à l'oubli** : endpoint `DELETE /api/utilisateurs/{id}` avec anonymisation des prêts associés (le prêt est conservé pour l'historique, mais les données personnelles sont remplacées par `[SUPPRIMÉ]`)
- **Minimisation** : seules les données nécessaires sont stockées (pas de date de naissance, pas de numéro de téléphone obligatoire)
- **Mots de passe** : jamais stockés en clair, hachés avec Argon2id (facteur mémoire 65536, itérations 4)

---

## 5) Tests

### 5.1 Stratégie appliquée

| Type | Outil | Nombre de tests |
|---|---|---|
| Tests unitaires | PHPUnit 11 | 13 tests (2 suites) |
| Tests d'intégration | Symfony WebTestCase | 54 tests (6 suites) |
| **Total** | | **67 tests (8 suites)** |

### 5.2 Tests unitaires — `PretService`

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

### 5.3 Tests unitaires — `GoogleBooksService`

Fichier : `tests/Unit/Service/GoogleBooksServiceTest.php`

| Test | Description | Résultat attendu |
|---|---|---|
| `testRechercherIsbnTrouve` | ISBN valide trouvé dans Google Books | Retour des métadonnées (titre, auteur, etc.) |
| `testRechercherIsbnInconnu` | ISBN inconnu de Google Books | Exception `IsbnNotFoundException` |
| `testRechercherIsbnTimeoutApi` | Simulation d'un timeout HTTP | Exception `GoogleBooksApiException` |
| `testRechercherIsbnQuotaDepasse` | Réponse 429 de l'API | Exception `GoogleBooksApiException` |
| `testCleApiNonConfiguree` | Variable d'env absente | Exception `\RuntimeException` |
| `testMappingMetadonnees` | Vérification du mapping des champs | Objet bien formé avec tous les champs attendus |

### 5.4 Tests d'intégration — `AuthController`

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

### 5.5 Tests d'intégration — `LivreController`

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

### 5.6 Tests d'intégration — `PretController`

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

### 5.7 Résultats d'exécution

```
PHPUnit 11.x

Unit/Service/PretServiceTest .................. 7 tests OK
Unit/Service/GoogleBooksServiceTest ........... 6 tests OK
Integration/Controller/AuthControllerTest ..... 6 tests OK
Integration/Controller/LivreControllerTest .... 7 tests OK
Integration/Controller/PretControllerTest ..... 8 tests OK
Integration/Controller/BibliothequeControllerTest 9 tests OK
Integration/Controller/ExemplaireControllerTest . 9 tests OK
Integration/Controller/UtilisateurControllerTest  15 tests OK

Time: ~2.1s
Tests: 67, OK (67 tests, 8 suites)
```

> **Note :** les tests d'intégration utilisent une base PostgreSQL de test distincte, réinitialisée avant chaque suite via DataFixtures Doctrine (1 bibliothèque, 1 admin, 1 bibliothécaire, 3 adhérents, 5 livres, 8 exemplaires).

---

## 6) Infrastructure, CI/CD & Déploiement

### 6.1 Docker Compose

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

### 6.2 Migrations Doctrine

5 migrations couvrent l'intégralité du schéma :

| Fichier | Contenu |
|---|---|
| `Version20260501000000.php` | Schéma initial (6 tables, clés étrangères, index) |
| `Version20260526000000.php` | Table `refresh_tokens` |
| `Version20260601000000.php` | Champs `must_change_password`, `login_attempts`, `locked_until` sur `utilisateurs` |
| `Version20260602000000.php` | Champs `cgu_accepted_version`, `prets_suspendus` sur `utilisateurs` ; `duret_pret_jours` sur `bibliotheques` |
| `Version20260603000000.php` | Table `cgu_versions` ; champs `etat_depart`, `etat_retour` sur `prets` |

### 6.3 Variables d'environnement

| Variable | Usage | Obligatoire |
|---|---|---|
| `DATABASE_URL` | DSN PostgreSQL | ✅ |
| `JWT_SECRET_KEY` | Chemin clé privée RSA | ✅ |
| `JWT_PUBLIC_KEY` | Chemin clé publique RSA | ✅ |
| `JWT_PASSPHRASE` | Passphrase clé RSA | ✅ |
| `GOOGLE_BOOKS_API_KEY` | Clé API Google Books | ⚠️ Non encore configurée — fallback saisie manuelle actif |
| `APP_ENV` | `dev` / `prod` / `test` | ✅ |
| `CORS_ALLOW_ORIGIN` | Origines autorisées (CORS) | ✅ en prod |

### 6.4 CI/CD — état des lieux

#### Ce qui est en place

| Pratique | Statut | Détail |
|---|---|---|
| **Gestion de version Git** | ✅ Opérationnel | Branching model : `develop` + branches `feat/*` par fonctionnalité. Merge `--no-ff` systématique. |
| **Conventions de commit** | ✅ Appliquées | Convention Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) sur toutes les branches |
| **Tests automatisés (locaux)** | ✅ Opérationnel | 67 tests PHPUnit (8 suites) exécutables via `php bin/phpunit` |
| **Pipeline CI GitHub Actions** | ✅ Opérationnel | `.github/workflows/ci.yml` — 3 jobs : `backend-tests` (PHPUnit + PostgreSQL), `frontend-lint` (TypeScript check), `docker-build` (build & push Docker Hub sur tags `v*`) |
| **Déploiement production** | ✅ Opérationnel | Backend Docker sur **Render** (Web Service), frontend statique sur **Render** (Static Site), base de données **Supabase** PostgreSQL 16 |
| **Audit des dépendances** | ✅ Manuel | `composer audit` et `npm audit` exécutés manuellement avant chaque merge |
| **Variables d'environnement sécurisées** | ✅ En place | `.env.local` non versionné ; clés JWT générées au build Docker, hors du dépôt |

#### Ce qui n'est pas encore en place

| Élément CI/CD | Statut | Raison |
|---|---|---|
| **Tests end-to-end automatisés** | ❌ Non mis en place | Les tests E2E (Playwright) sont prévus après stabilisation de la production. |
| **Linting automatique frontend** | ⚠️ Partiel | TypeScript check (`tsc --noEmit`) intégré dans la CI ; ESLint exécuté manuellement. |

---

## 7) État d'avancement global du projet

| Composant | Statut | Détail |
|---|---|---|
| **Backend Symfony** | ✅ Développé | Controllers, Services, Entities, Repositories, Config |
| **Authentification JWT** | ✅ Opérationnel | Login, refresh token (rotation), logout, RBAC, RS256, payload étendu |
| **Protection brute-force** | ✅ Opérationnel | Verrou applicatif 15 min après 5 tentatives + Rate Limiter Symfony |
| **Premier login (mdp + CGU)** | ✅ Opérationnel | Flux complet : changement mdp obligatoire + acceptation CGU avant accès |
| **Versionnement CGU** | ✅ Opérationnel | Stockage TEXT brut en base, préavis 15 jours, CMS intégré pour super_admin |
| **Prêts perdus** | ✅ Opérationnel | Statut PERDU sur exemplaire et prêt, affichage adapté en frontend |
| **Durée de prêt configurable** | ✅ Opérationnel | Par bibliothèque, éditable par admin/super_admin |
| **Sécurité OWASP** | ✅ Implémentée | Rate limiter, validation, Argon2id, isolation multi-tenant |
| **RGPD** | ✅ Conforme | Droit à l'oubli, minimisation, registre, CGU versionnées |
| **Tests** | ✅ 67 tests (8 suites) | Unitaires + intégration, PHPUnit, exécutés manuellement et en CI |
| **Frontend React** | ✅ Complet | Toutes les pages + gestion des rôles + nouveaux flux |
| **Connexion API ↔ Frontend** | ✅ Opérationnel | Appels axios réels, intercepteur 401, auto-refresh |
| **Google Books API** | ⚠️ Partiel | Service implémenté, clé API non encore configurée — fallback saisie manuelle actif |
| **CI/CD automatisée** | ✅ Opérationnel | GitHub Actions : `backend-tests`, `frontend-lint`, `docker-build` (sur tags `v*`) |
| **Déploiement production** | ✅ Opérationnel | Backend Docker sur Render, frontend statique sur Render, BDD Supabase |

---

## 8) Conclusion

## 8) Conclusion

Le Jalon 5 concrétise la vision technique posée lors des jalons précédents. Le backend Symfony est opérationnel avec :

- **40+ endpoints REST** couvrant l'ensemble des besoins fonctionnels
- Un système d'**authentification JWT RS256** robuste avec refresh token (rotation à chaque utilisation) et protection anti-brute force (verrou 15 min après 5 tentatives)
- Un **flux de premier login** complet : changement de mot de passe obligatoire + acceptation des CGU avant tout accès
- Un **système de CGU versionnées** avec préavis de 15 jours et CMS intégré pour le super_admin
- La gestion des **prêts perdus** et de la **durée de prêt configurable** par bibliothèque
- Un **contrôle d'accès RBAC** granulaire (rôle + isolation par bibliothèque)
- Des **mesures de sécurité** couvrant le Top 10 OWASP
- **67 tests PHPUnit** (8 suites) garantissant la non-régression, intégrés dans la CI GitHub Actions
- Le **frontend React entièrement connecté** au backend via des appels axios réels
- Un **pipeline CI/CD GitHub Actions** opérationnel (tests, lint TypeScript, build Docker sur tags)
- Un **déploiement production** fonctionnel (Render + Supabase)

**Ce qui reste pour le Jalon 6 :**
1. Réaliser les tests end-to-end Playwright sur l'application déployée
2. Configurer la clé API Google Books en production
3. Préparer la livraison finale
