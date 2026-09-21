<?php

namespace App\Entity;

use App\Repository\CguVersionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CguVersionRepository::class)]
#[ORM\Table(name: 'cgu_versions')]
class CguVersion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['cgu:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 20, unique: true)]
    #[Groups(['cgu:read'])]
    private string $version;

    #[ORM\Column(type: 'text')]
    #[Groups(['cgu:read'])]
    private string $contenu;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['cgu:read'])]
    private \DateTimeImmutable $dateEffet;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['cgu:read'])]
    private \DateTimeImmutable $datePublication;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['cgu:read'])]
    private string $publiePar;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt       = new \DateTimeImmutable();
        $this->datePublication = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getVersion(): string { return $this->version; }
    public function setVersion(string $version): static { $this->version = $version; return $this; }

    public function getContenu(): string { return $this->contenu; }
    public function setContenu(string $contenu): static { $this->contenu = $contenu; return $this; }

    public function getDateEffet(): \DateTimeImmutable { return $this->dateEffet; }
    public function setDateEffet(\DateTimeImmutable $dateEffet): static { $this->dateEffet = $dateEffet; return $this; }

    public function getDatePublication(): \DateTimeImmutable { return $this->datePublication; }
    public function setDatePublication(\DateTimeImmutable $datePublication): static { $this->datePublication = $datePublication; return $this; }

    public function getPubliePar(): string { return $this->publiePar; }
    public function setPubliePar(string $publiePar): static { $this->publiePar = $publiePar; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function isActive(): bool
    {
        return $this->dateEffet <= new \DateTimeImmutable();
    }
}
