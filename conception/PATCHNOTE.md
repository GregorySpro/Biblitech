# Patch Note — BiblioTech

> Version du patch : **1.1.0**
> Date d'application : 2026-07-06
> Contexte : Jalon 6 — Corrections pré-soutenance

---

## Résumé

Ce patch corrige l'ensemble des bugs critiques, failles de sécurité et fichiers manquants identifiés lors de l'audit post-Jalon 5. Il complète également l'implémentation des fonctionnalités CGU (versionnement) et premier login qui étaient documentées mais absentes du code.

---

## Bugs corrigés

### [CRIT] PretController::retour() — crash PHP garanti

- **Fichier :** `dev/backend/src/Controller/PretController.php`
- **Avant :** `public function retour(int $id): JsonResponse` — `$request` utilisé sans être injecté → `Fatal error: Undefined variable $request`
- **Après :** `public function retour(int $id, Request $request): JsonResponse`
- **Impact :** Tout retour de prêt était non fonctionnel

---

### [CRIT] Fichiers frontend manquants — application non compilable

Les fichiers suivants existaient dans les imports mais pas dans le système de fichiers :

| Fichier créé | Rôle |
|---|---|
| `src/context/GlobalLoadingContext.tsx` | Compteur de chargements global (utilisé par `useApiCall`) |
| `src/context/CguContext.tsx` | Version CGU courante + contenu (utilisé par `ProtectedRoute`) |
| `src/services/cguService.ts` | Appels API CGU |
| `src/components/BibliothequeInactiveBanner.tsx` | Bandeau suspension de prêts |
| `src/pages/PremierLoginMotDePassePage.tsx` | Changement de mot de passe au premier login |
| `src/pages/PremierLoginCguPage.tsx` | Acceptation des CGU au premier login |
| `src/pages/MonComptePage.tsx` | Gestion du profil utilisateur |
| `src/pages/BibliothequeManagementPage.tsx` | CRUD bibliothèques (super_admin/admin) |

---

### [CRIT] CguController, CguVersion entity et repository absents

Documentés dans le Jalon 5 mais non implémentés.

Fichiers créés :
- `src/Entity/CguVersion.php`
- `src/Repository/CguVersionRepository.php`
- `src/Controller/CguController.php`

Endpoints ajoutés :
- `GET /api/cgu/current` — Version CGU active
- `GET /api/cgu/pending` — Prochaine version (préavis 15 jours)
- `GET /api/cgu/history` — Historique des versions
- `POST /api/cgu` — Créer une nouvelle version (super_admin)

---

### [CRIT] Migrations manquantes — schéma base de données incohérent

3 migrations documentées dans Jalon 5 créées :

| Migration | Contenu |
|---|---|
| `Version20260601000000` | `must_change_password`, `login_attempts`, `locked_until` sur utilisateurs |
| `Version20260602000000` | `cgu_accepted_version`, `prets_suspendus` sur utilisateurs ; `duret_pret_jours` sur bibliothèques |
| `Version20260603000000` | Table `cgu_versions`, `etat_depart`/`etat_retour` sur prêts, statuts `perdu` sur exemplaires et prêts |

---

### [CRIT] CHECK constraints PostgreSQL — statut `perdu` manquant

- **Migration 603** corrige les contraintes sur `exemplaires` et `prets` pour inclure le statut `'perdu'`
- Sans ce correctif, toute tentative de marquer un exemplaire ou prêt comme `perdu` provoquait une violation de contrainte PostgreSQL

---

### [CRIT] AppFixtures vides — tests d'intégration non exécutables

- `AppFixtures::load()` était un stub vide
- **Après :** Création de 8 utilisateurs, 2 bibliothèques, 4 livres avec exemplaires, 1 version de CGU

Comptes de test créés :

| Email | Rôle | Mot de passe |
|---|---|---|
| `superadmin@test.fr` | super_admin | `Admin1234!` |
| `admin@test.fr` | admin | `Admin1234!` |
| `bibliothecaire@test.fr` | bibliothecaire | `Biblio1234!` |
| `adherent@test.fr` | adherent | `Adherent1234!` |
| `adherent2@test.fr` | adherent | `Adherent1234!` |
| `desactive@test.fr` | adherent (inactif) | `Desactive1234!` |
| `premier@test.fr` | bibliothecaire (must_change_pwd) | `Temp1234!` |

---

## Correctifs de sécurité

### [SEC] Restriction de la liste des bibliothèques

- **Avant :** `GET /api/bibliotheques` retournait toutes les bibliothèques à tout utilisateur authentifié
- **Après :** Super_admin voit tout. Les autres utilisateurs ne voient que les bibliothèques actives (nécessaires pour les migrations)

---

### [SEC] Élévation de privilège à la création d'utilisateur

- **Avant :** Un `admin` pouvait créer des comptes `super_admin` et créer des utilisateurs dans n'importe quelle bibliothèque
- **Après :** Admin limité aux rôles `adherent`/`bibliothecaire`/`admin`, dans sa propre bibliothèque uniquement

---

### [SEC] Validation de force de mot de passe côté serveur

