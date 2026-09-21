## Cahier des Charges Fonctionnel :

## Application "BiblioTech Desktop"

**Auteur :** Grégory Sergent
**Organisme de formation :** IPSSI Grande École d'Informatique
**Objet :** Jalon 1 – Numérisation et gestion des bibliothèques locales
**Date :** 30 avril 2026
**Statut :** Version 2.0

# Sommaire

**Cahier des Charges Fonctionnel : Application "BiblioTech Desktop" 1**
I. Contexte Métier 2
   I.1 Contexte et Problématique 2
   I.2 Commanditaire 2
II. Objectifs du Projet 2
III. Périmètre Fonctionnel 2
   III.1 Exigences Fonctionnelles 2
   III.2 Exigences Non Fonctionnelles 3
IV. Exigences Techniques 3
V. Contraintes et Enjeux du Projet 3
   1. Calendrier et Jalons 3
   2. Risques Identifiés 3
   3. Critères de Succès 3
VI. Glossaire 4


## I. Contexte Métier

### I.1 Contexte et Problématique

Le secteur des bibliothèques municipales et associatives en France fait face à un défi de
modernisation. Si les grandes structures disposent de progiciels complexes (SIGB), de
nombreuses petites et moyennes bibliothèques utilisent encore des méthodes manuelles ou
des outils obsolètes pour le suivi de leur catalogue et de leurs usagers.
**BiblioTech** est une application desktop conçue pour simplifier la transition numérique de
ces établissements. Le problème à résoudre est la perte d'informations liée au suivi manuel
et le manque de visibilité sur l'état du stock en temps réel. L'application s'adresse
exclusivement au **personnel de la bibliothèque** (bibliothécaires et bénévoles) pour
centraliser la gestion des prêts, des retours et des relances.

### I.2 Commanditaire

> ⚠️ *Le commanditaire, la structure et les personnes mentionnées dans cette section sont entièrement fictifs. Ils ont été créés dans le cadre d'un exercice pédagogique.*

| Champ | Information |
|---|---|
| **Nom** | L'IPSSIthèque *(fictif)* |
| **Type de structure** | Bibliothèque associative — Aubusson, Creuse (23), commune rurale de ~3 200 habitants parmis les moins connectés de France *(fictif)* |
| **Contact projet** | Mme Isabelle Perrin, directrice de la bibliothèque *(fictif)* |
| **Situation actuelle** | Gestion des prêts sur registres papier et tableur Excel non partagé |
| **Besoin exprimé** | Disposer d'un outil numérique simple, installable sur les postes du personnel, pour centraliser catalogue, adhérents et prêts |

> **Distinction commanditaire / utilisateurs finaux :**
> Le **commanditaire** est l'**association gestionnaire de L'IPSSIthèque** (qui finance et valide le projet). Les **utilisateurs finaux** sont les membres du personnel de la bibliothèque (bibliothécaires et bénévoles). Les usagers de la bibliothèque (lecteurs) ne sont pas utilisateurs de l'application : ils n'ont aucun accès direct à BiblioTech.

## II. Objectifs du Projet

L'objectif est de livrer un outil robuste et sécurisé d'ici juin 2026. Les objectifs SMART sont :
● **Digitaliser 100% des flux d'emprunts** : Supprimer les registres papier au profit
d'une base de données centralisée.
● **Automatiser l'inventaire** : Réduire de 80% le temps de saisie d'un nouveau livre
grâce à l'interrogation d'API externes via l'ISBN.
● **Optimiser le suivi des retards** : Identifier instantanément les livres non rendus pour
faciliter les relances.
● **Assurer la conformité RGPD avant la mise en production** : mettre en place un registre de traitement documenté, implémenter le droit à l'oubli dans l'interface d'administration, et hacher les mots de passe avec l'algorithme Argon2id.

## III. Périmètre Fonctionnel

### III.1 Exigences Fonctionnelles

L'application se concentre sur les besoins "métier" de l'employé :

1. **Authentification Sécurisée** : Accès restreint au personnel via un identifiant et mot
    de passe chiffré.
2. **Gestion du Catalogue (CRUD)** :
    ○ Ajout de livres par scan/saisie d'ISBN (récupération auto des métadonnées :
       titre, auteur, résumé, couverture).
    ○ Gestion manuelle des exemplaires (état du livre, disponibilité).
