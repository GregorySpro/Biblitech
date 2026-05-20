<?php

namespace App\Controller;

use App\Entity\DemandeMigration;
use App\Entity\Bibliotheque;
use App\Repository\DemandeMigrationRepository;
use App\Repository\BibliothequeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/demandes-migration')]
class DemandeMigrationController extends AbstractController
{
    public function __construct(
        private readonly DemandeMigrationRepository $demandeMigrationRepository,
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {}

    #[Route('', name: 'api_demandes_migration_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->security->getUser();

        // Super admin sees all, others see only their own or pending for their library
        if ($user->getRole() === 'super_admin') {
            $demandes = $this->demandeMigrationRepository->findAll();
        } else if ($user->getRole() === 'admin') {
            $demandes = $this->demandeMigrationRepository->findBy(['bibliothequeSource' => $user->getBibliothequeId()]);
        } else {
            $demandes = $this->demandeMigrationRepository->findBy(['utilisateur' => $user->getId()]);
        }

        return $this->json($demandes, Response::HTTP_OK, [], ['groups' => ['demande_migration:read']]);
    }

    #[Route('/{id}', name: 'api_demandes_migration_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        $demande = $this->demandeMigrationRepository->find($id);

        if ($demande === null) {
            return $this->json(['status' => 404, 'code' => 'DEMANDE_NOT_FOUND', 'message' => 'Demande introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Access control: own demande or admin/super_admin
        $canView = $user->getId() === $demande->getUtilisateur()->getId() ||
                   in_array($user->getRole(), ['admin', 'super_admin'], true);
        if (!$canView) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($demande, Response::HTTP_OK, [], ['groups' => ['demande_migration:read']]);
    }

    #[Route('', name: 'api_demandes_migration_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        $data = json_decode($request->getContent(), true);

        if (empty($data['bibliotheque_cible_id'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'Bibliothèque cible requise.'], Response::HTTP_BAD_REQUEST);
        }

        $bibliothequeSource = $this->em->find(Bibliotheque::class, $user->getBibliothequeId());
        $bibliothequeCible = $this->em->find(Bibliotheque::class, $data['bibliotheque_cible_id']);

        if (!$bibliothequeCible) {
            return $this->json(['status' => 404, 'code' => 'BIBLIOTHEQUE_NOT_FOUND', 'message' => 'Bibliothèque cible introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if (!$bibliothequeSource) {
            return $this->json(['status' => 400, 'code' => 'NO_SOURCE_BIBLIOTHEQUE', 'message' => 'Vous n\'êtes rattaché à aucune bibliothèque.'], Response::HTTP_BAD_REQUEST);
        }

        if ($bibliothequeCible->getId() === $bibliothequeSource->getId()) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'Vous êtes déjà dans cette bibliothèque.'], Response::HTTP_BAD_REQUEST);
        }

        // Check for pending demande
        $existing = $this->demandeMigrationRepository->findOneBy([
            'utilisateur' => $user,
            'statut' => DemandeMigration::STATUT_EN_ATTENTE,
        ]);
        if ($existing) {
            return $this->json(['status' => 409, 'code' => 'DEMANDE_PENDING', 'message' => 'Une demande de migration est déjà en cours.'], Response::HTTP_CONFLICT);
        }

        $demande = new DemandeMigration();
        $demande->setUtilisateur($user);
        $demande->setBibliothequeSource($bibliothequeSource);
        $demande->setBibliothequeCible($bibliothequeCible);
        $demande->setMotif($data['motif'] ?? null);

        $this->em->persist($demande);
        $this->em->flush();

        return $this->json($demande, Response::HTTP_CREATED, [], ['groups' => ['demande_migration:read']]);
    }

    #[Route('/{id}/approuver', name: 'api_demandes_migration_approve', methods: ['PATCH'])]
    public function approve(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        if ($user->getRole() !== 'super_admin') {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Seul un super administrateur peut approuver.'], Response::HTTP_FORBIDDEN);
        }

        $demande = $this->demandeMigrationRepository->find($id);
        if (!$demande) {
            return $this->json(['status' => 404, 'code' => 'DEMANDE_NOT_FOUND', 'message' => 'Demande introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($demande->isDejaTraitee()) {
            return $this->json(['status' => 409, 'code' => 'DEMANDE_ALREADY_TREATED', 'message' => 'Cette demande a déjà été traitée.'], Response::HTTP_CONFLICT);
        }

        $demande->setStatut(DemandeMigration::STATUT_VALIDEE);
        $demande->setTraiteeAt(new \DateTimeImmutable());
        $demande->getUtilisateur()->setBibliotheque($demande->getBibliothequeCible());

        $this->em->flush();

        return $this->json($demande, Response::HTTP_OK, [], ['groups' => ['demande_migration:read']]);
    }

    #[Route('/{id}/refuser', name: 'api_demandes_migration_reject', methods: ['PATCH'])]
    public function reject(int $id, Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if ($user->getRole() !== 'super_admin') {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Seul un super administrateur peut refuser.'], Response::HTTP_FORBIDDEN);
        }

        $demande = $this->demandeMigrationRepository->find($id);
        if (!$demande) {
            return $this->json(['status' => 404, 'code' => 'DEMANDE_NOT_FOUND', 'message' => 'Demande introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($demande->isDejaTraitee()) {
            return $this->json(['status' => 409, 'code' => 'DEMANDE_ALREADY_TREATED', 'message' => 'Cette demande a déjà été traitée.'], Response::HTTP_CONFLICT);
        }

        $data = json_decode($request->getContent(), true);
        $demande->setStatut(DemandeMigration::STATUT_REFUSEE);
        $demande->setMotif($data['motif'] ?? 'Refusée par administrateur');
        $demande->setTraiteeAt(new \DateTimeImmutable());

        $this->em->flush();

        return $this->json($demande, Response::HTTP_OK, [], ['groups' => ['demande_migration:read']]);
    }

    #[Route('/{id}', name: 'api_demandes_migration_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        $demande = $this->demandeMigrationRepository->find($id);

        if (!$demande) {
            return $this->json(['status' => 404, 'code' => 'DEMANDE_NOT_FOUND', 'message' => 'Demande introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Only owner or super_admin can delete
        $canDelete = $user->getId() === $demande->getUtilisateur()->getId() || $user->getRole() === 'super_admin';
        if (!$canDelete) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        // Can only delete pending demandes
        if ($demande->isDejaTraitee()) {
            return $this->json(['status' => 409, 'code' => 'DEMANDE_ALREADY_TREATED', 'message' => 'Impossible de supprimer une demande traitée.'], Response::HTTP_CONFLICT);
        }

        $this->em->remove($demande);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
