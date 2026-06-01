<?php

namespace App\Repository;

use App\Entity\Exemplaire;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ExemplaireRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Exemplaire::class);
    }

    public function findByLivre(int $livreId, ?string $statut = null): array
    {
        $qb = $this->createQueryBuilder('e')
            ->where('e.livre = :livreId')
            ->setParameter('livreId', $livreId);

        if ($statut !== null) {
            $qb->andWhere('e.statut = :statut')->setParameter('statut', $statut);
        }

        return $qb->getQuery()->getResult();
    }

    public function countDisponiblesByBibliotheque(?int $bibliothequeId): int
    {
        $qb = $this->createQueryBuilder('e')
            ->select('COUNT(e.id)')
            ->join('e.livre', 'l')
            ->where('e.statut = :statut')
            ->setParameter('statut', 'disponible');

        if ($bibliothequeId !== null) {
            $qb->andWhere('l.bibliotheque = :bibId')->setParameter('bibId', $bibliothequeId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
