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
}
