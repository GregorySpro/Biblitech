<?php

namespace App\Repository;

use App\Entity\DemandeMigration;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class DemandeMigrationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DemandeMigration::class);
    }

    public function findByBibliotheque(int $bibliothequeId, ?string $statut = null): array
    {
        $qb = $this->createQueryBuilder('d')
            ->where('d.bibliothequeSource = :bibId OR d.bibliothequeCible = :bibId')
            ->setParameter('bibId', $bibliothequeId)
            ->orderBy('d.createdAt', 'DESC');

        if ($statut !== null) {
            $qb->andWhere('d.statut = :statut')->setParameter('statut', $statut);
        }

        return $qb->getQuery()->getResult();
    }
}
