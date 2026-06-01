<?php

namespace App\Repository;

use App\Entity\Livre;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class LivreRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Livre::class);
    }

    public function findByBibliothequeWithFilters(?int $bibliothequeId, ?string $titre = null, ?string $auteur = null, ?string $isbn = null): array
    {
        $qb = $this->createQueryBuilder('l')
            ->orderBy('l.titre', 'ASC');

        if ($bibliothequeId !== null) {
            $qb->where('l.bibliotheque = :bibId')->setParameter('bibId', $bibliothequeId);
        }

        if ($titre !== null) {
            $qb->andWhere('l.titre LIKE :titre')->setParameter('titre', '%' . $titre . '%');
        }
        if ($auteur !== null) {
            $qb->andWhere('l.auteur LIKE :auteur')->setParameter('auteur', '%' . $auteur . '%');
        }
        if ($isbn !== null) {
            $qb->andWhere('l.isbn LIKE :isbn')->setParameter('isbn', '%' . $isbn . '%');
        }

        return $qb->getQuery()->getResult();
    }

    public function findByIsbnAndBibliotheque(string $isbn, ?int $bibliothequeId): ?Livre
    {
        $qb = $this->createQueryBuilder('l')
            ->where('l.isbn = :isbn')
            ->setParameter('isbn', $isbn);

        if ($bibliothequeId !== null) {
            $qb->andWhere('l.bibliotheque = :bibId')->setParameter('bibId', $bibliothequeId);
        }

        return $qb->getQuery()->getOneOrNullResult();
    }
}
