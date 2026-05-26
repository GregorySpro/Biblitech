<?php

namespace App\Repository;

use App\Entity\Pret;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PretRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pret::class);
    }

    /**
     * Compte les prêts actifs (en_cours ou en_retard) d'un adhérent.
     */
    public function countPretsActifs(Utilisateur $utilisateur): int
    {
        return (int) $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->where('p.utilisateur = :user')
            ->andWhere('p.statut IN (:statuts)')
            ->setParameter('user', $utilisateur)
            ->setParameter('statuts', [Pret::STATUT_EN_COURS, Pret::STATUT_EN_RETARD])
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Récupère tous les prêts en retard d'une bibliothèque.
     */
    public function findRetardsByBibliotheque(?int $bibliothequeId): array
    {
        $qb = $this->createQueryBuilder('p')
            ->join('p.exemplaire', 'e')
            ->join('e.livre', 'l')
            ->where('p.dateRetourPrevue < :today')
            ->andWhere('p.statut != :rendu')
            ->setParameter('today', new \DateTimeImmutable('today'))
            ->setParameter('rendu', Pret::STATUT_RENDU)
            ->orderBy('p.dateRetourPrevue', 'ASC');

        if ($bibliothequeId !== null) {
            $qb->andWhere('l.bibliotheque = :bibId')->setParameter('bibId', $bibliothequeId);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Récupère les prêts d'un adhérent donné.
     */
    public function findByAdherent(int $utilisateurId): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.utilisateur = :userId')
            ->setParameter('userId', $utilisateurId)
            ->orderBy('p.datePret', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Récupère les prêts d'une bibliothèque avec filtres optionnels.
     */
    public function findByBibliothequeWithFilters(?int $bibliothequeId, ?string $statut = null): array
    {
        $qb = $this->createQueryBuilder('p')
            ->join('p.exemplaire', 'e')
            ->join('e.livre', 'l')
            ->orderBy('p.datePret', 'DESC');

        if ($bibliothequeId !== null) {
            $qb->where('l.bibliotheque = :bibId')->setParameter('bibId', $bibliothequeId);
        }

        if ($statut !== null) {
            $qb->andWhere('p.statut = :statut')->setParameter('statut', $statut);
        }

        return $qb->getQuery()->getResult();
    }
}
