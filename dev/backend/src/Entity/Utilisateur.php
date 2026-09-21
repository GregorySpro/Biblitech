<?php

namespace App\Entity;

use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;

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
    #[Groups(['pret:read', 'utilisateur:read'])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['pret:read', 'utilisateur:read'])]
    private string $nom;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['pret:read', 'utilisateur:read'])]
    private string $prenom;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    #[Groups(['pret:read', 'utilisateur:read'])]
    private string $email;

    #[ORM\Column(type: 'string', length: 255)]
    private string $password;

    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['pret:read', 'utilisateur:read'])]
    private string $role = self::ROLE_ADHERENT;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    #[Groups(['utilisateur:read'])]
    private bool $active = true;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['utilisateur:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    #[Groups(['utilisateur:read'])]
    private bool $mustChangePassword = true;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    #[Groups(['utilisateur:read'])]
    private ?string $cguAcceptedVersion = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['utilisateur:read'])]
    private bool $pretsSuspendus = false;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $loginAttempts = 0;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $lockedUntil = null;

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
    #[Groups(['utilisateur:read', 'pret:read'])]
    public function getBibliothequeId(): ?int { return $this->bibliotheque?->getId(); }
    public function getPrets(): Collection { return $this->prets; }
    public function getDemandesMigration(): Collection { return $this->demandesMigration; }

    public function isMustChangePassword(): bool { return $this->mustChangePassword; }
    public function setMustChangePassword(bool $v): static { $this->mustChangePassword = $v; return $this; }
    public function getCguAcceptedVersion(): ?string { return $this->cguAcceptedVersion; }
    public function setCguAcceptedVersion(?string $v): static { $this->cguAcceptedVersion = $v; return $this; }
    public function isPretsSuspendus(): bool { return $this->pretsSuspendus; }
    public function setPretsSuspendus(bool $v): static { $this->pretsSuspendus = $v; return $this; }
    public function getLoginAttempts(): int { return $this->loginAttempts; }
    public function setLoginAttempts(int $v): static { $this->loginAttempts = $v; return $this; }
    public function getLockedUntil(): ?\DateTimeImmutable { return $this->lockedUntil; }
    public function setLockedUntil(?\DateTimeImmutable $v): static { $this->lockedUntil = $v; return $this; }
    public function isLocked(): bool { return $this->lockedUntil !== null && $this->lockedUntil > new \DateTimeImmutable(); }
}
