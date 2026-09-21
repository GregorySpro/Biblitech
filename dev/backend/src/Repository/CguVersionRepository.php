<?php

namespace App\Repository;

use App\Entity\CguVersion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class CguVersionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CguVersion::class);
    }

    public function findCurrentVersion(): ?CguVersion
    {
        return $this->createQueryBuilder('c')
            ->where('c.dateEffet <= :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('c.dateEffet', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findPendingVersion(): ?CguVersion
    {
        return $this->createQueryBuilder('c')
            ->where('c.dateEffet > :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('c.dateEffet', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /** @return CguVersion[] */
    public function findAllOrderedByDate(): array
    {
        return $this->createQueryBuilder('c')
            ->orderBy('c.dateEffet', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
