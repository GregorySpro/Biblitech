<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260602000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout du suivi d\'acceptation des CGU et de la suspension de prêts sur les utilisateurs ; durée de prêt configurable par bibliothèque';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE utilisateurs ADD COLUMN cgu_accepted_version VARCHAR(20) DEFAULT NULL");
        $this->addSql("ALTER TABLE utilisateurs ADD COLUMN prets_suspendus BOOLEAN NOT NULL DEFAULT FALSE");

        $this->addSql("ALTER TABLE bibliotheques ADD COLUMN duret_pret_jours INTEGER NOT NULL DEFAULT 21");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE utilisateurs DROP COLUMN IF EXISTS cgu_accepted_version");
        $this->addSql("ALTER TABLE utilisateurs DROP COLUMN IF EXISTS prets_suspendus");

        $this->addSql("ALTER TABLE bibliotheques DROP COLUMN IF EXISTS duret_pret_jours");
    }
}
