<?php

namespace App\Entity;

use App\Repository\LivreRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LivreRepository::class)]
#[ORM\Table(name: 'livres')]
#[ORM\UniqueConstraint(name: 'uq_livres_isbn_bibliotheque', columns: ['isbn', 'bibliotheque_id'])]
class Livre
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 13, nullable: true)]
    private ?string $isbn = null;

    #[ORM\Column(type: 'string', length: 500)]
    private string $titre;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $auteur = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $editeur = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $anneePublication = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 1000, nullable: true)]
    private ?string $couvertureUrl = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(targetEntity: Bibliotheque::class, inversedBy: 'livres')]
    #[ORM\JoinColumn(nullable: false)]
    private Bibliotheque $bibliotheque;

    #[ORM\OneToMany(targetEntity: Exemplaire::class, mappedBy: 'livre', cascade: ['remove'])]
    private Collection $exemplaires;

    public function __construct()
    {
        $this->createdAt   = new \DateTimeImmutable();
        $this->exemplaires = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getIsbn(): ?string { return $this->isbn; }
    public function setIsbn(?string $isbn): static { $this->isbn = $isbn; return $this; }
    public function getTitre(): string { return $this->titre; }
    public function setTitre(string $titre): static { $this->titre = $titre; return $this; }
    public function getAuteur(): ?string { return $this->auteur; }
    public function setAuteur(?string $auteur): static { $this->auteur = $auteur; return $this; }
    public function getEditeur(): ?string { return $this->editeur; }
    public function setEditeur(?string $editeur): static { $this->editeur = $editeur; return $this; }
    public function getAnneePublication(): ?int { return $this->anneePublication; }
    public function setAnneePublication(?int $anneePublication): static { $this->anneePublication = $anneePublication; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }
    public function getCouvertureUrl(): ?string { return $this->couvertureUrl; }
    public function setCouvertureUrl(?string $couvertureUrl): static { $this->couvertureUrl = $couvertureUrl; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getBibliotheque(): Bibliotheque { return $this->bibliotheque; }
    public function setBibliotheque(Bibliotheque $bibliotheque): static { $this->bibliotheque = $bibliotheque; return $this; }
    public function getExemplaires(): Collection { return $this->exemplaires; }
}
