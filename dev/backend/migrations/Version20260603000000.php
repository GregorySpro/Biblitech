<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260603000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la table cgu_versions, du statut "perdu" sur les exemplaires et prêts, et des champs etat_depart/etat_retour sur les prêts';
    }

    public function up(Schema $schema): void
    {
        // Table des versions de CGU
        $this->addSql("CREATE TABLE cgu_versions (
            id               SERIAL PRIMARY KEY,
            version          VARCHAR(20) NOT NULL UNIQUE,
            contenu          TEXT NOT NULL,
            date_effet       TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            date_publication TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            publie_par       VARCHAR(255) NOT NULL,
            created_at       TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )");
        $this->addSql("CREATE INDEX idx_cgu_versions_date_effet ON cgu_versions(date_effet)");

        // Ajout du statut 'perdu' sur les exemplaires (recréation de la contrainte)
        $this->addSql("ALTER TABLE exemplaires DROP CONSTRAINT IF EXISTS chk_exemplaire_statut");
        $this->addSql("ALTER TABLE exemplaires ADD CONSTRAINT chk_exemplaire_statut CHECK (statut IN ('disponible', 'emprunte', 'hors_service', 'perdu'))");

        // Ajout du statut 'perdu' sur les prêts + colonnes état départ/retour
        $this->addSql("ALTER TABLE prets DROP CONSTRAINT IF EXISTS chk_pret_statut");
        $this->addSql("ALTER TABLE prets ADD CONSTRAINT chk_pret_statut CHECK (statut IN ('en_cours', 'en_retard', 'rendu', 'perdu'))");
        $this->addSql("ALTER TABLE prets ADD COLUMN etat_depart VARCHAR(50) DEFAULT NULL");
        $this->addSql("ALTER TABLE prets ADD COLUMN etat_retour VARCHAR(50) DEFAULT NULL");

        // CGU par défaut (v1.0)
        $this->addSql("INSERT INTO cgu_versions (version, contenu, date_effet, publie_par) VALUES (
            '1.0',
            'Conditions Générales d''Utilisation de BiblioTech\n\n1. Objet\nLe présent document définit les conditions d''utilisation de la plateforme BiblioTech, logiciel de gestion de bibliothèques municipales et associatives.\n\n2. Accès\nL''accès à la plateforme est réservé aux utilisateurs enregistrés par leur bibliothèque. Les identifiants sont personnels et confidentiels.\n\n3. Protection des données\nVos données personnelles sont traitées conformément au RGPD. Vous disposez d''un droit d''accès, de rectification et de suppression de vos données.\n\n4. Utilisation\nToute utilisation frauduleuse ou détournement de la plateforme est interdit. Le non-respect de ces conditions entraîne la suspension du compte.\n\n5. Contact\nPour toute question, contactez l''administrateur de votre bibliothèque.',
            NOW(),
            'système'
        )");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP TABLE IF EXISTS cgu_versions");

        $this->addSql("ALTER TABLE exemplaires DROP CONSTRAINT IF EXISTS chk_exemplaire_statut");
        $this->addSql("ALTER TABLE exemplaires ADD CONSTRAINT chk_exemplaire_statut CHECK (statut IN ('disponible', 'emprunte', 'hors_service'))");

        $this->addSql("ALTER TABLE prets DROP CONSTRAINT IF EXISTS chk_pret_statut");
        $this->addSql("ALTER TABLE prets ADD CONSTRAINT chk_pret_statut CHECK (statut IN ('en_cours', 'en_retard', 'rendu'))");
        $this->addSql("ALTER TABLE prets DROP COLUMN IF EXISTS etat_depart");
        $this->addSql("ALTER TABLE prets DROP COLUMN IF EXISTS etat_retour");
    }
}
