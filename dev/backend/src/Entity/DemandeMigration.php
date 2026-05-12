<?php

namespace App\Entity;

use App\Repository\DemandeMigrationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DemandeMigrationRepository::class)]
#[ORM\Table(name: 'demandes_migration')]
class DemandeMigration
{
    public const STATUT_EN_ATTENTE = 'en_attente';
    public const STATUT_VALIDEE    = 'validee';
    public const STATUT_REFUSEE    = 'refusee';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 20, options: ['default' => self::STATUT_EN_ATTENTE])]
    private string $statut = self::STATUT_EN_ATTENTE;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $motif = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $traiteeAt = null;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'demandesMigration')]
    #[ORM\JoinColumn(nullable: false)]
    private Utilisateur $utilisateur;

    #[ORM\ManyToOne(targetEntity: Bibliotheque::class)]
    #[ORM\JoinColumn(nullable: false, name: 'bibliotheque_source_id')]
    private Bibliotheque $bibliothequeSource;

    #[ORM\ManyToOne(targetEntity: Bibliotheque::class)]
    #[ORM\JoinColumn(nullable: false, name: 'bibliotheque_cible_id')]
    private Bibliotheque $bibliothequeCible;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }
    public function getMotif(): ?string { return $this->motif; }
    public function setMotif(?string $motif): static { $this->motif = $motif; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getTraiteeAt(): ?\DateTimeImmutable { return $this->traiteeAt; }
    public function setTraiteeAt(?\DateTimeImmutable $traiteeAt): static { $this->traiteeAt = $traiteeAt; return $this; }
    public function getUtilisateur(): Utilisateur { return $this->utilisateur; }
    public function setUtilisateur(Utilisateur $utilisateur): static { $this->utilisateur = $utilisateur; return $this; }
    public function getBibliothequeSource(): Bibliotheque { return $this->bibliothequeSource; }
    public function setBibliothequeSource(Bibliotheque $bibliothequeSource): static { $this->bibliothequeSource = $bibliothequeSource; return $this; }
    public function getBibliothequeCible(): Bibliotheque { return $this->bibliothequeCible; }
    public function setBibliothequeCible(Bibliotheque $bibliothequeCible): static { $this->bibliothequeCible = $bibliothequeCible; return $this; }

    public function isDejaTraitee(): bool
    {
        return $this->statut !== self::STATUT_EN_ATTENTE;
    }
}
