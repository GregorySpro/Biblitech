# Registre des activités de traitement — BiblioTech

> Conformément à l'article 30 du Règlement Général sur la Protection des Données (RGPD — UE 2016/679)
> Responsable de traitement : Bibliothèque utilisant la plateforme BiblioTech
> Sous-traitant applicatif : Grégory Sergent (développeur, projet CDA IPSSI 2026)
> Date de création : 2026-07-06
> Version : 1.0

---

## Traitement 1 — Gestion des comptes utilisateurs

| Champ | Valeur |
|---|---|
| **Finalité** | Permettre l'authentification et la gestion des accès à la plateforme BiblioTech |
| **Base légale** | Intérêt légitime (art. 6.1.f) / Exécution d'un contrat de service bibliothécaire (art. 6.1.b) |
| **Catégories de personnes** | Adhérents, bibliothécaires, administrateurs de bibliothèque, super-administrateurs |
| **Données collectées** | Prénom, nom, adresse e-mail, mot de passe (haché Argon2id), rôle, bibliothèque d'appartenance |
| **Données non collectées** | Date de naissance, numéro de téléphone, adresse postale, données de santé |
| **Durée de conservation** | Durée d'adhésion + 1 an après clôture du compte |
| **Destinataires** | Administrateurs de la bibliothèque concernée, super-administrateur de la plateforme |
| **Transfert hors UE** | Aucun |
| **Mesures de sécurité** | Hachage Argon2id (mémoire 65536, itérations 4), JWT RS256, refresh token rotation |

---

## Traitement 2 — Gestion des prêts de livres

| Champ | Valeur |
|---|---|
| **Finalité** | Enregistrer et suivre les emprunts d'ouvrages par les adhérents |
| **Base légale** | Exécution d'un service bibliothécaire (art. 6.1.b) |
| **Catégories de personnes** | Adhérents |
| **Données collectées** | Identifiant adhérent, identifiant exemplaire, dates d'emprunt et de retour prévue/réelle, statut du prêt |
| **Durée de conservation** | 3 ans après la date de retour (historique bibliothécaire) |
| **Destinataires** | Bibliothécaires et administrateurs de la bibliothèque concernée |
| **Transfert hors UE** | Aucun |
| **Mesures de sécurité** | Isolation multi-tenant (chaque bibliothèque ne voit que ses propres prêts) |

---

## Traitement 3 — Journalisation des tentatives d'authentification

| Champ | Valeur |
|---|---|
| **Finalité** | Protection contre les attaques par force brute |
| **Base légale** | Intérêt légitime — sécurité du système (art. 6.1.f) |
| **Catégories de personnes** | Tous les utilisateurs tentant une connexion |
| **Données collectées** | Compteur de tentatives (`login_attempts`), date de verrouillage (`locked_until`), adresse IP (via Rate Limiter, non persistée en base) |
| **Durée de conservation** | Compteur réinitialisé à la connexion réussie. Verrouillage : 15 minutes. IP non stockée. |
| **Destinataires** | Système applicatif (automatique) |
| **Transfert hors UE** | Aucun |

---

## Traitement 4 — Versionnement et acceptation des CGU

| Champ | Valeur |
|---|---|
| **Finalité** | Tracer l'acceptation des Conditions Générales d'Utilisation par les utilisateurs |
| **Base légale** | Obligation légale / consentement éclairé (art. 6.1.c) |
| **Catégories de personnes** | Tous les utilisateurs de la plateforme |
| **Données collectées** | Numéro de version CGU acceptée (`cgu_accepted_version`) par utilisateur |
| **Durée de conservation** | Durée de vie du compte |
| **Destinataires** | Super-administrateur (audit de conformité) |
| **Transfert hors UE** | Aucun |

---

## Droits des personnes concernées

Conformément aux articles 15 à 22 du RGPD, les utilisateurs de BiblioTech disposent des droits suivants :

| Droit | Implémentation technique |
|---|---|
| **Droit d'accès** | `GET /api/utilisateurs/me` — l'utilisateur peut consulter toutes ses données |
| **Droit de rectification** | `PATCH /api/utilisateurs/me` — modification du profil (nom, email) |
| **Droit à l'effacement** | `DELETE /api/utilisateurs/{id}` — anonymisation des données : prénom/nom/email remplacés par `[SUPPRIMÉ]`, les prêts historiques sont conservés sans données personnelles |
| **Droit à la portabilité** | Non implémenté (hors périmètre de la version académique) |
| **Droit d'opposition** | Suppression du compte disponible |

> **Note sur l'anonymisation :** Conformément à la recommandation CNIL, la suppression d'un compte n'entraîne pas la destruction des données de prêt (nécessaires à la comptabilité bibliothécaire) mais leur anonymisation irréversible.

---

## Mesures de sécurité globales

| Mesure | Détail |
|---|---|
| Chiffrement des mots de passe | Argon2id — conforme OWASP (memory_cost: 65536, time_cost: 4) |
| Authentification sans état | JWT RS256 (clés asymétriques RSA 4096 bits) |
| Transport sécurisé | HTTPS obligatoire en production (CORS configuré) |
| Clés secrètes | JWT keys exclues du dépôt Git (`.gitignore` double exclusion) |
| Variables d'environnement | Données sensibles dans `.env.local` (non versionné) |
| Isolation des données | Chaque bibliothèque ne peut accéder qu'à ses propres données (`bibliotheque_id`) |
| Protection anti-brute force | Verrou 15 min après 5 tentatives + Rate Limiter Symfony (10 req/5 min par IP) |
