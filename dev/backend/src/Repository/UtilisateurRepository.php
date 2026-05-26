<?php

namespace App\Repository;

use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

class UtilisateurRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Utilisateur::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof Utilisateur) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function findByEmail(string $email): ?Utilisateur
    {
        return $this->findOneBy(['email' => $email]);
    }

    /**
     * Récupère les utilisateurs d'une bibliothèque donnée, avec filtre optionnel sur le rôle.
     */
    public function findByBibliotheque(?int $bibliothequeId, ?string $role = null): array
    {
        $qb = $this->createQueryBuilder('u')
            ->orderBy('u.nom', 'ASC');

        if ($bibliothequeId !== null) {
            $qb->where('u.bibliotheque = :bibId')->setParameter('bibId', $bibliothequeId);
        }

        if ($role !== null) {
            $qb->andWhere('u.role = :role')->setParameter('role', $role);
        }

        return $qb->getQuery()->getResult();
    }
}