- **Avant :** Validation uniquement côté frontend (contournable)
- **Après :** `validatePasswordStrength()` ajoutée dans `UtilisateurController`, appliquée sur :
  - `POST /api/utilisateurs/me/change-password` (premier login)
  - `PATCH /api/utilisateurs/me` (changement de mot de passe en profil)
- Règles : 8 caractères minimum, majuscule, chiffre, caractère spécial

---

### [SEC] Validation de version CGU côté serveur

- **Avant :** N'importe quelle chaîne acceptée comme version de CGU
- **Après :** Validation contre `CguVersionRepository::findCurrentVersion()` — seule la version active est acceptée

---

### [SEC] Isolation multi-tenant sur les prêts

- **Avant :** Un bibliothécaire pouvait créer des prêts pour des exemplaires/adhérents d'autres bibliothèques
- **Après :** Vérification systématique que l'exemplaire et l'adhérent appartiennent à la bibliothèque du bibliothécaire connecté

---

### [SEC] Rate Limiter Symfony configuré

- **Avant :** Seulement une protection applicative en base (5 tentatives → verrouillage)
- **Après :** `framework.yaml` configure deux limiteurs sliding window :
  - Par IP : 10 tentatives / 5 minutes
  - Par utilisateur : 5 tentatives / 15 minutes

---

## Corrections de bugs mineurs

### Body `code_postal` vs `codePostal`

- `BibliothequeController::create()` et `update()` lisaient `$data['codePostal']` (camelCase)
- Le frontend envoie `code_postal` (snake_case, conforme au type TypeScript)
- **Correctif :** Lecture en snake_case dans les deux méthodes

---

### ProtectedRoute — redirect loop sur chargement CGU

- **Avant :** Si `currentVersion === null` (CGU pas encore chargée), redirection systématique vers `/premier-login/cgu`
- **Après :** La redirection n'est déclenchée que si `currentVersion !== null`

---

## Documentation ajoutée

| Fichier | Description |
|---|---|
| `conception/SECURITY_NOTE.md` | Analyse détaillée des vulnérabilités et mesures correctives |
| `conception/PATCHNOTE.md` | Ce document |

---

## Fichiers modifiés

### Backend
- `src/Controller/PretController.php` — Bug $request + isolation multi-tenant
- `src/Controller/BibliothequeController.php` — Restriction liste + fix code_postal
- `src/Controller/UtilisateurController.php` — Validation MDP + rôle admin + validation CGU
- `config/packages/framework.yaml` — Rate limiter
- `src/DataFixtures/AppFixtures.php` — Données de test complètes

### Backend (nouveaux fichiers)
- `src/Entity/CguVersion.php`
- `src/Repository/CguVersionRepository.php`
- `src/Controller/CguController.php`
- `migrations/Version20260601000000.php`
- `migrations/Version20260602000000.php`
- `migrations/Version20260603000000.php`

### Frontend (nouveaux fichiers)
- `src/context/GlobalLoadingContext.tsx`
- `src/context/CguContext.tsx`
- `src/services/cguService.ts`
- `src/components/BibliothequeInactiveBanner.tsx`
- `src/pages/PremierLoginMotDePassePage.tsx`
- `src/pages/PremierLoginCguPage.tsx`
- `src/pages/MonComptePage.tsx`
- `src/pages/BibliothequeManagementPage.tsx`

### Frontend (modifiés)
- `src/pages/ProtectedRoute.tsx` — Fix redirect loop CGU

---

## Correctifs supplémentaires (audit post-Jalon 5)

### [FIX] Rate Limiter Symfony connecté à AuthController

- **Avant :** `framework.yaml` configuré mais `RateLimiterFactory` non injectée dans le controller
- **Après :** `AuthController` injecte `#[Target('loginIp')] RateLimiterFactory $loginIpLimiter`
- Vérification par IP sur `POST /api/login` avant tout traitement (sliding window : 10 req/5 min)

### [FIX] Docker Compose — chemins incorrects

- **Avant :** `context: ./backend` et `context: ./frontend` (invalides depuis `dev/docker/`)
- **Après :** `context: ../backend` et `context: ../frontend` (chemins corrects relatifs à `dev/docker/`)
- Volumes montés également corrigés

### [AJOUT] Dockerfile frontend

- `dev/frontend/Dockerfile` créé (Node 20 Alpine, `npm run dev --host 0.0.0.0`)

### [AJOUT] Registre de traitement RGPD

- `docs/registre_traitement.md` créé — conforme article 30 RGPD
- 4 traitements documentés : comptes utilisateurs, prêts, logs d'authentification, acceptation CGU

### [AJOUT] Rapport de cohérence jalons

- `conception/COHERENCE_JALONS.md` créé — audit complet des écarts entre jalons et code

---

## Points restants pour la soutenance (Jalon 6)

- [ ] Pipeline GitHub Actions CI/CD (`.github/workflows/ci.yml`)
- [ ] Déploiement cloud avec variables d'environnement de production
- [ ] Configurer `GOOGLE_BOOKS_API_KEY` en production
- [ ] Tests E2E Playwright
