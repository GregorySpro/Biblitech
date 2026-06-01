<?php

namespace App\Controller;

use App\Entity\Pret;
use App\Exception\ExemplaireUnavailableException;
use App\Exception\PretAlreadyReturnedException;
use App\Exception\PretMaxReachedException;
use App\Repository\BibliothequeRepository;
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
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly PretService $pretService,
        private readonly Security $security,
    ) {}

    private function requireBibliothequeActive(): ?JsonResponse
    {
        $user = $this->security->getUser();
        $bibId = $user->getBibliothequeId();
        if ($bibId === null) return null; // super_admin — pas de bibliothèque propre
        $bib = $this->bibliothequeRepository->find($bibId);
        if ($bib !== null && !$bib->isActive()) {
            return $this->json([
                'status'  => 403,
                'code'    => 'BIBLIOTHEQUE_INACTIVE',
                'message' => 'Cette bibliothèque est désactivée. Les prêts et retours sont suspendus. Veuillez demander une migration.',
            ], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

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

        // Le super_admin supervise la plateforme mais ne gère pas les prêts d'une bibliothèque spécifique
        if ($user->getRole() === 'super_admin') {
            return $this->json(['status' => 403, 'code' => 'SUPER_ADMIN_RESTRICTED', 'message' => 'Le super administrateur ne peut pas créer de prêts. Cette action appartient aux bibliothécaires et administrateurs de chaque bibliothèque.'], Response::HTTP_FORBIDDEN);
        }

        if ($err = $this->requireBibliothequeActive()) return $err;

        $data = json_decode($request->getContent(), true);

        if (empty($data['exemplaire_id'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'exemplaire_id est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        // Résoudre l'utilisateur via email ou utilisateur_id
        $utilisateur = null;
        if (!empty($data['email'])) {
            $utilisateur = $this->utilisateurRepository->findByEmail($data['email']);
            if ($utilisateur === null) {
                return $this->json(['status' => 404, 'code' => 'USER_NOT_FOUND', 'message' => 'Aucun compte trouvé pour cet email.'], Response::HTTP_NOT_FOUND);
            }
        } elseif (!empty($data['utilisateur_id'])) {
            $utilisateur = $this->utilisateurRepository->find($data['utilisateur_id']);
        }

        if ($utilisateur === null) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'email ou utilisateur_id est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier la suspension de prêt
        if ($utilisateur->isPretsSuspendus()) {
            return $this->json([
                'status'  => 403,
                'code'    => 'PRETS_SUSPENDUS',
                'message' => 'Les prêts de cet adhérent sont suspendus en raison de retards non régularisés. Veuillez régulariser la situation avant de créer un nouveau prêt.',
            ], Response::HTTP_FORBIDDEN);
        }

        $exemplaire = $this->exemplaireRepository->find($data['exemplaire_id']);

        if ($exemplaire === null) {
            return $this->json(['status' => 404, 'code' => 'EXEMPLAIRE_NOT_FOUND', 'message' => 'Exemplaire introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $dateRetour = null;
        if (!empty($data['date_retour_prevue'])) {
            $dateRetour = new \DateTimeImmutable($data['date_retour_prevue']);
        } elseif ($user->getBibliothequeId() !== null) {
            // Utiliser la durée configurée de la bibliothèque
            $bib = $this->bibliothequeRepository->find($user->getBibliothequeId());
            if ($bib !== null) {
                $dateRetour = (new \DateTimeImmutable())->modify('+' . $bib->getDuretPretJours() . ' days');
            }
        }

        $etatDepart = $data['etat_depart'] ?? null;

        try {
            $pret = $this->pretService->enregistrerPret($utilisateur, $exemplaire, $dateRetour, $etatDepart);
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

        if ($err = $this->requireBibliothequeActive()) return $err;

        $pret = $this->pretRepository->find($id);
        if ($pret === null) {
            return $this->json(['status' => 404, 'code' => 'PRET_NOT_FOUND', 'message' => 'Prêt introuvable.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $etatRetour = json_decode($request->getContent(), true)['etat_retour'] ?? null;
            $pret = $this->pretService->enregistrerRetour($pret, $etatRetour);
            return $this->json($pret, Response::HTTP_OK, [], ['groups' => ['pret:read']]);
        } catch (PretAlreadyReturnedException $e) {
            return $this->json(['status' => 409, 'code' => 'PRET_ALREADY_RETURNED', 'message' => $e->getMessage()], Response::HTTP_CONFLICT);
        }
    }
}
