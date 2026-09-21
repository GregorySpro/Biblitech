<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\CguVersionRepository;
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
        private readonly CguVersionRepository $cguVersionRepository,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly Security $security,
    ) {}

    private function validatePasswordStrength(string $password): ?string
    {
        if (strlen($password) < 8) {
            return 'Le mot de passe doit contenir au moins 8 caractères.';
        }
        if (!preg_match('/[A-Z]/', $password)) {
            return 'Le mot de passe doit contenir au moins une lettre majuscule.';
        }
        if (!preg_match('/[0-9]/', $password)) {
            return 'Le mot de passe doit contenir au moins un chiffre.';
        }
        if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
            return 'Le mot de passe doit contenir au moins un caractère spécial.';
        }
        return null;
    }

    #[Route('/me/accept-cgu', name: 'api_utilisateurs_accept_cgu', methods: ['POST'])]
    public function acceptCgu(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user        = $this->security->getUser();
        $utilisateur = $this->utilisateurRepository->find($user->getId());

        $data    = json_decode($request->getContent(), true) ?? [];
        $version = $data['version'] ?? null;

        if (empty($version)) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'La version des CGU est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        // Valider que la version fournie correspond à la version active en base
        $currentCgu = $this->cguVersionRepository->findCurrentVersion();
        if ($currentCgu === null || $version !== $currentCgu->getVersion()) {
            return $this->json(['status' => 400, 'code' => 'INVALID_CGU_VERSION', 'message' => 'Version de CGU invalide ou non en vigueur.'], Response::HTTP_BAD_REQUEST);
        }

        $utilisateur->setCguAcceptedVersion($version);
        $this->em->flush();

        return $this->json(['message' => 'CGU acceptées.', 'version' => $version], Response::HTTP_OK);
    }

    #[Route('/me/change-password', name: 'api_utilisateurs_change_password_first', methods: ['POST'])]
    public function changePasswordFirstLogin(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user        = $this->security->getUser();
        $utilisateur = $this->utilisateurRepository->find($user->getId());

        $data = json_decode($request->getContent(), true) ?? [];

        if (empty($data['password'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'Le nouveau mot de passe est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        $passwordError = $this->validatePasswordStrength($data['password']);
        if ($passwordError !== null) {
            return $this->json(['status' => 400, 'code' => 'WEAK_PASSWORD', 'message' => $passwordError], Response::HTTP_BAD_REQUEST);
        }

        $utilisateur->setPassword($this->passwordHasher->hashPassword($utilisateur, $data['password']));
        $utilisateur->setMustChangePassword(false);
        $this->em->flush();

        return $this->json(['message' => 'Mot de passe changé avec succès.'], Response::HTTP_OK);
    }

    #[Route('/{id}/suspendre-prets', name: 'api_utilisateurs_suspendre_prets', methods: ['PATCH'])]
    public function suspendrePrets(int $id, Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $utilisateur = $this->utilisateurRepository->find($id);
        if ($utilisateur === null) {
            return $this->json(['status' => 404, 'code' => 'USER_NOT_FOUND', 'message' => 'Utilisateur introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Isolation multi-tenant : un admin ne peut agir que sur sa propre bibliothèque
        if ($user->getRole() !== 'super_admin' && $utilisateur->getBibliothequeId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data    = json_decode($request->getContent(), true) ?? [];
        $suspendre = $data['suspendre'] ?? !$utilisateur->isPretsSuspendus();

        $utilisateur->setPretsSuspendus((bool) $suspendre);
        $this->em->flush();

        return $this->json([
            'message'         => $suspendre ? 'Prêts suspendus.' : 'Suspension levée.',
            'prets_suspendus' => $utilisateur->isPretsSuspendus(),
        ], Response::HTTP_OK);
    }

    #[Route('/by-email', name: 'api_utilisateurs_by_email', methods: ['GET'])]
    public function byEmail(Request $request): JsonResponse
    {
        $user = $this->security->getUser();

        // Réservé au staff (bibliothécaire minimum) — un adhérent ne peut pas énumérer les autres membres
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $email = $request->query->get('email', '');

        if (empty($email)) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'Le paramètre email est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        $bibId = $user->getRole() === 'super_admin' ? null : $user->getBibliothequeId();
        $results = $this->utilisateurRepository->searchByEmailPartial($email, $bibId);

        return $this->json($results, Response::HTTP_OK, [], ['groups' => ['utilisateur:read']]);
    }

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

    #[Route('/me', name: 'api_utilisateurs_update_me', methods: ['PATCH'])]
    public function updateMe(Request $request): JsonResponse
    {
        /** @var Utilisateur $user */
        $user        = $this->security->getUser();
        $utilisateur = $this->utilisateurRepository->find($user->getId());

        $data = json_decode($request->getContent(), true) ?? [];

        if (!empty($data['nom']))    $utilisateur->setNom($data['nom']);
        if (!empty($data['prenom'])) $utilisateur->setPrenom($data['prenom']);

        if (!empty($data['email']) && $data['email'] !== $utilisateur->getEmail()) {
            $existing = $this->utilisateurRepository->findByEmail($data['email']);
            if ($existing !== null && $existing->getId() !== $utilisateur->getId()) {
                return $this->json(['status' => 409, 'code' => 'USER_EMAIL_DUPLICATE', 'message' => 'Un compte avec cet email existe déjà.'], Response::HTTP_CONFLICT);
            }
            $utilisateur->setEmail($data['email']);
        }

        if (!empty($data['password'])) {
            // Vérifier le mot de passe actuel avant d'autoriser le changement
            if (empty($data['current_password'])) {
                return $this->json(['status' => 400, 'code' => 'CURRENT_PASSWORD_REQUIRED', 'message' => 'Le mot de passe actuel est requis pour en définir un nouveau.'], Response::HTTP_BAD_REQUEST);
            }
            if (!$this->passwordHasher->isPasswordValid($utilisateur, $data['current_password'])) {
                return $this->json(['status' => 403, 'code' => 'INVALID_CURRENT_PASSWORD', 'message' => 'Le mot de passe actuel est incorrect.'], Response::HTTP_FORBIDDEN);
            }
            $passwordError = $this->validatePasswordStrength($data['password']);
            if ($passwordError !== null) {
                return $this->json(['status' => 400, 'code' => 'WEAK_PASSWORD', 'message' => $passwordError], Response::HTTP_BAD_REQUEST);
            }
            $utilisateur->setPassword($this->passwordHasher->hashPassword($utilisateur, $data['password']));
        }

        $this->em->flush();

        return $this->json($utilisateur, Response::HTTP_OK, [], ['groups' => ['utilisateur:read']]);
    }

    #[Route('/me', name: 'api_utilisateurs_delete_me', methods: ['DELETE'])]
    public function deleteMe(): JsonResponse
    {
        /** @var Utilisateur $user */
        $user        = $this->security->getUser();
        $utilisateur = $this->utilisateurRepository->find($user->getId());

        if ($utilisateur === null) {
            return $this->json(['status' => 404, 'code' => 'USER_NOT_FOUND', 'message' => 'Compte introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // RGPD : anonymisation si l'utilisateur a des prêts historiques
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

        // Isolation multi-tenant : admin et bibliothécaire limités à leur propre bibliothèque
        if ($user->getRole() !== 'super_admin' && $user->getId() !== $id && $utilisateur->getBibliothequeId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
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

        $roleCreation = $data['role'] ?? Utilisateur::ROLE_ADHERENT;

        // Le super_admin peut créer des admins/super_admins uniquement (pas les adhérents/bibliothécaires)
        if ($user->getRole() === 'super_admin') {
            if (!in_array($roleCreation, ['admin', 'super_admin'], true)) {
                return $this->json(['status' => 403, 'code' => 'SUPER_ADMIN_RESTRICTED', 'message' => 'Le super administrateur ne peut créer que des comptes admin ou super_admin. Les adhérents sont gérés par l\'admin de chaque bibliothèque.'], Response::HTTP_FORBIDDEN);
            }
        }

        // L'admin ne peut pas créer de super_admin, et ne peut créer des utilisateurs que dans sa propre bibliothèque
        if ($user->getRole() === 'admin') {
            if (!in_array($roleCreation, ['adherent', 'bibliothecaire', 'admin'], true)) {
                return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Vous ne pouvez pas créer de compte avec ce rôle.'], Response::HTTP_FORBIDDEN);
            }
            if (!empty($data['bibliotheque_id']) && (int) $data['bibliotheque_id'] !== $user->getBibliothequeId()) {
                return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Vous ne pouvez créer des utilisateurs que dans votre propre bibliothèque.'], Response::HTTP_FORBIDDEN);
            }
        }

        foreach (['nom', 'prenom', 'email', 'password'] as $required) {
            if (empty($data[$required])) {
                return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => "Le champ $required est obligatoire."], Response::HTTP_BAD_REQUEST);
            }
        }

        $passwordError = $this->validatePasswordStrength($data['password']);
        if ($passwordError !== null) {
            return $this->json(['status' => 400, 'code' => 'WEAK_PASSWORD', 'message' => $passwordError], Response::HTTP_BAD_REQUEST);
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

        // Isolation multi-tenant : un admin ne peut modifier que les utilisateurs de sa bibliothèque
        if ($user->getRole() === 'admin' && $user->getId() !== $id && $utilisateur->getBibliothequeId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!empty($data['nom']))    $utilisateur->setNom($data['nom']);
        if (!empty($data['prenom'])) $utilisateur->setPrenom($data['prenom']);
        if (!empty($data['password'])) {
            // Quand l'utilisateur modifie son propre mot de passe via cette route, exiger le mot de passe actuel
            if ($user->getId() === $id) {
                if (empty($data['current_password'])) {
                    return $this->json(['status' => 400, 'code' => 'CURRENT_PASSWORD_REQUIRED', 'message' => 'Le mot de passe actuel est requis pour modifier votre mot de passe.'], Response::HTTP_BAD_REQUEST);
                }
                if (!$this->passwordHasher->isPasswordValid($utilisateur, $data['current_password'])) {
                    return $this->json(['status' => 403, 'code' => 'INVALID_CURRENT_PASSWORD', 'message' => 'Le mot de passe actuel est incorrect.'], Response::HTTP_FORBIDDEN);
                }
            }
            $passwordError = $this->validatePasswordStrength($data['password']);
            if ($passwordError !== null) {
                return $this->json(['status' => 400, 'code' => 'WEAK_PASSWORD', 'message' => $passwordError], Response::HTTP_BAD_REQUEST);
            }
            $utilisateur->setPassword($this->passwordHasher->hashPassword($utilisateur, $data['password']));
            // Forcer le changement de mot de passe seulement lors d'une réinitialisation par un admin
            if ($user->getId() !== $id) {
                $utilisateur->setMustChangePassword(true);
            }
        }

        // Seul le super_admin peut changer le rôle et la bibliothèque
        if ($user->getRole() === 'super_admin') {
            if (!empty($data['role'])) {
                $allowedRoles = ['adherent', 'bibliothecaire', 'admin', 'super_admin'];
                if (!in_array($data['role'], $allowedRoles, true)) {
                    return $this->json(['status' => 400, 'code' => 'INVALID_ROLE', 'message' => 'Rôle invalide.'], Response::HTTP_BAD_REQUEST);
                }
                $utilisateur->setRole($data['role']);
            }
            if (array_key_exists('bibliotheque_id', $data)) {
                if ($data['bibliotheque_id'] === null) {
                    $utilisateur->setBibliotheque(null);
                } else {
                    $bibliotheque = $this->em->find(\App\Entity\Bibliotheque::class, (int) $data['bibliotheque_id']);
                    $utilisateur->setBibliotheque($bibliotheque);
                }
            }
        } elseif ($user->getRole() === 'admin' && !empty($data['role']) && $data['role'] !== $utilisateur->getRole()) {
            // Un admin peut changer le rôle jusqu'à admin, mais pas super_admin
            if ($utilisateur->getRole() === 'super_admin') {
                return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Vous ne pouvez pas modifier le rôle d\'un super administrateur.'], Response::HTTP_FORBIDDEN);
            }
            $allowedRoles = ['adherent', 'bibliothecaire', 'admin'];
            if (!in_array($data['role'], $allowedRoles, true)) {
                return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Vous ne pouvez pas attribuer le rôle super_admin.'], Response::HTTP_FORBIDDEN);
            }
            $utilisateur->setRole($data['role']);
        } elseif (!empty($data['role']) && $data['role'] !== $utilisateur->getRole()) {
            // Tout autre rôle tente de changer le rôle → refus
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Vous ne pouvez pas modifier le rôle d\'un utilisateur.'], Response::HTTP_FORBIDDEN);
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

        // Isolation multi-tenant : un admin ne peut supprimer que les utilisateurs de sa bibliothèque
        if ($user->getRole() === 'admin' && $utilisateur->getBibliothequeId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
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
