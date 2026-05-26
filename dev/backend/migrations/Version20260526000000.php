<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260526000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la table refresh_tokens pour le renouvellement JWT (rotation automatique)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE refresh_tokens (
            token          VARCHAR(64)  NOT NULL PRIMARY KEY,
            utilisateur_id INT          NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
            expires_at     TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            created_at     TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )');
        $this->addSql('CREATE INDEX idx_refresh_tokens_utilisateur ON refresh_tokens(utilisateur_id)');
        $this->addSql('CREATE INDEX idx_refresh_tokens_expires     ON refresh_tokens(expires_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS refresh_tokens');
    }
}
