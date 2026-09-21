<?php

namespace App\Controller;

use App\Entity\Bibliotheque;
use App\Repository\BibliothequeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/bibliotheques')]
class BibliothequeController extends AbstractController
{
    public function __construct(
        private readonly BibliothequeRepository $bibliothequeRepository,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {}

    private function requireSuperAdmin(): ?JsonResponse
    {
        if ($this->security->getUser()->getRole() !== 'super_admin') {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Réservé au super administrateur.'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    #[Route('', name: 'api_bibliotheques_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->security->getUser();

        if ($user->getRole() === 'super_admin') {
            $bibliotheques = $this->bibliothequeRepository->findAll();
        } else {
            // Les non-super_admin ne voient que les bibliothèques actives (pour les demandes de migration)
            $bibliotheques = $this->bibliothequeRepository->findBy(['active' => true]);
        }

        return $this->json($bibliotheques, Response::HTTP_OK, [], ['groups' => ['bibliotheque:read']]);
    }

    #[Route('', name: 'api_bibliotheques_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        if ($err = $this->requireSuperAdmin()) return $err;

        $data = json_decode($request->getContent(), true);
        if (empty($data['nom'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'Le nom est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        $bibliotheque = new Bibliotheque();
        $bibliotheque->setNom($data['nom']);
        $bibliotheque->setAdresse($data['adresse'] ?? null);
        $bibliotheque->setVille($data['ville'] ?? null);
        $bibliotheque->setCodePostal($data['code_postal'] ?? null);
        $bibliotheque->setEmail($data['email'] ?? null);

        $this->em->persist($bibliotheque);
        $this->em->flush();

        return $this->json($bibliotheque, Response::HTTP_CREATED, [], ['groups' => ['bibliotheque:read']]);
    }

    #[Route('/{id}', name: 'api_bibliotheques_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        $bibliotheque = $this->bibliothequeRepository->find($id);

        if ($bibliotheque === null) {
            return $this->json(['status' => 404, 'code' => 'BIBLIOTHEQUE_NOT_FOUND', 'message' => 'Bibliothèque introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($user->getRole() !== 'super_admin' && $user->getBibliothequeId() !== $id) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($bibliotheque, Response::HTTP_OK, [], ['groups' => ['bibliotheque:read']]);
    }

    #[Route('/{id}', name: 'api_bibliotheques_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $bibliotheque = $this->bibliothequeRepository->find($id);
        if ($bibliotheque === null) {
            return $this->json(['status' => 404, 'code' => 'BIBLIOTHEQUE_NOT_FOUND', 'message' => 'Bibliothèque introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($user->getRole() === 'admin' && $user->getBibliothequeId() !== $id) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        if (!empty($data['nom']))            $bibliotheque->setNom($data['nom']);
        if (array_key_exists('adresse', $data))     $bibliotheque->setAdresse($data['adresse']);
        if (array_key_exists('ville', $data))       $bibliotheque->setVille($data['ville']);
        if (array_key_exists('code_postal', $data)) $bibliotheque->setCodePostal($data['code_postal']);
        if (array_key_exists('email', $data))       $bibliotheque->setEmail($data['email']);
        if (!empty($data['duret_pret_jours']) && is_int($data['duret_pret_jours']) && $data['duret_pret_jours'] > 0) {
            $bibliotheque->setDuretPretJours((int) $data['duret_pret_jours']);
        }

        $this->em->flush();

        return $this->json($bibliotheque, Response::HTTP_OK, [], ['groups' => ['bibliotheque:read']]);
    }

    #[Route('/{id}', name: 'api_bibliotheques_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        if ($err = $this->requireSuperAdmin()) return $err;

        $bibliotheque = $this->bibliothequeRepository->find($id);
        if ($bibliotheque === null) {
            return $this->json(['status' => 404, 'code' => 'BIBLIOTHEQUE_NOT_FOUND', 'message' => 'Bibliothèque introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($bibliotheque);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/activer', name: 'api_bibliotheques_activer', methods: ['PATCH'])]
    public function activer(int $id, Request $request): JsonResponse
    {
        if ($err = $this->requireSuperAdmin()) return $err;

        $bibliotheque = $this->bibliothequeRepository->find($id);
        if ($bibliotheque === null) {
            return $this->json(['status' => 404, 'code' => 'BIBLIOTHEQUE_NOT_FOUND', 'message' => 'Bibliothèque introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $bibliotheque->setActive($data['active'] ?? !$bibliotheque->isActive());
        $this->em->flush();

        return $this->json($bibliotheque, Response::HTTP_OK, [], ['groups' => ['bibliotheque:read']]);
    }
}
