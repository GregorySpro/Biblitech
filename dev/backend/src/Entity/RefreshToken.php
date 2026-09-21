<?php

namespace App\Entity;

use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RefreshTokenRepository::class)]
#[ORM\Table(name: 'refresh_tokens')]
class RefreshToken
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 64)]
    private string $token;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Utilisateur $utilisateur;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct(Utilisateur $utilisateur, int $ttlDays = 30)
    {
        $this->token       = bin2hex(random_bytes(32));
        $this->utilisateur = $utilisateur;
        $this->createdAt   = new \DateTimeImmutable();
        $this->expiresAt   = new \DateTimeImmutable("+{$ttlDays} days");
    }

    public function getToken(): string                    { return $this->token; }
    public function getUtilisateur(): Utilisateur         { return $this->utilisateur; }
    public function getExpiresAt(): \DateTimeImmutable    { return $this->expiresAt; }
    public function isExpired(): bool                     { return $this->expiresAt <= new \DateTimeImmutable(); }
}
