# Jalon 2 – Méthodologie et organisation du projet

**Projet :** BiblioTech Desktop
**Auteur :** Grégory Sergent
**Date :** 28/02/2026
**Version :** 1.0

---

## Page de garde

**Formation :** CDA – Concepteur Développeur d’Applications
**Période :** Janvier → Juin 2026
**Livrable :** Jalon 2 – Méthodologie et organisation du projet

---

## Sommaire

*(À générer dans Google Docs : **Insertion → Table des matières**)*

---

## 1) Méthodologie et organisation du projet

### 1.1 Méthode de gestion
**Approche choisie : Agile – Scrum adapté en solo.**
- **Cadence :** 1 sprint par mois (aligné sur les jalons).
- **Définition :** un *sprint* est une période courte et fixe durant laquelle on réalise un lot d’objectifs précis.
- **Rituels adaptés :**
  - **Sprint planning mensuel** : définition des objectifs du jalon + découpage en tâches.
  - **Revue hebdomadaire** : contrôle de l’avancement, mise à jour du backlog Trello.
  - **Rétrospective mensuelle** : bilan des difficultés/solutions et ajustements.
- **Justification :** ce format léger garde un cadre clair tout en restant réaliste pour un travail en solo.

### 1.2 Macro‑planning (jusqu’à juin 2026)
| Mois | Objectifs principaux | Livrables attendus |
|---|---|---|
| **Janvier** | Cadrage fonctionnel | CDCF (Jalon 1) |
| **Février** | Organisation & design UI/UX | Méthodologie + maquettes (Jalon 2) |
| **Mars** | Conception des données | MCD/MLD/MPD + dictionnaire (Jalon 3) |
| **Avril** | Conception applicative & architecture | UML + archi (Jalon 4) |
| **Mai** | Implémentation + sécurité + tests | Version bêta + preuves CI + tests (Jalon 5) |
| **Juin** | Déploiement & finalisation | Livraison finale + mise en prod (Jalon 6) |

### 1.3 Suivi des tâches
**Outil :** Trello (Kanban)
- Colonnes : *Backlog* → *À faire* → *En cours* → *En revue* → *Terminé*
- **Rythme :** mise à jour hebdomadaire, ajustement du backlog à chaque sprint planning.
- **Traçabilité :** chaque carte correspond à une user story ou tâche technique, avec checklist si besoin.

### 1.4 Gestion du code source (Git)
- **Branches :**
  - `main` : versions stables (jalons)
  - `develop` : intégration continue
  - `feature/*` : nouvelles fonctionnalités ou correctifs
- **Process :** PR systématique vers `develop` (auto‑revue avant merge).
- **Conventions :** commits courts et explicites (ex. `feat: isbn lookup`, `fix: loan return status`).

### 1.5 CI/CD planifié
**CI (objectif si le temps le permet)**
- **Cible : GitHub Actions**
- À chaque push (objectif) :
  - Tests PHP (PHPUnit) pour l’API Symfony
  - Lint/format (PHP-CS-Fixer / ESLint)
  - Build front React
  - Build Docker (API)
- **Plan B si manque de temps :** exécuter les tests et le build localement avant chaque jalon, avec checklist documentée.

**CD (à partir de mai/juin)**
- Publication d’images Docker (API) vers Docker Hub ou GHCR
- Build desktop Tauri (Windows) via pipeline CI ou en local si nécessaire
- Livraison du binaire `*.exe` en artefact release
