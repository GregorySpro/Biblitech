<?php

namespace App\Controller;

use App\Entity\Exemplaire;
use App\Entity\Livre;
use App\Exception\GoogleBooksApiException;
use App\Exception\IsbnNotFoundException;
use App\Repository\LivreRepository;
use App\Service\GoogleBooksService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/livres')]
class LivreController extends AbstractController
{
    public function __construct(
        private readonly LivreRepository $livreRepository,
        private readonly EntityManagerInterface $em,
        private readonly GoogleBooksService $googleBooksService,
        private readonly Security $security,
    ) {}

    #[Route('', name: 'api_livres_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        $bibliothequeId = $user->getBibliothequeId();

        $livres = $this->livreRepository->findByBibliothequeWithFilters(
            $bibliothequeId,
            $request->query->get('titre'),
            $request->query->get('auteur'),
            $request->query->get('isbn'),
        );

        return $this->json($livres, Response::HTTP_OK, [], ['groups' => ['livre:read']]);
    }

    #[Route('/isbn/{isbn}', name: 'api_livres_isbn', methods: ['GET'])]
    public function rechercherIsbn(string $isbn): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $role = $this->security->getUser()->getRole();
        if (!in_array($role, ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        try {
            $metadonnees = $this->googleBooksService->rechercherParIsbn($isbn);
            return $this->json($metadonnees, Response::HTTP_OK);
        } catch (IsbnNotFoundException $e) {
            return $this->json(['status' => 404, 'code' => 'LIVRE_ISBN_NOT_FOUND_GOOGLE', 'message' => $e->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (GoogleBooksApiException $e) {
            return $this->json(['status' => 500, 'code' => 'GOOGLE_BOOKS_API_ERROR', 'message' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'api_livres_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $livre = $this->livreRepository->find($id);
        if ($livre === null) {
            return $this->json(['status' => 404, 'code' => 'LIVRE_NOT_FOUND', 'message' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        // Isolation multi-tenant
        $user = $this->security->getUser();
        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($livre, Response::HTTP_OK, [], ['groups' => ['livre:read']]);
    }

    #[Route('', name: 'api_livres_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['titre'])) {
            return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => 'Le titre est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier la duplication ISBN
        if (!empty($data['isbn'])) {
            $existing = $this->livreRepository->findByIsbnAndBibliotheque($data['isbn'], $user->getBibliothequeId());
            if ($existing !== null) {
                return $this->json(['status' => 409, 'code' => 'LIVRE_ISBN_DUPLICATE', 'message' => 'Un livre avec cet ISBN existe déjà dans votre catalogue.'], Response::HTTP_CONFLICT);
            }
        }

        $bibliotheque = $this->em->find(\App\Entity\Bibliotheque::class, $user->getBibliothequeId());

        $livre = new Livre();
        $livre->setTitre($data['titre']);
        $livre->setBibliotheque($bibliotheque);
        $livre->setIsbn($data['isbn'] ?? null);
        $livre->setAuteur($data['auteur'] ?? null);
        $livre->setEditeur($data['editeur'] ?? null);
        $livre->setAnneePublication($data['anneePublication'] ?? null);
        $livre->setDescription($data['description'] ?? null);
        $livre->setCouvertureUrl($data['couvertureUrl'] ?? null);

        $this->em->persist($livre);
        $this->em->flush();

        return $this->json($livre, Response::HTTP_CREATED, [], ['groups' => ['livre:read']]);
    }

    #[Route('/{id}', name: 'api_livres_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['bibliothecaire', 'admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $livre = $this->livreRepository->find($id);
        if ($livre === null) {
            return $this->json(['status' => 404, 'code' => 'LIVRE_NOT_FOUND', 'message' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!empty($data['titre'])) $livre->setTitre($data['titre']);
        if (array_key_exists('auteur', $data)) $livre->setAuteur($data['auteur']);
        if (array_key_exists('editeur', $data)) $livre->setEditeur($data['editeur']);
        if (array_key_exists('anneePublication', $data)) $livre->setAnneePublication($data['anneePublication']);
        if (array_key_exists('description', $data)) $livre->setDescription($data['description']);
        if (array_key_exists('couvertureUrl', $data)) $livre->setCouvertureUrl($data['couvertureUrl']);

        $this->em->flush();

        return $this->json($livre, Response::HTTP_OK, [], ['groups' => ['livre:read']]);
    }

    #[Route('/{id}', name: 'api_livres_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->security->getUser();
        if (!in_array($user->getRole(), ['admin', 'super_admin'], true)) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Seul un administrateur peut supprimer un livre.'], Response::HTTP_FORBIDDEN);
        }

        $livre = $this->livreRepository->find($id);
        if ($livre === null) {
            return $this->json(['status' => 404, 'code' => 'LIVRE_NOT_FOUND', 'message' => 'Livre introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($user->getRole() !== 'super_admin' && $livre->getBibliotheque()->getId() !== $user->getBibliothequeId()) {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $this->em->remove($livre);
        $this->em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
