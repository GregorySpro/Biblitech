<?php

namespace App\Controller;

use App\Entity\Exemplaire;
use App\Entity\Livre;
use App\Repository\ExemplaireRepository;
use App\Repository\LivreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/exemplaires')]
class ExemplaireController extends AbstractController
{
    public function __construct(
        private readonly ExemplaireRepository $exemplaireRepository,
        private readonly LivreRepository $livreRepository,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {}

    #[Route('', name: 'api_exemplaires_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        $bibliothequeId = $user->getBibliothequeId();

        $livreId = $request->query->get('livreId');
        if (!$livreId) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'livreId est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $livre = $this->livreRepository->find($livreId);
        if ($livre === null) {
            return $this->json(['status' => 404, 'code' => 'LIVRE_NOT_FOUND', 'message' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Isolation multi-tenant
        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $bibliothequeId) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $exemplaires = $this->exemplaireRepository->findBy(['livre' => $livre]);

        return $this->json($exemplaires, Response::HTTP_OK, [], ['groups' => ['exemplaire:read']]);
    }

    #[Route('/{id}', name: 'api_exemplaires_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        $exemplaire = $this->exemplaireRepository->find($id);
        if ($exemplaire === null) {
            return $this->json(['status' => 404, 'code' => 'EXEMPLAIRE_NOT_FOUND', 'message' => 'Exemplaire introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Isolation multi-tenant via le livre
        $livre = $exemplaire->getLivre();
        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($exemplaire, Response::HTTP_OK, [], ['groups' => ['exemplaire:read']]);
    }

    #[Route('', name: 'api_exemplaires_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['codeExemplaire'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'Le code exemplaire est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        if (empty($data['livreId'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'livreId est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        $livre = $this->livreRepository->find($data['livreId']);
        if ($livre === null) {
            return $this->json(['status' => 404, 'code' => 'LIVRE_NOT_FOUND', 'message' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Isolation multi-tenant
        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        // Vérifier la duplication du code exemplaire
        $existing = $this->exemplaireRepository->findOneBy(['codeExemplaire' => $data['codeExemplaire']]);
        if ($existing !== null) {
            return $this->json(['status' => 409, 'code' => 'CODE_DUPLICATE', 'message' => 'Un exemplaire avec ce code existe déjà.'], Response::HTTP_CONFLICT);
        }

        $exemplaire = new Exemplaire();
        $exemplaire->setCodeExemplaire($data['codeExemplaire']);
        $exemplaire->setLivre($livre);
        $exemplaire->setStatut($data['statut'] ?? Exemplaire::STATUT_DISPONIBLE);
        if (array_key_exists('etat', $data)) {
            $exemplaire->setEtat($data['etat']);
        }

        $this->em->persist($exemplaire);
        $this->em->flush();

        return $this->json($exemplaire, Response::HTTP_CREATED, [], ['groups' => ['exemplaire:read']]);
    }

    #[Route('/{id}', name: 'api_exemplaires_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $exemplaire = $this->exemplaireRepository->find($id);
        if ($exemplaire === null) {
            return $this->json(['status' => 404, 'code' => 'EXEMPLAIRE_NOT_FOUND', 'message' => 'Exemplaire introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Isolation multi-tenant via le livre
        $livre = $exemplaire->getLivre();
        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (array_key_exists('statut', $data)) {
            $exemplaire->setStatut($data['statut']);
        }
        if (array_key_exists('etat', $data)) {
            $exemplaire->setEtat($data['etat']);
        }

        $this->em->flush();

        return $this->json($exemplaire, Response::HTTP_OK, [], ['groups' => ['exemplaire:read']]);
    }

    #[Route('/{id}', name: 'api_exemplaires_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Seul un administrateur peut supprimer un exemplaire.'], Response::HTTP_FORBIDDEN);
        }

        $exemplaire = $this->exemplaireRepository->find($id);
        if ($exemplaire === null) {
            return $this->json(['status' => 404, 'code' => 'EXEMPLAIRE_NOT_FOUND', 'message' => 'Exemplaire introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Isolation multi-tenant via le livre
        $livre = $exemplaire->getLivre();
        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $this->em->remove($exemplaire);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
