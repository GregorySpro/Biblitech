<?php

namespace App\Controller;

use App\Entity\RefreshToken;
use App\Repository\RefreshTokenRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
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
        private readonly UtilisateurRepository  $utilisateurRepository,
        private readonly RefreshTokenRepository $refreshTokenRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly JWTTokenManagerInterface    $jwtManager,
        private readonly EntityManagerInterface      $em,
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

        // Vérification du verrouillage brute-force
        if ($utilisateur !== null && $utilisateur->isLocked()) {
            $retryAfter = $utilisateur->getLockedUntil()->getTimestamp() - time();
            return $this->json([
                'status'      => 429,
                'code'        => 'AUTH_ACCOUNT_LOCKED',
                'message'     => 'Compte temporairement verrouillé suite à trop de tentatives. Réessayez dans ' . ceil($retryAfter / 60) . ' minute(s).',
                'retry_after' => $retryAfter,
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        if ($utilisateur === null || !$this->passwordHasher->isPasswordValid($utilisateur, $data['password'])) {
            // Incrémenter le compteur de tentatives si l'utilisateur existe
            if ($utilisateur !== null) {
                $attempts = $utilisateur->getLoginAttempts() + 1;
                $utilisateur->setLoginAttempts($attempts);
                if ($attempts >= 5) {
                    $utilisateur->setLockedUntil((new \DateTimeImmutable())->modify('+15 minutes'));
                    $utilisateur->setLoginAttempts(0);
                }
                $this->em->flush();
            }
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

        // Connexion réussie — réinitialiser les tentatives
        $utilisateur->setLoginAttempts(0);
        $utilisateur->setLockedUntil(null);

        // Récupérer le nom de la bibliothèque si applicable
        $biblioNom = null;
        $bibliothetiqueDuretPret = 21;
        if ($utilisateur->getBibliotheque() !== null) {
            $biblioNom = $utilisateur->getBibliotheque()->getNom();
            $bibliothetiqueDuretPret = $utilisateur->getBibliotheque()->getDuretPretJours();
        }

        $accessToken = $this->jwtManager->createFromPayload($utilisateur, [
            'sub'                   => $utilisateur->getId(),
            'email'                 => $utilisateur->getEmail(),
            'role'                  => $utilisateur->getRole(),
            'bibliotheque_id'       => $utilisateur->getBibliothequeId(),
            'bibliotheque_nom'      => $biblioNom,
            'duret_pret_jours'      => $bibliothetiqueDuretPret,
            'must_change_password'  => $utilisateur->isMustChangePassword(),
            'cgu_accepted_version'  => $utilisateur->getCguAcceptedVersion(),
            'prets_suspendus'       => $utilisateur->isPretsSuspendus(),
        ]);

        $refreshToken = new RefreshToken($utilisateur);
        $this->em->persist($refreshToken);
        $this->em->flush();

        return $this->json([
            'token'         => $accessToken,
            'refresh_token' => $refreshToken->getToken(),
        ], Response::HTTP_OK);
    }

    #[Route('/token/refresh', name: 'api_token_refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $data         = json_decode($request->getContent(), true);
        $rawToken     = $data['refresh_token'] ?? null;

        if (empty($rawToken)) {
            return $this->json([
                'status'  => 400,
                'code'    => 'VALIDATION_ERROR',
                'message' => 'Le champ refresh_token est obligatoire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $refreshToken = $this->refreshTokenRepository->findValidToken($rawToken);

        if ($refreshToken === null) {
            return $this->json([
                'status'  => 401,
                'code'    => 'REFRESH_TOKEN_INVALID',
                'message' => 'Refresh token invalide ou expiré. Veuillez vous reconnecter.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $utilisateur = $refreshToken->getUtilisateur();

        if (!$utilisateur->isActive()) {
            return $this->json([
                'status'  => 403,
                'code'    => 'AUTH_ACCOUNT_DISABLED',
                'message' => 'Votre compte est désactivé. Contactez un administrateur.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Rotation : supprimer l'ancien refresh token, en créer un nouveau
        $this->em->remove($refreshToken);

        $biblioNom = null;
        $bibliothetiqueDuretPret = 21;
        if ($utilisateur->getBibliotheque() !== null) {
            $biblioNom = $utilisateur->getBibliotheque()->getNom();
            $bibliothetiqueDuretPret = $utilisateur->getBibliotheque()->getDuretPretJours();
        }

        $newAccessToken = $this->jwtManager->createFromPayload($utilisateur, [
            'sub'                   => $utilisateur->getId(),
            'email'                 => $utilisateur->getEmail(),
            'role'                  => $utilisateur->getRole(),
            'bibliotheque_id'       => $utilisateur->getBibliothequeId(),
            'bibliotheque_nom'      => $biblioNom,
            'duret_pret_jours'      => $bibliothetiqueDuretPret,
            'must_change_password'  => $utilisateur->isMustChangePassword(),
            'cgu_accepted_version'  => $utilisateur->getCguAcceptedVersion(),
            'prets_suspendus'       => $utilisateur->isPretsSuspendus(),
        ]);

        $newRefreshToken = new RefreshToken($utilisateur);
        $this->em->persist($newRefreshToken);
        $this->em->flush();

        return $this->json([
            'token'         => $newAccessToken,
            'refresh_token' => $newRefreshToken->getToken(),
        ], Response::HTTP_OK);
    }

    #[Route('/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $data     = json_decode($request->getContent(), true);
        $rawToken = $data['refresh_token'] ?? null;

        if (!empty($rawToken)) {
            $refreshToken = $this->refreshTokenRepository->findValidToken($rawToken);
            if ($refreshToken !== null) {
                $this->em->remove($refreshToken);
                $this->em->flush();
            }
        }

        return $this->json(['message' => 'Déconnexion réussie.'], Response::HTTP_OK);
    }
}
