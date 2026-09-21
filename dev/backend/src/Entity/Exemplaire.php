<?php

namespace App\Entity;

use App\Repository\ExemplaireRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ExemplaireRepository::class)]
#[ORM\Table(name: 'exemplaires')]
class Exemplaire
{
    public const STATUT_DISPONIBLE   = 'disponible';
    public const STATUT_EMPRUNTE     = 'emprunte';
    public const STATUT_INDISPONIBLE = 'indisponible';
    public const STATUT_HORS_SERVICE = 'hors_service';
    public const STATUT_PERDU        = 'perdu';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['pret:read', 'exemplaire:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 50, unique: true)]
    #[Groups(['pret:read', 'exemplaire:read'])]
    private string $codeExemplaire;

    #[ORM\Column(type: 'string', length: 20, options: ['default' => self::STATUT_DISPONIBLE])]
    #[Groups(['pret:read', 'exemplaire:read'])]
    private string $statut = self::STATUT_DISPONIBLE;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['pret:read', 'exemplaire:read'])]
    private ?string $etat = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(targetEntity: Livre::class, inversedBy: 'exemplaires')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pret:read', 'exemplaire:read'])]
    private Livre $livre;

    #[ORM\OneToMany(targetEntity: Pret::class, mappedBy: 'exemplaire')]
    private Collection $prets;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->prets     = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getCodeExemplaire(): string { return $this->codeExemplaire; }
    public function setCodeExemplaire(string $codeExemplaire): static { $this->codeExemplaire = $codeExemplaire; return $this; }
    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }
    public function getEtat(): ?string { return $this->etat; }
    public function setEtat(?string $etat): static { $this->etat = $etat; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getLivre(): Livre { return $this->livre; }
    public function setLivre(Livre $livre): static { $this->livre = $livre; return $this; }
    public function getPrets(): Collection { return $this->prets; }

    public function isDisponible(): bool
    {
        return $this->statut === self::STATUT_DISPONIBLE;
    }
}
