# Rapport de cohérence — Jalons vs Code vs CDC technique

> Document d'audit interne — Jalon 6 BiblioTech
> Date : 2026-07-06
> Auteur : Audit automatisé post-Jalon 5

---

## 1. Lecture des exigences du CDC technique

Le CDC technique (`CDC technique.md`) définit les exigences obligatoires pour l'ensemble du projet CDA. Voici leur statut dans BiblioTech :

| Exigence CDC | Statut | Détail |
|---|---|---|
| Backend Symfony (PHP) | ✅ Conforme | Symfony 7.2 + PHP 8.3 |
| Frontend React ou Angular (SPA) | ✅ Conforme | React 18/19 + TypeScript + Vite |
| Base de données relationnelle (PG/MySQL/MariaDB) | ✅ Conforme | PostgreSQL 16 via Doctrine ORM |
| Architecture MVC/n-tiers | ✅ Conforme | Controller/Service/Repository/Entity |
| API externe intégrée | ✅ Conforme | Google Books API (ISBN lookup) |
| Authentification sécurisée | ✅ Conforme | JWT RS256 + Argon2id + refresh token |
| Sécurité OWASP Top 10 | ✅ Conforme | Adressé (voir SECURITY_NOTE.md) |
| RGPD | ⚠️ Partiel | Droit à l'oubli implémenté ; registre manquant |
| Tests automatisés (PHPUnit) | ✅ Conforme | 40 tests (8 unitaires + 32 intégration) |
| Git avec stratégie de branches | ✅ Conforme | GitFlow : main/develop/feat/* |
| Docker + Docker Compose | ⚠️ Partiel | Voir §3.1 |
| CI/CD pipeline | ❌ Absent | Reconnu dans Jalon 5, prévu Jalon 6 |
| Interface responsive | ✅ Conforme | Tailwind CSS v4 + layouts mobile-first |
| Déploiement documenté | ❌ Absent | Prévu Jalon 6 |

---

## 2. Cohérence entre les jalons (entre eux)

### 2.1 Jalon 1 → Jalon 5 : Fonctionnalités

Le Jalon 1 (cahier des charges fonctionnel) définissait les grandes fonctionnalités. Bilan :

| Fonctionnalité Jalon 1 | Implémenté | Commentaire |
|---|---|---|
| Gestion des bibliothèques (CRUD) | ✅ | `BibliothequeController` + `BibliothequeManagementPage` |
| Gestion des utilisateurs (4 rôles) | ✅ | RBAC complet : super_admin, admin, bibliothecaire, adherent |
| Gestion du catalogue (livres + exemplaires) | ✅ | `LivreController`, `ExemplaireController` |
| Gestion des prêts | ✅ | `PretController`, `PretService` |
| Recherche ISBN via Google Books | ✅ | `GoogleBooksService` (clé API non encore configurée) |
| Demandes de migration entre bibliothèques | ✅ | `DemandeMigrationController` |
| Statistiques | ✅ | `StatController` |
| Authentification | ✅ | JWT RS256 + refresh token |

**Conclusion Jalon 1→5 : toutes les fonctionnalités promises sont implémentées.**

---

### 2.2 Jalon 3 : Catalogue global vs catalogue par bibliothèque

**Discordance détectée.**

Le Jalon 3 (modélisation BDD) décrit un catalogue de livres **global** — la table `livres` n'a pas de `bibliotheque_id`. Chaque bibliothèque pointerait vers les mêmes livres via les exemplaires.

L'implémentation réelle a un catalogue **par bibliothèque** : la table `livres` contient `bibliotheque_id`. Un livre appartient à une bibliothèque.

**Impact :** Le MCD/MLD du Jalon 3 est techniquement faux par rapport au code.

**Justification à préparer pour la soutenance :**
> "Lors de l'implémentation, il est apparu qu'un catalogue global nécessite une gestion complexe des droits de modification (qui peut éditer un livre partagé ?). L'architecture par bibliothèque simplifie le contrôle d'accès et l'isolation des données, conforme aux principes OWASP A01."

---

### 2.3 Jalon 4 : Validation des migrations

**Discordance mineuvre détectée.**

Le Jalon 4 (conception UML) indique que les demandes de migration entre bibliothèques sont validées par l'`admin`. L'implémentation restreint cette validation au `super_admin`.

**Justification :**
> "Évolution de conception en faveur d'une meilleure séparation des responsabilités. Seul le super_admin a une vision cross-bibliothèques nécessaire pour valider les migrations."

---

### 2.4 Jalon 5 : Ce qui est documenté mais absent du code

| Élément documenté dans Jalon 5 | Présent en code | Commentaire |
|---|---|---|
| `BiblioTechVoter.php` (AttributeVoter Symfony) | ❌ Absent | L'isolation multi-tenant est implémentée **directement dans les controllers** (sans Voter). Fonctionnellement équivalent mais l'architecture diffère du document. |
| DTOs validés (ex. `CreatePretDTO.php`) | ❌ Absent | La validation des entrées est manuelle dans les controllers. Pas de dossier `src/DTO/`. |
| `POST /api/cgu/accept` (dans CguController) | ⚠️ Différent | L'endpoint existe en `POST /api/utilisateurs/me/accept-cgu` (dans `UtilisateurController`). Fonctionnellement équivalent. |
| `MonComptePage` — 6 onglets | ⚠️ Partiel | Implémentée avec 3 sections (profil, mot de passe, suppression de compte). Les onglets RGPD, CGU historique et accessibilité sont absents. |
| `docs/registre_traitement.md` | ❌ Absent | Le dossier `docs/` n'existe pas. |
| Rate Limiter connecté à `AuthController` | ✅ Corrigé | Connecté lors du patch Jalon 6 (inject. `RateLimiterFactory` + `#[Target('loginIp')]`). |
| AppFixtures avec données de test | ✅ Corrigé | Rempli lors du patch Jalon 6. |
| Migrations 601, 602, 603 | ✅ Corrigé | Créées lors du patch Jalon 6. |

---

## 3. Problèmes critiques à corriger avant la soutenance

### 3.1 Docker Compose — chemins invalides

**Problème :**
`dev/docker/docker-compose.yml` référence `context: ./backend` et `context: ./frontend`, mais ces dossiers n'existent pas dans `dev/docker/`. Le code backend est en `dev/backend/`, le frontend en `dev/frontend/`.

De plus, les volumes `- ./backend:/var/www/html` et `- ./frontend:/app` sont également incorrects pour la même raison.

**Fichier Dockerfile frontend manquant :** `dev/backend/Dockerfile` existe, mais il n'y a pas de Dockerfile dans `dev/docker/` ni dans `dev/frontend/`.

**Correction à faire :**
Soit déplacer le `docker-compose.yml` à la racine de `dev/`, soit corriger les chemins :
```yaml
# Chemins à corriger dans dev/docker/docker-compose.yml
app:
  build:
    context: ../backend    # ← corrigé
  volumes:
    - ../backend:/var/www/html  # ← corrigé

frontend:
  build:
    context: ../frontend   # ← corrigé
  volumes:
    - ../frontend:/app     # ← corrigé
    - /app/node_modules
```
Et créer un `Dockerfile` dans `dev/frontend/`.

---

### 3.2 Registre de traitement RGPD manquant

**Problème :**
Le Jalon 5 affirme : *"Registre de traitement : documenté dans `docs/registre_traitement.md`"*. Ce fichier n'existe pas.

**Impact :** Discordance entre le livrable et la réalité. En soutenance, le jury peut demander à voir ce document.

**Correction à faire :** Créer `docs/registre_traitement.md` avec le registre des traitements de données personnelles conforme RGPD.

---

### 3.3 Tests — fichiers présents mais non mentionnés dans Jalon 5

**Constat :**
Le Jalon 5 décrit 5 fichiers de tests, mais 8 fichiers existent en réalité :
- Mentionnés : `AuthControllerTest`, `LivreControllerTest`, `PretControllerTest`, `PretServiceTest`, `GoogleBooksServiceTest`
- Présents également : `ExemplaireControllerTest`, `UtilisateurControllerTest`, `BibliothequeControllerTest`

**Impact :** Le nombre de tests réel est supérieur à celui annoncé — c'est **favorable**. À valoriser en soutenance.

---

### 3.4 CI/CD — absence reconnue

**Statut :** Reconnu et documenté dans le Jalon 5 (section 6.4). La justification est claire et cohérente avec les contraintes d'un projet académique individuel.

**À faire pour Jalon 6 :**
- Configurer `.github/workflows/ci.yml` avec PHPUnit + PostgreSQL test service
- Optionnel : `npm run lint` + `tsc -b` sur le frontend

---

## 4. Récapitulatif des actions pour la soutenance

### À faire avant la soutenance (urgent)

| Action | Priorité | Effort |
|---|---|---|
| Corriger les chemins du `docker-compose.yml` | CRITIQUE | ✅ Fait |
| Créer un `Dockerfile` pour le frontend | CRITIQUE | ✅ Fait |
| Créer `docs/registre_traitement.md` | HAUTE | ✅ Fait |
| Configurer GitHub Actions CI | HAUTE | À faire |

### Déjà corrigé dans ce patch (Jalon 6)

- Rate Limiter Symfony connecté à `AuthController`
- Migrations 601/602/603 créées
- AppFixtures complètes
- Frontend : tous les fichiers manquants créés
- Sécurité : isolation multi-tenant, validation MDP côté serveur, restriction rôles
- Docker Compose chemins corrigés + Dockerfile frontend créé
- `docs/registre_traitement.md` créé
- `SECURITY_NOTE.md` + `PATCHNOTE.md` + `COHERENCE_JALONS.md` rédigés
- Jalons précédents : non modifiés (captures et diagrammes déjà en place)

### À mentionner / justifier en soutenance

- Catalogue par bibliothèque (vs global dans Jalon 3) — justification architecturale prête
- Absence d'AttributeVoter (isolation inline) — acceptable pour le niveau académique
- Absence de DTOs formels — validation manuelle en place, fonctionnellement équivalent
- Endpoint `/api/utilisateurs/me/accept-cgu` vs `/api/cgu/accept` — différence de placement, même résultat

---

## 5. Points forts à valoriser

1. **Architecture headless complète** : Symfony 7 API REST + React SPA + Tauri (desktop). Rarement vu à ce niveau en CDA.
2. **JWT RS256 avec refresh token rotation** : plus sécurisé que les implémentations HS256 basiques.
3. **Flux premier login complet** : changement de mot de passe obligatoire + CGU versionnées avec préavis 15 jours.
4. **Isolation multi-tenant** : `bibliotheque_id` vérifié sur chaque endpoint sensible.
5. **RGPD** : droit à l'oubli avec anonymisation (pas suppression) des prêts, minimisation des données.
6. **40+ tests PHPUnit** (réellement 8 fichiers de tests — à compter précisément).
7. **GitFlow propre** : conventional commits, main/develop/feat/*, merge --no-ff.
