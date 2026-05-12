<?php

namespace App\Controller;

use App\Entity\Pret;
use App\Exception\ExemplaireUnavailableException;
use App\Exception\PretAlreadyReturnedException;
use App\Exception\PretMaxReachedException;
use App\Repository\ExemplaireRepository;
use App\Repository\PretRepository;
use App\Repository\UtilisateurRepository;
use App\Service\PretService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/prets')]
class PretController extends AbstractController
{
    public function __construct(
        private readonly PretRepository $pretRepository,
        private readonly UtilisateurRepository $utilisateurRepository,
        private readonly ExemplaireRepository $exemplaireRepository,
        private readonly PretService $pretService,
        private readonly Security $security,
    ) {}

    #[Route('', name: 'api_prets_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->security->getUser();

        // Un adhérent ne voit que ses propres prêts
        if ($user->getRole() === 'adherent') {
            $prets = $this->pretRepository->findByAdherent($user->getId());
            return $this->json($prets, Response::HTTP_OK, [], ['groups' => ['pret:read']]);
        }

        $prets = $this->pretRepository->findByBibliothequeWithFilters(
            $user->getBibliothequeId(),
            $request->query->get('statut'),
        );

        return $this->json($prets, Response::HTTP_OK, [], ['groups' => ['pret:read']]);
    }

    #[Route('/retards', name: 'api_prets_retards', methods: ['GET'])]
    public function retards(): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $retards = $this->pretRepository->findRetardsByBibliotheque($user->getBibliothequeId());
        return $this->json($retards, Response::HTTP_OK, [], ['groups' => ['pret:read']]);
    }

    #[Route('/adherent/{id}', name: 'api_prets_adherent', methods: ['GET'])]
    public function byAdherent(int $id): JsonResponse
    {
        $user = $this->security->getUser();

        // Un adhérent ne peut voir que son propre historique
        if ($user->getRole() === 'adherent' && $user->getId() !== $id) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $prets = $this->pretRepository->findByAdherent($id);
        return $this->json($prets, Response::HTTP_OK, [], ['groups' => ['pret:read']]);
    }

    #[Route('/{id}', name: 'api_prets_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $pret = $this->pretRepository->find($id);
        if ($pret === null) {
            return $this->json(['status' => 404, 'code' => 'PRET_NOT_FOUND', 'message' => 'Prêt introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $user = $this->security->getUser();

        // Un adhérent ne peut voir que ses propres prêts
        if ($user->getRole() === 'adherent' && $pret->getUtilisateur()->getId() !== $user->getId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($pret, Response::HTTP_OK, [], ['groups' => ['pret:read']]);
    }

    #[Route('', name: 'api_prets_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Seul un bibliothécaire peut enregistrer un prêt.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['exemplaire_id']) || empty($data['utilisateur_id'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'exemplaire_id et utilisateur_id sont obligatoires.'], Response::HTTP_BAD_REQUEST);
        }

        $exemplaire  = $this->exemplaireRepository->find($data['exemplaire_id']);
        $utilisateur = $this->utilisateurRepository->find($data['utilisateur_id']);

        if ($exemplaire === null) {
            return $this->json(['status' => 404, 'code' => 'EXEMPLAIRE_NOT_FOUND', 'message' => 'Exemplaire introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if ($utilisateur === null) {
            return $this->json(['status' => 404, 'code' => 'USER_NOT_FOUND', 'message' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $dateRetour = null;
        if (!empty($data['date_retour_prevue'])) {
            $dateRetour = new \DateTimeImmutable($data['date_retour_prevue']);
        }

        try {
            $pret = $this->pretService->enregistrerPret($utilisateur, $exemplaire, $dateRetour);
            return $this->json($pret, Response::HTTP_CREATED, [], ['groups' => ['pret:read']]);
        } catch (ExemplaireUnavailableException $e) {
            return $this->json(['status' => 409, 'code' => 'EXEMPLAIRE_UNAVAILABLE', 'message' => $e->getMessage()], Response::HTTP_CONFLICT);
        } catch (PretMaxReachedException $e) {
            return $this->json(['status' => 422, 'code' => 'PRET_MAX_REACHED', 'message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    #[Route('/{id}/retour', name: 'api_prets_retour', methods: ['PATCH'])]
    public function retour(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Seul un bibliothécaire peut enregistrer un retour.'], Response::HTTP_FORBIDDEN);
        }

        $pret = $this->pretRepository->find($id);
        if ($pret === null) {
            return $this->json(['status' => 404, 'code' => 'PRET_NOT_FOUND', 'message' => 'Prêt introuvable.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $pret = $this->pretService->enregistrerRetour($pret);
            return $this->json($pret, Response::HTTP_OK, [], ['groups' => ['pret:read']]);
        } catch (PretAlreadyReturnedException $e) {
            return $this->json(['status' => 409, 'code' => 'PRET_ALREADY_RETURNED', 'message' => $e->getMessage()], Response::HTTP_CONFLICT);
        }
    }
}
