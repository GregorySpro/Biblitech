<?php

namespace App\Entity;

use App\Repository\PretRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PretRepository::class)]
#[ORM\Table(name: 'prets')]
class Pret
{
    public const STATUT_EN_COURS  = 'en_cours';
    public const STATUT_EN_RETARD = 'en_retard';
    public const STATUT_RENDU     = 'rendu';
    public const STATUT_PERDU     = 'perdu';

    public const DUREE_DEFAUT_JOURS = 21;
    public const MAX_PRETS_SIMULTANES = 5;
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['pret:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['pret:read'])]
    private \DateTimeImmutable $datePret;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['pret:read'])]
    private \DateTimeImmutable $dateRetourPrevue;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['pret:read'])]
    private ?\DateTimeImmutable $dateRetourEffective = null;

    #[ORM\Column(type: 'string', length: 20, options: ['default' => self::STATUT_EN_COURS])]
    #[Groups(['pret:read'])]
    private string $statut = self::STATUT_EN_COURS;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    #[Groups(['pret:read'])]
    private ?string $etatDepart = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    #[Groups(['pret:read'])]
    private ?string $etatRetour = null;

    #[ORM\ManyToOne(targetEntity: Utilisateur::class, inversedBy: 'prets')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pret:read'])]
    private Utilisateur $utilisateur;

    #[ORM\ManyToOne(targetEntity: Exemplaire::class, inversedBy: 'prets')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['pret:read'])]
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
    public function getEtatDepart(): ?string { return $this->etatDepart; }
    public function setEtatDepart(?string $etat): static { $this->etatDepart = $etat; return $this; }
    public function getEtatRetour(): ?string { return $this->etatRetour; }
    public function setEtatRetour(?string $etat): static { $this->etatRetour = $etat; return $this; }

    #[Groups(['pret:read'])]
    public function getExemplaireId(): ?int { return $this->exemplaire?->getId(); }

    #[Groups(['pret:read'])]
    public function getUtilisateurId(): ?int { return $this->utilisateur?->getId(); }

    public function isEnRetard(): bool
    {
        return $this->statut !== self::STATUT_RENDU
            && $this->statut !== self::STATUT_PERDU
            && $this->dateRetourPrevue < new \DateTimeImmutable('today');
    }
}
