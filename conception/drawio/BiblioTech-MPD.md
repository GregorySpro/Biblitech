# BiblioTech – Schéma Physique des Données (MPD)

> **MPD PostgreSQL** — types physiques, contraintes et clés étrangères explicites.
> Toutes les FK ont `ON DELETE RESTRICT` sauf mention contraire.

```mermaid
erDiagram

    bibliotheques {
        SERIAL          id                  PK  "NOT NULL"
        VARCHAR_150     nom                     "NOT NULL"
        TEXT            adresse
        VARCHAR_150     email_contact           "NOT NULL UNIQUE"
        VARCHAR_20      telephone
        BOOLEAN         actif                   "NOT NULL DEFAULT true"
    }

    utilisateurs {
        SERIAL          id                  PK  "NOT NULL"
        VARCHAR_100     nom                     "NOT NULL"
        VARCHAR_100     prenom                  "NOT NULL"
        VARCHAR_150     email                   "NOT NULL UNIQUE"
        VARCHAR_255     mot_de_passe            "NOT NULL — bcrypt"
        VARCHAR_30      role                    "NOT NULL CHECK IN (super_admin,admin,bibliothecaire,adherent)"
        INTEGER         bibliotheque_id     FK  "NULL si super_admin — ON DELETE RESTRICT"
        BOOLEAN         actif                   "NOT NULL DEFAULT true"
    }

    livres {
        SERIAL          id                  PK  "NOT NULL"
        VARCHAR_20      isbn                    "NOT NULL UNIQUE"
        VARCHAR_255     titre                   "NOT NULL"
        VARCHAR_255     auteur                  "NOT NULL"
        VARCHAR_150     editeur
        SMALLINT        annee_publication
        VARCHAR_100     genre
        TEXT            resume
        TEXT            couverture_url          "Google Books API"
        DATE            date_ajout              "NOT NULL DEFAULT CURRENT_DATE"
    }

    exemplaires {
        SERIAL          id                  PK  "NOT NULL"
        INTEGER         livre_id            FK  "NOT NULL — ON DELETE RESTRICT"
        INTEGER         bibliotheque_id     FK  "NOT NULL — ON DELETE RESTRICT"
        VARCHAR_20      statut                  "NOT NULL CHECK IN (disponible,emprunte,perdu,retire)"
        TEXT            notes
        DATE            date_ajout              "NOT NULL DEFAULT CURRENT_DATE"
    }

    prets {
        SERIAL          id                      PK  "NOT NULL"
        INTEGER         exemplaire_id           FK  "NOT NULL — ON DELETE RESTRICT"
        INTEGER         adherent_id             FK  "NOT NULL — ON DELETE RESTRICT"
        INTEGER         bibliotheque_id         FK  "NOT NULL — ON DELETE RESTRICT"
        DATE            date_emprunt                "NOT NULL"
        DATE            date_retour_prevue          "NOT NULL"
        DATE            date_retour_effective
        VARCHAR_20      statut                      "NOT NULL CHECK IN (en_cours,rendu,en_retard)"
    }

    demandes_migration {
        SERIAL          id                      PK  "NOT NULL"
        INTEGER         adherent_id             FK  "NOT NULL — ON DELETE RESTRICT"
        INTEGER         bibliotheque_source_id  FK  "NOT NULL — ON DELETE RESTRICT"
        INTEGER         bibliotheque_cible_id   FK  "NOT NULL — ON DELETE RESTRICT"
        VARCHAR_20      statut                      "NOT NULL CHECK IN (en_attente,approuvee,refusee)"
        DATE            date_demande                "NOT NULL DEFAULT CURRENT_DATE"
        TEXT            commentaire
        DATE            date_traitement
    }

    bibliotheques  ||--o{  utilisateurs        : "PK → FK bibliotheque_id"
    bibliotheques  ||--|{  exemplaires         : "PK → FK bibliotheque_id"
    livres         ||--|{  exemplaires         : "PK → FK livre_id"
    exemplaires    ||--o{  prets               : "PK → FK exemplaire_id"
    utilisateurs   ||--o{  prets               : "PK → FK adherent_id"
    bibliotheques  ||--o{  prets               : "PK → FK bibliotheque_id"
    utilisateurs   ||--o{  demandes_migration  : "PK → FK adherent_id"
    bibliotheques  ||--o{  demandes_migration  : "PK → FK bibliotheque_source_id"
    bibliotheques  }o--||  demandes_migration  : "PK → FK bibliotheque_cible_id"
```
