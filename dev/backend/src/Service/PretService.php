<?php

namespace App\Service;

use App\Entity\Exemplaire;
use App\Entity\Pret;
use App\Entity\Utilisateur;
use App\Exception\ExemplaireUnavailableException;
use App\Exception\PretAlreadyReturnedException;
use App\Exception\PretMaxReachedException;
use App\Repository\PretRepository;
use Doctrine\ORM\EntityManagerInterface;

class PretService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PretRepository $pretRepository,
    ) {}

    /**
     * Enregistre un nouveau prêt.
     *
     * @throws ExemplaireUnavailableException si l'exemplaire n'est pas disponible
     * @throws PretMaxReachedException si l'adhérent a atteint le maximum de prêts simultanés
     */
    public function enregistrerPret(
        Utilisateur $utilisateur,
        Exemplaire $exemplaire,
        ?\DateTimeImmutable $dateRetourPrevue = null,
    ): Pret {
        // 1. Vérifier la disponibilité de l'exemplaire
        if (!$exemplaire->isDisponible()) {
            throw new ExemplaireUnavailableException($exemplaire->getCodeExemplaire());
        }

        // 2. Vérifier le nombre maximum de prêts actifs
        $nbPrets = $this->pretRepository->countPretsActifs($utilisateur);
        if ($nbPrets >= Pret::MAX_PRETS_SIMULTANES) {
            throw new PretMaxReachedException(Pret::MAX_PRETS_SIMULTANES);
        }

        // 3. Créer le prêt dans une transaction
        $this->em->beginTransaction();
        try {
            $pret = new Pret();
            $pret->setUtilisateur($utilisateur);
            $pret->setExemplaire($exemplaire);

            if ($dateRetourPrevue !== null) {
                $pret->setDateRetourPrevue($dateRetourPrevue);
            }

            // Mettre à jour le statut de l'exemplaire
            $exemplaire->setStatut(Exemplaire::STATUT_EMPRUNTE);

            $this->em->persist($pret);
            $this->em->flush();
            $this->em->commit();

            return $pret;
        } catch (\Throwable $e) {
            $this->em->rollback();
            throw $e;
        }
    }

    /**
     * Enregistre le retour d'un prêt.
     *
     * @throws PretAlreadyReturnedException si le prêt est déjà rendu
     */
    public function enregistrerRetour(Pret $pret): Pret
    {
        if ($pret->getStatut() === Pret::STATUT_RENDU) {
            throw new PretAlreadyReturnedException($pret->getId());
        }

        $this->em->beginTransaction();
        try {
            $pret->setStatut(Pret::STATUT_RENDU);
            $pret->setDateRetourEffective(new \DateTimeImmutable());

            // Remettre l'exemplaire disponible
            $pret->getExemplaire()->setStatut(Exemplaire::STATUT_DISPONIBLE);

            $this->em->flush();
            $this->em->commit();

            return $pret;
        } catch (\Throwable $e) {
            $this->em->rollback();
            throw $e;
        }
    }

    /**
     * Met à jour le statut des prêts en retard d'une bibliothèque.
     * À appeler quotidiennement (commande Symfony ou tâche cron).
     */
    public function mettreAJourRetards(int $bibliothequeId): int
    {
        $retards = $this->pretRepository->findRetardsByBibliotheque($bibliothequeId);
        $count = 0;

        foreach ($retards as $pret) {
            if ($pret->getStatut() === Pret::STATUT_EN_COURS) {
                $pret->setStatut(Pret::STATUT_EN_RETARD);
                $count++;
            }
        }

        $this->em->flush();

        return $count;
    }
}