3. **Gestion des Adhérents** : Création de fiches lecteurs (nom, coordonnées, date
    d'adhésion).
4. **Module de Prêts/Retours** :
    ○ Enregistrement d'un prêt en associant un livre à un adhérent.
    ○ Calcul automatique de la date de retour prévue.
    ○ Validation du retour et mise à jour immédiate du stock.
5. **Tableau de Bord de Suivi** : Visualisation des livres en retard et statistiques simples
    (livres les plus loués).
_Hors périmètre : Réservation en ligne par les usagers (l'application est strictement interne)._

### III.2 Exigences Non Fonctionnelles

Ces exigences définissent les qualités attendues du système, indépendamment des fonctionnalités :

| Catégorie | Exigence | Critère de mesure |
|---|---|---|
| **Performance** | Ajout d'un livre via ISBN | ≤ 5 secondes (appel API + affichage formulaire pré-rempli) |
| **Sécurité** | Protection contre le Top 10 OWASP | Injections SQL bloquées (Doctrine ORM), XSS (React), CSRF (API stateless JWT), hachage Argon2id |
| **Conformité** | RGPD | Registre de traitement documenté, droit à l'oubli implémenté avant mise en production |
| **Maintenabilité** | Couverture de tests | Pipeline CI/CD avec 100 % des tests passants à chaque build |
| **Compatibilité** | Systèmes d'exploitation | Windows 10+ et macOS 12+ (installateur natif Tauri) |
| **Disponibilité** | Mode hors connexion partiel | Consultation du catalogue et des prêts possible sans connexion internet active |


## IV. Exigences Techniques

Pour répondre aux besoins de performance et de maintenabilité, les choix suivants ont été
arrêtés :
● **Architecture** : Approche **Découplée (Headless)**. Une API Symfony pour la logique
métier et une application desktop React (via **Tauri** ) pour l'interface. Ce choix garantit
une expérience utilisateur fluide (UX native) tout en isolant la logique de données.
● **Stack Technique** :
○ **Backend** : PHP 8.3+, Symfony 7 (API Platform).
○ **Frontend** : React 18, Tailwind CSS, Tauri (pour l'installateur Desktop).
○ **Base de Données** : PostgreSQL (hébergé sur Supabase).
● **Infrastructure & Qualité** :
○ **Conteneurisation** : Docker pour l'homogénéité des environnements.
○ **CI/CD** : Pipeline via GitHub Actions (Tests automatisés et build des
exécutables).
○ **Tests** : Tests unitaires (PHPUnit), tests d'intégration et tests fonctionnels.
● **Sécurité** : Protection contre le Top 10 OWASP (Injections SQL via Doctrine ORM,
XSS via React, CSRF via Symfony, hachage Argon2id).

## V. Contraintes et Enjeux du Projet

### 1. Calendrier et Jalons

Le projet s'étale sur 6 mois (Janvier - Juin 2026) :
● **Janvier** : CDCF (Jalon actuel).
● **Février** : Méthodologie de Projet & Conception UI/UX.
● **Mars** : Modélisation de la Base de Données.
● **Avril** : Conception de l’application & Architecture.
● **Mai** : Développement, Sécurité & Tests (version Bêta).
● **Juin** : Déploiement et Mise en Production (Livrable final).

### 2. Risques Identifiés

```
● API Tierce : Dépendance aux API de recherche de livres (ex: Open Library).
Solution : Prévoir un mode de saisie manuelle de secours.
● Sécurité des données : Manipulation de données personnelles (Adhérents).
Solution : Conformité stricte RGPD (chiffrement, droit à l'oubli, registre de traitement).
● Délai : Périmètre fonctionnel large pour une personne seule. Solution : Priorisation
stricte du MVP (Prêts/Retours) avant les statistiques.
```
### 3. Critères de Succès

Le projet sera considéré comme réussi si :

1. L'installateur (.exe ou .msi) est fonctionnel et s'interface correctement avec l'API.


2. Un livre peut être ajouté en moins de 5 secondes via son ISBN.
3. Le pipeline CI/CD valide 100% des tests à chaque déploiement.
4. L'interface est jugée intuitive par un utilisateur test lors de la démonstration finale.


## VI. Glossaire

| Terme | Définition |
|---|---|
| **API** | Application Programming Interface – interface permettant à deux logiciels de communiquer via des requêtes HTTP normalisées. |
| **CI/CD** | Continuous Integration / Continuous Deployment – automatisation des tests et du déploiement à chaque modification du code source (ici via GitHub Actions). |
| **CRUD** | Create, Read, Update, Delete – les quatre opérations de base sur une base de données. |
| **Docker** | Outil de conteneurisation permettant d'exécuter des applications dans des environnements isolés et reproductibles. |
| **Headless** | Architecture découplée : le backend (API) et le frontend (interface) sont deux applications distinctes communiquant via HTTP. |
| **ISBN** | International Standard Book Number – identifiant numérique unique attribué à chaque édition d'un livre (13 chiffres). |
| **JWT** | JSON Web Token – format de jeton d'authentification signé, utilisé pour sécuriser les échanges entre le frontend et l'API. |
| **MVP** | Minimum Viable Product – version minimale du produit incluant uniquement les fonctionnalités essentielles pour valider le projet. |
| **OWASP** | Open Web Application Security Project – organisation référençant les 10 failles de sécurité les plus critiques des applications web. |
| **ORM** | Object-Relational Mapping – couche d'abstraction permettant de manipuler la base de données via des objets (ici : Doctrine pour Symfony). |
| **RGPD** | Règlement Général sur la Protection des Données – réglementation européenne encadrant la collecte et le traitement des données personnelles. |
| **SIGB** | Système Intégré de Gestion de Bibliothèque – logiciel métier complet utilisé par les grandes bibliothèques (ex : PMB, Koha). |
| **Tauri** | Framework open source permettant de créer des applications desktop natives (Windows, macOS, Linux) à partir d'un frontend web (React). |


