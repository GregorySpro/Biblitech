<?php

namespace App\Entity;

use App\Repository\BibliothequeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: BibliothequeRepository::class)]
#[ORM\Table(name: 'bibliotheques')]
class Bibliotheque
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['demande_migration:read', 'bibliotheque:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['demande_migration:read', 'bibliotheque:read'])]
    private string $nom;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['bibliotheque:read'])]
    private ?string $adresse = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['bibliotheque:read'])]
    private ?string $ville = null;

    #[ORM\Column(type: 'string', length: 10, nullable: true)]
    #[Groups(['bibliotheque:read'])]
    private ?string $codePostal = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['bibliotheque:read'])]
    private ?string $email = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    #[Groups(['bibliotheque:read'])]
    private bool $active = true;

    #[ORM\Column(type: 'integer', options: ['default' => 21])]
    #[Groups(['bibliotheque:read'])]
    private int $duretPretJours = 21;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['bibliotheque:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\OneToMany(targetEntity: Utilisateur::class, mappedBy: 'bibliotheque')]
    private Collection $utilisateurs;

    #[ORM\OneToMany(targetEntity: Livre::class, mappedBy: 'bibliotheque')]
    private Collection $livres;

    public function __construct()
    {
        $this->createdAt  = new \DateTimeImmutable();
        $this->utilisateurs = new ArrayCollection();
        $this->livres       = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getAdresse(): ?string { return $this->adresse; }
    public function setAdresse(?string $adresse): static { $this->adresse = $adresse; return $this; }
    public function getVille(): ?string { return $this->ville; }
    public function setVille(?string $ville): static { $this->ville = $ville; return $this; }
    public function getCodePostal(): ?string { return $this->codePostal; }
    public function setCodePostal(?string $codePostal): static { $this->codePostal = $codePostal; return $this; }
    public function getEmail(): ?string { return $this->email; }
    public function setEmail(?string $email): static { $this->email = $email; return $this; }
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): static { $this->active = $active; return $this; }
    public function getDuretPretJours(): int { return $this->duretPretJours; }
    public function setDuretPretJours(int $jours): static { $this->duretPretJours = $jours; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUtilisateurs(): Collection { return $this->utilisateurs; }
    public function getLivres(): Collection { return $this->livres; }
}
