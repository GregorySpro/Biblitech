<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/utilisateurs')]
class UtilisateurController extends AbstractController
{
    public function __construct(
        private readonly UtilisateurRepository $utilisateurRepository,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly Security $security,
    ) {}

    #[Route('/me', name: 'api_utilisateurs_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->security->getUser();
        $utilisateur = $this->utilisateurRepository->find($user->getId());

        return $this->json($utilisateur, Response::HTTP_OK, [], ['groups' => ['utilisateur:read']]);
    }

    #[Route('', name: 'api_utilisateurs_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        if ($user->getRole() === 'super_admin') {
            $utilisateurs = $this->utilisateurRepository->findAll();
        } else {
            $utilisateurs = $this->utilisateurRepository->findByBibliotheque($user->getBibliothequeId(), $request->query->get('role'));
        }

        return $this->json($utilisateurs, Response::HTTP_OK, [], ['groups' => ['utilisateur:read']]);
    }

    #[Route('/{id}', name: 'api_utilisateurs_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->security->getUser();

        // Un utilisateur peut voir son propre profil
        if ($user->getRole() === 'adherent' && $user->getId() !== $id) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $utilisateur = $this->utilisateurRepository->find($id);
        if ($utilisateur === null) {
            return $this->json(['status' => 404, 'code' => 'USER_NOT_FOUND', 'message' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($utilisateur, Response::HTTP_OK, [], ['groups' => ['utilisateur:read']]);
    }

    #[Route('', name: 'api_utilisateurs_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        foreach (['nom', 'prenom', 'email', 'password'] as $required) {
            if (empty($data[$required])) {
                return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => "Le champ $required est obligatoire."], Response::HTTP_BAD_REQUEST);
            }
        }

        if ($this->utilisateurRepository->findByEmail($data['email']) !== null) {
            return $this->json(['status' => 409, 'code' => 'USER_EMAIL_DUPLICATE', 'message' => 'Un compte avec cet email existe déjà.'], Response::HTTP_CONFLICT);
        }

        $bibliotheque = null;
        if (!empty($data['bibliotheque_id'])) {
            $bibliotheque = $this->em->find(\App\Entity\Bibliotheque::class, $data['bibliotheque_id']);
        } elseif ($user->getBibliothequeId() !== null) {
            $bibliotheque = $this->em->find(\App\Entity\Bibliotheque::class, $user->getBibliothequeId());
        }

        $utilisateur = new Utilisateur();
        $utilisateur->setNom($data['nom']);
        $utilisateur->setPrenom($data['prenom']);
        $utilisateur->setEmail($data['email']);
        $utilisateur->setPassword($this->passwordHasher->hashPassword($utilisateur, $data['password']));
        $utilisateur->setRole($data['role'] ?? Utilisateur::ROLE_ADHERENT);
        $utilisateur->setBibliotheque($bibliotheque);

        $this->em->persist($utilisateur);
        $this->em->flush();

        return $this->json($utilisateur, Response::HTTP_CREATED, [], ['groups' => ['utilisateur:read']]);
    }

    #[Route('/{id}', name: 'api_utilisateurs_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user        = $this->security->getUser();
        $utilisateur = $this->utilisateurRepository->find($id);

        if ($utilisateur === null) {
            return $this->json(['status' => 404, 'code' => 'USER_NOT_FOUND', 'message' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Seul l'utilisateur lui-même ou un admin peut modifier
        $canEdit = in_array($user->getRole(), ['admin', 'super_admin'], true) || $user->getId() === $id;
        if (!$canEdit) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!empty($data['nom']))    $utilisateur->setNom($data['nom']);
        if (!empty($data['prenom'])) $utilisateur->setPrenom($data['prenom']);
        if (!empty($data['password'])) {
            $utilisateur->setPassword($this->passwordHasher->hashPassword($utilisateur, $data['password']));
        }

        $this->em->flush();

        return $this->json($utilisateur, Response::HTTP_OK, [], ['groups' => ['utilisateur:read']]);
    }

    #[Route('/{id}', name: 'api_utilisateurs_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $utilisateur = $this->utilisateurRepository->find($id);
        if ($utilisateur === null) {
            return $this->json(['status' => 404, 'code' => 'USER_NOT_FOUND', 'message' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // RGPD : anonymisation plutôt que suppression physique si l'utilisateur a des prêts
        if (!$utilisateur->getPrets()->isEmpty()) {
            $utilisateur->setNom('[SUPPRIMÉ]');
            $utilisateur->setPrenom('[SUPPRIMÉ]');
            $utilisateur->setEmail('deleted_' . $utilisateur->getId() . '@anonymous.local');
            $utilisateur->setActive(false);
            $this->em->flush();
        } else {
            $this->em->remove($utilisateur);
            $this->em->flush();
        }

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
