<?php

namespace App\Controller;

use App\Repository\LivreRepository;
use App\Repository\PretRepository;
use App\Repository\ExemplaireRepository;
use App\Repository\UtilisateurRepository;
use App\Repository\BibliothequeRepository;
use App\Entity\Pret;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/stats')]
class StatController extends AbstractController
{
    public function __construct(
        private readonly LivreRepository $livreRepository,
        private readonly PretRepository $pretRepository,
        private readonly ExemplaireRepository $exemplaireRepository,
        private readonly UtilisateurRepository $utilisateurRepository,
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly Security $security,
    ) {}

    #[Route('/bibliotheque', name: 'api_stats_bibliotheque', methods: ['GET'])]
    public function bibliotheque(): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin', 'bibliothecaire'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $bibId = $user->getBibliothequeId();

        if ($bibId === null) {
            // super_admin : stats globales agrégées
            $allPrets = $this->pretRepository->findAll();
            $enCours  = count(array_filter($allPrets, fn($p) => $p->getStatut() === Pret::STATUT_EN_COURS));
            $enRetard = count(array_filter($allPrets, fn($p) => $p->getStatut() === Pret::STATUT_EN_RETARD));
            $allUsers = $this->utilisateurRepository->findAll();
            $nbAdherents = count(array_filter($allUsers, fn($u) => $u->getRole() === 'adherent'));
            $allExemplaires = $this->exemplaireRepository->findAll();
            $allLivres = $this->livreRepository->findAll();

            return $this->json([
                'pretsenCours'     => $enCours,
                'pretsEnRetard'    => $enRetard,
                'totalExemplaires' => count($allExemplaires),
                'adherentsActifs'  => $nbAdherents,
                'totalLivres'      => count($allLivres),
            ]);
        }

        $livres = count($this->livreRepository->findByBibliothequeWithFilters($bibId));
        $prets  = $this->pretRepository->findByBibliothequeWithFilters($bibId);

        $enCours  = count(array_filter($prets, fn($p) => $p->getStatut() === Pret::STATUT_EN_COURS));
        $enRetard = count(array_filter($prets, fn($p) => $p->getStatut() === Pret::STATUT_EN_RETARD));

        return $this->json([
            'pretsenCours'     => $enCours,
            'pretsEnRetard'    => $enRetard,
            'totalExemplaires' => $this->exemplaireRepository->countDisponiblesByBibliotheque($bibId),
            'adherentsActifs'  => count($this->utilisateurRepository->findActiveByBibliotheque($bibId, 'adherent')),
            'totalLivres'      => $livres,
        ]);
    }

    #[Route('/globales', name: 'api_stats_globales', methods: ['GET'])]
    public function globales(): JsonResponse
    {
        $user = $this->security->getUser();
        if ($user->getRole() !== 'super_admin') {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Réservé au super administrateur.'], Response::HTTP_FORBIDDEN);
        }

        $bibliotheques = $this->bibliothequeRepository->findAll();
        $utilisateurs  = $this->utilisateurRepository->findAll();

        return $this->json([
            'nbBibliotheques' => count($bibliotheques),
            'nbUtilisateurs'  => count($utilisateurs),
            'nbActives'       => count(array_filter($bibliotheques, fn($b) => $b->isActive())),
        ]);
    }
}
