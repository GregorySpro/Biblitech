# BiblioTech – Schéma Entité-Association (MCD)

> **Rôles utilisateurs** : `super_admin` (global, sans bibliothèque) · `admin` (gestion complète d'une bibliothèque) · `bibliothecaire` (livres et prêts) · `adherent` (self-service + migration)
>
> ⚠️ `super_admin` : `bibliotheque_id` est NULL — il n'appartient à aucune bibliothèque, d'où la cardinalité **(0,1)** côté utilisateur.

```mermaid
erDiagram

    BIBLIOTHEQUES {
        serial      id              PK
        varchar150  nom
        text        adresse
        varchar150  email_contact
        varchar20   telephone
        boolean     actif
    }

    UTILISATEURS {
        serial      id              PK
        varchar100  nom
        varchar100  prenom
        varchar150  email
        varchar255  mot_de_passe
        varchar30   role             "super_admin|admin|bibliothecaire|adherent"
        integer     bibliotheque_id  FK "NULL si super_admin"
        boolean     actif
    }

    LIVRES {
        serial      id              PK
        varchar20   isbn
        varchar255  titre
        varchar255  auteur
        varchar150  editeur
        smallint    annee_publication
        varchar100  genre
        text        resume
        text        couverture_url  "via Google Books API"
        date        date_ajout
    }

    EXEMPLAIRES {
        serial      id              PK
        integer     livre_id        FK
        integer     bibliotheque_id FK
        varchar20   statut          "disponible|emprunte|perdu|retire"
        text        notes
        date        date_ajout
    }

    PRETS {
        serial      id                      PK
        integer     exemplaire_id           FK
        integer     adherent_id             FK
        integer     bibliotheque_id         FK
        date        date_emprunt
        date        date_retour_prevue
        date        date_retour_effective
        varchar20   statut                  "en_cours|rendu|en_retard"
    }

    DEMANDES_MIGRATION {
        serial      id                      PK
        integer     adherent_id             FK
        integer     bibliotheque_source_id  FK
        integer     bibliotheque_cible_id   FK
        varchar20   statut                  "en_attente|approuvee|refusee"
        date        date_demande
        text        commentaire
        date        date_traitement
    }

    BIBLIOTHEQUES  ||--o{  UTILISATEURS        : "1,1 -- 0,n  (0,1 si super_admin)"
    BIBLIOTHEQUES  ||--|{  EXEMPLAIRES         : "1,1 -- 1,n"
    LIVRES         ||--|{  EXEMPLAIRES         : "1,1 -- 1,n"
    EXEMPLAIRES    ||--o{  PRETS               : "1,1 -- 0,n"
    UTILISATEURS   ||--o{  PRETS               : "1,1 -- 0,n"
    BIBLIOTHEQUES  ||--o{  PRETS               : "1,1 -- 0,n"
    UTILISATEURS   ||--o{  DEMANDES_MIGRATION  : "1,1 -- 0,n"
    BIBLIOTHEQUES  ||--o{  DEMANDES_MIGRATION  : "1,1 -- 0,n  [source]"
    BIBLIOTHEQUES  }o--||  DEMANDES_MIGRATION  : "0,n -- 1,1  [cible]"
```
