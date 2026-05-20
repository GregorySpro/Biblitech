<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    public function __construct(
        private readonly UtilisateurRepository $utilisateurRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {}

    #[Route('/login', name: 'api_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->json([
                'status'  => 400,
                'code'    => 'VALIDATION_ERROR',
                'message' => 'Les champs email et password sont obligatoires.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $utilisateur = $this->utilisateurRepository->findByEmail($data['email']);

        if ($utilisateur === null || !$this->passwordHasher->isPasswordValid($utilisateur, $data['password'])) {
            return $this->json([
                'status'  => 401,
                'code'    => 'AUTH_INVALID_CREDENTIALS',
                'message' => 'Email ou mot de passe incorrect.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$utilisateur->isActive()) {
            return $this->json([
                'status'  => 403,
                'code'    => 'AUTH_ACCOUNT_DISABLED',
                'message' => 'Votre compte est désactivé. Contactez un administrateur.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Générer le JWT avec payload enrichi
        $token = $this->jwtManager->createFromPayload($utilisateur, [
            'sub'             => $utilisateur->getId(),
            'email'           => $utilisateur->getEmail(),
            'role'            => $utilisateur->getRole(),
            'bibliotheque_id' => $utilisateur->getBibliothequeId(),
        ]);

        return $this->json(['token' => $token], Response::HTTP_OK);
    }

    #[Route('/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        // Le JWT est stateless : l'invalidation est gérée côté client (suppression du localStorage).
        // Si une blacklist JWT est nécessaire, elle sera ajoutée ici.
        return $this->json(['message' => 'Déconnexion réussie.'], Response::HTTP_OK);
    }
}
