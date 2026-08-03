<?php

namespace App\Controller;

use App\Entity\CguVersion;
use App\Repository\CguVersionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/cgu')]
class CguController extends AbstractController
{
    public function __construct(
        private readonly CguVersionRepository $cguVersionRepository,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {}

    #[Route('/current', name: 'api_cgu_current', methods: ['GET'])]
    public function current(): JsonResponse
    {
        $version = $this->cguVersionRepository->findCurrentVersion();

        if ($version === null) {
            return $this->json(['status' => 404, 'code' => 'CGU_NOT_FOUND', 'message' => 'Aucune version de CGU en vigueur.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($version, Response::HTTP_OK, [], ['groups' => ['cgu:read']]);
    }

    #[Route('/pending', name: 'api_cgu_pending', methods: ['GET'])]
    public function pending(): JsonResponse
    {
        $version = $this->cguVersionRepository->findPendingVersion();

        if ($version === null) {
            return $this->json(null, Response::HTTP_NO_CONTENT);
        }

        return $this->json($version, Response::HTTP_OK, [], ['groups' => ['cgu:read']]);
    }

    #[Route('/history', name: 'api_cgu_history', methods: ['GET'])]
    public function history(): JsonResponse
    {
        $versions = $this->cguVersionRepository->findAllOrderedByDate();
        return $this->json($versions, Response::HTTP_OK, [], ['groups' => ['cgu:read']]);
    }

    #[Route('', name: 'api_cgu_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if ($user->getRole() !== 'super_admin') {
            return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', 'message' => 'Réservé au super administrateur.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        foreach (['version', 'contenu', 'date_effet'] as $required) {
            if (empty($data[$required])) {
                return $this->json(['status' => 400, 'code' => 'VALIDATION_ERROR', 'message' => "Le champ $required est obligatoire."], Response::HTTP_BAD_REQUEST);
            }
        }

        // Vérifier l'unicité de la version
        $existing = $this->cguVersionRepository->findOneBy(['version' => $data['version']]);
        if ($existing !== null) {
            return $this->json(['status' => 409, 'code' => 'CGU_VERSION_DUPLICATE', 'message' => 'Une version de CGU avec ce numéro existe déjà.'], Response::HTTP_CONFLICT);
        }

        $cgu = new CguVersion();
        $cgu->setVersion($data['version']);
        $cgu->setContenu($data['contenu']);
        $cgu->setDateEffet(new \DateTimeImmutable($data['date_effet']));
        $cgu->setPubliePar($user->getEmail());

        $this->em->persist($cgu);
        $this->em->flush();

        return $this->json($cgu, Response::HTTP_CREATED, [], ['groups' => ['cgu:read']]);
    }
}
