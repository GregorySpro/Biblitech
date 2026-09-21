<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260601000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout du premier login (must_change_password) et de la protection anti-brute force (login_attempts, locked_until) sur les utilisateurs';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE utilisateurs ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT TRUE");
        $this->addSql("ALTER TABLE utilisateurs ADD COLUMN login_attempts INTEGER NOT NULL DEFAULT 0");
        $this->addSql("ALTER TABLE utilisateurs ADD COLUMN locked_until TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE utilisateurs DROP COLUMN IF EXISTS must_change_password");
        $this->addSql("ALTER TABLE utilisateurs DROP COLUMN IF EXISTS login_attempts");
        $this->addSql("ALTER TABLE utilisateurs DROP COLUMN IF EXISTS locked_until");
    }
}
