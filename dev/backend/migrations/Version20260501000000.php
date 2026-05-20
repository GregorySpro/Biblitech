<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260501000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création initiale du schéma BiblioTech — 6 tables (bibliotheques, utilisateurs, livres, exemplaires, prets, demandes_migration)';
    }

    public function up(Schema $schema): void
    {
        // --- bibliotheques ---
        $this->addSql('CREATE TABLE bibliotheques (
            id           SERIAL PRIMARY KEY,
            nom          VARCHAR(255) NOT NULL,
            adresse      VARCHAR(500),
            ville        VARCHAR(100),
            code_postal  VARCHAR(10),
            email        VARCHAR(255),
            active       BOOLEAN NOT NULL DEFAULT TRUE,
            created_at   TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )');

        // --- utilisateurs ---
        $this->addSql('CREATE TABLE utilisateurs (
            id              SERIAL PRIMARY KEY,
            bibliotheque_id INT REFERENCES bibliotheques(id) ON DELETE SET NULL,
            nom             VARCHAR(100) NOT NULL,
            prenom          VARCHAR(100) NOT NULL,
            email           VARCHAR(255) NOT NULL UNIQUE,
            password        VARCHAR(255) NOT NULL,
            role            VARCHAR(30) NOT NULL DEFAULT \'adherent\',
            active          BOOLEAN NOT NULL DEFAULT TRUE,
            created_at      TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )');
        $this->addSql('CREATE INDEX idx_utilisateurs_bibliotheque ON utilisateurs(bibliotheque_id)');
        $this->addSql('CREATE INDEX idx_utilisateurs_role ON utilisateurs(role)');

        // --- livres ---
        $this->addSql('CREATE TABLE livres (
            id                 SERIAL PRIMARY KEY,
            bibliotheque_id    INT NOT NULL REFERENCES bibliotheques(id) ON DELETE CASCADE,
            isbn               VARCHAR(20),
            titre              VARCHAR(500) NOT NULL,
            auteur             VARCHAR(255),
            editeur            VARCHAR(255),
            annee_publication  INT,
            description        TEXT,
            couverture_url     VARCHAR(1000),
            created_at         TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )');
        $this->addSql('CREATE UNIQUE INDEX idx_livres_isbn_biblio ON livres(isbn, bibliotheque_id) WHERE isbn IS NOT NULL');
        $this->addSql('CREATE INDEX idx_livres_bibliotheque ON livres(bibliotheque_id)');
        $this->addSql('CREATE INDEX idx_livres_titre ON livres(titre)');

        // --- exemplaires ---
        $this->addSql('CREATE TABLE exemplaires (
            id              SERIAL PRIMARY KEY,
            livre_id        INT NOT NULL REFERENCES livres(id) ON DELETE CASCADE,
            code_exemplaire VARCHAR(50) NOT NULL UNIQUE,
            statut          VARCHAR(20) NOT NULL DEFAULT \'disponible\',
            etat            VARCHAR(100),
            created_at      TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT chk_exemplaire_statut CHECK (statut IN (\'disponible\', \'emprunte\', \'hors_service\'))
        )');
        $this->addSql('CREATE INDEX idx_exemplaires_livre ON exemplaires(livre_id)');
        $this->addSql('CREATE INDEX idx_exemplaires_statut ON exemplaires(statut)');

        // --- prets ---
        $this->addSql('CREATE TABLE prets (
            id                    SERIAL PRIMARY KEY,
            utilisateur_id        INT NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
            exemplaire_id         INT NOT NULL REFERENCES exemplaires(id) ON DELETE RESTRICT,
            date_pret             TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            date_retour_prevue    TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            date_retour_effective TIMESTAMP(0) WITHOUT TIME ZONE,
            statut                VARCHAR(20) NOT NULL DEFAULT \'en_cours\',
            CONSTRAINT chk_pret_statut CHECK (statut IN (\'en_cours\', \'en_retard\', \'rendu\'))
        )');
        $this->addSql('CREATE INDEX idx_prets_utilisateur ON prets(utilisateur_id)');
        $this->addSql('CREATE INDEX idx_prets_exemplaire ON prets(exemplaire_id)');
        $this->addSql('CREATE INDEX idx_prets_statut ON prets(statut)');

        // --- demandes_migration ---
        $this->addSql('CREATE TABLE demandes_migration (
            id               SERIAL PRIMARY KEY,
            utilisateur_id   INT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
            bibliotheque_src INT NOT NULL REFERENCES bibliotheques(id) ON DELETE CASCADE,
            bibliotheque_dst INT NOT NULL REFERENCES bibliotheques(id) ON DELETE CASCADE,
            statut           VARCHAR(20) NOT NULL DEFAULT \'en_attente\',
            motif            TEXT,
            created_at       TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            traitee_at       TIMESTAMP(0) WITHOUT TIME ZONE,
            CONSTRAINT chk_migration_statut CHECK (statut IN (\'en_attente\', \'validee\', \'refusee\'))
        )');
        $this->addSql('CREATE INDEX idx_migration_utilisateur ON demandes_migration(utilisateur_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS demandes_migration');
        $this->addSql('DROP TABLE IF EXISTS prets');
        $this->addSql('DROP TABLE IF EXISTS exemplaires');
        $this->addSql('DROP TABLE IF EXISTS livres');
        $this->addSql('DROP TABLE IF EXISTS utilisateurs');
        $this->addSql('DROP TABLE IF EXISTS bibliotheques');
    }
}
