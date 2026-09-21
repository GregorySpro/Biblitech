# Jalon 2 – Méthodologie de projet & Conception UI/UX

**Projet :** BiblioTech Desktop
**Auteur :** Grégory Sergent
**Date :** 25/02/2026
**Version :** 1.0 (brouillon de travail)

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

---

## 2) Conception UX/UI

### 2.1 Zoning / Sitemap (structure globale)
**Sitemap (écrans principaux)**
- **Authentification**
  - Connexion
- **Tableau de bord**
  - Vue synthétique (prêts en retard + stats)
- **Catalogue**
  - Liste des livres
  - Détail livre
  - Ajout / édition
- **Adhérents**
  - Liste des adhérents
  - Détail adhérent
  - Ajout / édition
- **Prêts / Retours**
  - Création d’un prêt
  - Liste des prêts (tableau + recherche)
  - Retour d’un livre

### 2.2 Zoning (écran type)

**Desktop – Écran "Authentification"**
| Zone | Contenu |
|---|---|
| Zone centrale | Formulaire de connexion (identifiant + mot de passe) |
| Zone inférieure / action | Bouton de connexion |

**Desktop – Écran "Tableau de bord"**
| Zone | Contenu |
|---|---|
| Navbar | Navigation principale |
| Zone statistiques | Cartes de statistiques de prêt (nb prêts en cours, retards, etc.) |
| Zone tableau 1 | Tableau des prêts en retard |
| Zone tableau 2 | Tableau des derniers prêts |

**Desktop – Écran "Catalogue"**
| Zone | Contenu |
|---|---|
| Navbar | Navigation principale |
| Zone recherche | Barre de recherche |
| Zone tableau | Liste des livres (tableau) |
| Zone détail | Détails du livre sélectionné |
| Zone actions | Boutons d'ajout et d'édition de livre |

**Desktop – Écran "Adhérents"**
| Zone | Contenu |
|---|---|
| Navbar | Navigation principale |
| Zone recherche | Barre de recherche |
| Zone liste | Liste des adhérents |
| Zone détail | Détails de l'adhérent sélectionné |
| Zone actions | Boutons d'ajout, d'édition et de suppression d'adhérent |

**Desktop – Écran "Prêts / Retours"**
| Zone | Contenu |
|---|---|
| Navbar | Navigation principale |
| Zone recherche | Barre de recherche |
| Zone liste | Liste des prêts en cours |
| Zone détail | Détails du prêt sélectionné |
| Zone actions | Boutons "Créer un prêt" et "Rendre un prêt" |

### 2.3 Wireframes (basse fidélité)
*(Captures Figma à insérer)*

**A) Desktop – Authentification**
- Logo de l'application (haut droite)
- 2 labels (identifiant, mot de passe)
- 2 champs de saisie
- 1 bouton de connexion

**B) Desktop – Tableau de bord**
- Navbar gauche : liste de navigation + bouton déconnexion
- Zone stats (haut) : 3 blocs de statistiques
- 2 tableaux liste en dessous (prêts en retard + derniers prêts)

**C) Desktop – Catalogue**
- Navbar gauche : liste de navigation + bouton déconnexion
- Barre de recherche (haut de l'écran)
- Tableau liste des livres
- Zone détail du livre sélectionné (à droite du tableau)
- 2 boutons sous le tableau : édition + ajout d'un livre

**D) Desktop – Adhérents**
- Navbar gauche : liste de navigation + bouton déconnexion
- Barre de recherche (haut de l'écran)
- Tableau liste des adhérents
- Zone détail de l'adhérent sélectionné (à droite du tableau)
- 3 boutons sous le tableau : ajout + édition + suppression d'un adhérent

**E) Desktop – Prêts / Retours**
- Navbar gauche : liste de navigation + bouton déconnexion
- Barre de recherche (haut de l'écran)
- Tableau liste des prêts en cours
- Zone détail du prêt sélectionné (à droite du tableau)
- 2 boutons sous le tableau : créer un prêt + rendre un prêt

### 2.4 Charte graphique (proposition)
- **Couleurs**
  - Primaire : Bleu nuit `#1E3A8A`
  - Secondaire : Bleu clair `#60A5FA`
  - Accent : Vert validation `#16A34A`
  - Neutres : Gris clair `#F3F4F6`, Gris foncé `#374151`
- **Typographie**

  | Usage | Police | Style | Taille |
  |---|---|---|---|
  | Titre principal (H1) | **Sora** | Bold | 28px |
  | Titres de section (H2/H3) | **Sora** | SemiBold | 20px / 16px |
  | Texte courant | **DM Sans** | Regular | 14px |
  | Labels / libellés | **DM Sans** | Medium | 13px |
  | Légendes / métadonnées | **DM Sans** | Regular | 12px |
  | Code / ISBN | **JetBrains Mono** | Regular | 13px |

- **Style**
  - Interface sobre et professionnelle
  - Icônes linéaires (Heroicons)
  - Espacements généreux pour lisibilité

### 2.5 Maquettes graphiques (haute fidélité)
- **Desktop :** écran Tableau de bord
- **Mobile :** écran Catalogue (liste)

*(Ajouter ici les captures Figma ou un lien vers le prototype)*

### 2.6 Considérations UX
- **Scan ISBN** pour ajout rapide de livres
- **Messages d’erreur clairs** (ISBN invalide, adhérent introuvable)
- **Feedback instantané** sur actions critiques (prêt, retour)
- **Accessibilité** : contrastes élevés, navigation clavier
- **Performance** : listes paginées, recherche rapide

---

## 3) Points à valider
- Outil de suivi validé : Trello
- Choix final de la palette (couleurs + logo)
- Wireframes et maquettes (ajout des visuels)
- CI GitHub Actions : à confirmer selon disponibilité
- Lien du dépôt Git (à créer)

---

### Remarque
Ce document est un **brouillon opérationnel**. Il sera enrichi avec les visuels (wireframes, maquettes) et les liens vers les outils utilisés avant la remise officielle du jalon 2.
