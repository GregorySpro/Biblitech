<?php

namespace App\Entity;

use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UtilisateurRepository::class)]
#[ORM\Table(name: 'utilisateurs')]
#[ORM\UniqueConstraint(name: 'uq_utilisateurs_email', columns: ['email'])]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const ROLE_SUPER_ADMIN   = 'super_admin';
    public const ROLE_ADMIN         = 'admin';
    public const ROLE_BIBLIOTHECAIRE = 'bibliothecaire';
    public const ROLE_ADHERENT      = 'adherent';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $nom;

    #[ORM\Column(type: 'string', length: 255)]
    private string $prenom;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255)]
    private string $password;

    #[ORM\Column(type: 'string', length: 20)]
    private string $role = self::ROLE_ADHERENT;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $active = true;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(targetEntity: Bibliotheque::class, inversedBy: 'utilisateurs')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Bibliotheque $bibliotheque = null;

    #[ORM\OneToMany(targetEntity: Pret::class, mappedBy: 'utilisateur')]
    private Collection $prets;

    #[ORM\OneToMany(targetEntity: DemandeMigration::class, mappedBy: 'utilisateur')]
    private Collection $demandesMigration;

    public function __construct()
    {
        $this->createdAt        = new \DateTimeImmutable();
        $this->prets            = new ArrayCollection();
        $this->demandesMigration = new ArrayCollection();
    }

    // UserInterface
    public function getUserIdentifier(): string { return $this->email; }
    public function getRoles(): array { return ['ROLE_USER']; }
    public function eraseCredentials(): void {}

    // PasswordAuthenticatedUserInterface
    public function getPassword(): string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }

    public function getId(): ?int { return $this->id; }
    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }
    public function getPrenom(): string { return $this->prenom; }
    public function setPrenom(string $prenom): static { $this->prenom = $prenom; return $this; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }
    public function getRole(): string { return $this->role; }
    public function setRole(string $role): static { $this->role = $role; return $this; }
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): static { $this->active = $active; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getBibliotheque(): ?Bibliotheque { return $this->bibliotheque; }
    public function setBibliotheque(?Bibliotheque $bibliotheque): static { $this->bibliotheque = $bibliotheque; return $this; }
    public function getBibliothequeId(): ?int { return $this->bibliotheque?->getId(); }
    public function getPrets(): Collection { return $this->prets; }
    public function getDemandesMigration(): Collection { return $this->demandesMigration; }
}
