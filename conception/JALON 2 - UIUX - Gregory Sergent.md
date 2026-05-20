# Jalon 2 – Conception UI/UX

**Projet :** BiblioTech Desktop
**Auteur :** Grégory Sergent
**Date :** 28/02/2026
**Version :** 1.0

---

## Page de garde

**Formation :** CDA – Concepteur Développeur d'Applications
**Période :** Janvier → Juin 2026
**Livrable :** Jalon 2 – Conception UI/UX

---

## Sommaire

*(À générer dans Google Docs : **Insertion → Table des matières**)*

---

## 1) Zoning et Sitemap

### 1.1 Sitemap (écrans principaux)

Le sitemap ci-dessous présente l'ensemble des écrans de l'application BiblioTech Desktop et les liens de navigation entre eux.

- **Authentification**
  - Connexion
- **Tableau de bord**
  - Vue synthétique (prêts en retard + statistiques)
- **Catalogue**
  - Liste des livres
  - Détail d'un livre
  - Ajout / Édition d'un livre
- **Adhérents**
  - Liste des adhérents
  - Détail d'un adhérent
  - Ajout / Édition d'un adhérent
- **Prêts / Retours**
  - Création d'un prêt
  - Liste des prêts (tableau + barre de recherche)
  - Retour d'un livre

### 1.2 Zoning (écran type)

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


*(Insérer ici le schéma de zoning – capture Figma)*

---

## 2) Wireframes (maquettes basse fidélité)

Les wireframes suivants définissent l'agencement des éléments sans design final. Ils couvrent les écrans clés de l'application.

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

*(Insérer ici les wireframes – captures Figma)*

---

## 3) Charte graphique

### 3.1 Palette de couleurs

| Rôle | Couleur | Code hex |
|---|---|---|
| Primaire | Bleu nuit | `#1E3A8A` |
| Secondaire | Bleu clair | `#60A5FA` |
| Accent / Validation | Vert | `#16A34A` |
| Neutre clair | Gris clair | `#F3F4F6` |
| Neutre foncé | Gris foncé | `#374151` |

**Justification :** le bleu nuit inspire confiance et sérieux, adapté à un outil professionnel interne. Le vert est réservé aux actions de validation pour un feedback visuel immédiat.

### 3.2 Typographie

| Usage | Police | Style | Taille |
|---|---|---|---|
| Titre principal (H1) | **Sora** | Bold | 28px |
| Titres de section (H2/H3) | **Sora** | SemiBold | 20px / 16px |
| Texte courant | **DM Sans** | Regular | 14px |
| Labels / libellés | **DM Sans** | Medium | 13px |
| Légendes / métadonnées | **DM Sans** | Regular | 12px |
| Code / ISBN | **JetBrains Mono** | Regular | 13px |

**Justification :**
- **Sora** est une police géométrique moderne, aux formes légèrement arrondies — elle apporte une touche contemporaine tout en restant professionnelle pour les titres.
- **DM Sans** est conçue pour les interfaces numériques : très lisible à petite taille, avec des espacements équilibrés parfaits pour des tableaux et formulaires.
- **JetBrains Mono** est utilisée uniquement pour les identifiants techniques (ISBN, codes) pour les distinguer clairement du reste du contenu.

### 3.3 Style général

- Icônes linéaires : **Heroicons**
- Espacements généreux pour maximiser la lisibilité
- Interface sobre et professionnelle, sans effets décoratifs superflus

*(Insérer ici la planche de charte graphique – capture Figma)*

---

## 4) Maquettes graphiques (haute fidélité)

Les maquettes ci-dessous appliquent la charte graphique définie et représentent le rendu final prévu.

### 4.1 Version Desktop – Tableau de bord

*(Insérer ici la maquette haute fidélité desktop – capture Figma)*

### 4.2 Version Mobile – Liste du catalogue

*(Insérer ici la maquette haute fidélité mobile – capture Figma)*

---

## 5) Considérations UX

- **Scan ISBN :** ajout d'un livre en moins de 5 secondes via scan ou saisie manuelle.
- **Feedback visuel :** messages de confirmation/erreur clairs sur chaque action critique (prêt validé, ISBN invalide, adhérent introuvable).
- **Accessibilité :** contrastes élevés conformes aux recommandations WCAG, navigation clavier complète.
- **Performance :** listes paginées pour éviter les temps de chargement excessifs même avec un grand catalogue.
- **Principe Mobile First :** l'interface s'adapte à des résolutions réduites, avec des zones tactiles suffisamment grandes.
