<?php

namespace App\Entity;

use App\Repository\PretRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PretRepository::class)]
#[ORM\Table(name: 'prets')]
class Pret
{
    public const STATUT_EN_COURS  = 'en_cours';
    public const STATUT_EN_RETARD = 'en_retard';
    public const STATUT_RENDU     = 'rendu';

    public const DUREE_DEFAUT_JOURS = 21;
    public const MAX_PRETS_SIMULTANES = 5;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $datePret;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $dateRetourPrevue;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $dateRetourEffective = null;

    #[ORM\Column(type: 'string', length: 20, options: ['default' => self::STATUT_EN_COURS])]
    private string $statut = self::STATUT_EN_COURS;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'prets')]
    #[ORM\JoinColumn(nullable: false)]
    private Utilisateur $utilisateur;

    #[ORM\ManyToOne(targetEntity: Exemplaire::class, inversedBy: 'prets')]
    #[ORM\JoinColumn(nullable: false)]
    private Exemplaire $exemplaire;

    public function __construct()
    {
        $this->datePret        = new \DateTimeImmutable();
        $this->dateRetourPrevue = (new \DateTimeImmutable())->modify('+' . self::DUREE_DEFAUT_JOURS . ' days');
    }

    public function getId(): ?int { return $this->id; }
    public function getDatePret(): \DateTimeImmutable { return $this->datePret; }
    public function setDatePret(\DateTimeImmutable $datePret): static { $this->datePret = $datePret; return $this; }
    public function getDateRetourPrevue(): \DateTimeImmutable { return $this->dateRetourPrevue; }
    public function setDateRetourPrevue(\DateTimeImmutable $dateRetourPrevue): static { $this->dateRetourPrevue = $dateRetourPrevue; return $this; }
    public function getDateRetourEffective(): ?\DateTimeImmutable { return $this->dateRetourEffective; }
    public function setDateRetourEffective(?\DateTimeImmutable $dateRetourEffective): static { $this->dateRetourEffective = $dateRetourEffective; return $this; }
    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }
    public function getUtilisateur(): Utilisateur { return $this->utilisateur; }
    public function setUtilisateur(Utilisateur $utilisateur): static { $this->utilisateur = $utilisateur; return $this; }
    public function getExemplaire(): Exemplaire { return $this->exemplaire; }
    public function setExemplaire(Exemplaire $exemplaire): static { $this->exemplaire = $exemplaire; return $this; }

    public function isEnRetard(): bool
    {
        return $this->statut !== self::STATUT_RENDU
            && $this->dateRetourPrevue < new \DateTimeImmutable('today');
    }
}
