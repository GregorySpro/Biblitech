<?php

namespace App\Tests\Unit\Service;

use App\Entity\Exemplaire;
use App\Entity\Pret;
use App\Entity\Utilisateur;
use App\Exception\ExemplaireUnavailableException;
use App\Exception\PretAlreadyReturnedException;
use App\Exception\PretMaxReachedException;
use App\Repository\PretRepository;
use App\Service\PretService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class PretServiceTest extends TestCase
{
    private PretService $pretService;
    private EntityManagerInterface&MockObject $em;
    private PretRepository&MockObject $pretRepository;

    protected function setUp(): void
    {
        $this->em             = $this->createMock(EntityManagerInterface::class);
        $this->pretRepository = $this->createMock(PretRepository::class);
        $this->pretService    = new PretService($this->em, $this->pretRepository);
    }

    private function makeUtilisateur(int $id = 1): Utilisateur
    {
        $u = new Utilisateur();
        // Accès à l'id via réflexion (champ privé)
        $ref = new \ReflectionProperty(Utilisateur::class, 'id');
        $ref->setValue($u, $id);
        $u->setNom('Test')->setPrenom('User')->setEmail("user$id@test.fr")->setRole('adherent');
        return $u;
    }

    private function makeExemplaire(string $statut = Exemplaire::STATUT_DISPONIBLE): Exemplaire
    {
        $e = new Exemplaire();
        $e->setCodeExemplaire('EX-001')->setStatut($statut);
        $livre = new \App\Entity\Livre();
        $livre->setTitre('Test Livre');
        $bibliotheque = new \App\Entity\Bibliotheque();
        $bibliotheque->setNom('Test Biblio');
        $livre->setBibliotheque($bibliotheque);
        $e->setLivre($livre);
        return $e;
    }

    public function testEnregistrerPretExemplaireDisponible(): void
    {
        $utilisateur = $this->makeUtilisateur();
        $exemplaire  = $this->makeExemplaire(Exemplaire::STATUT_DISPONIBLE);

        $this->pretRepository->method('countPretsActifs')->willReturn(0);
        $this->em->expects($this->once())->method('persist');
        $this->em->expects($this->once())->method('flush');
        $this->em->method('beginTransaction');
        $this->em->method('commit');

        $pret = $this->pretService->enregistrerPret($utilisateur, $exemplaire);

        $this->assertInstanceOf(Pret::class, $pret);
        $this->assertSame($utilisateur, $pret->getUtilisateur());
        $this->assertSame($exemplaire, $pret->getExemplaire());
        $this->assertSame(Exemplaire::STATUT_EMPRUNTE, $exemplaire->getStatut());
    }

    public function testEnregistrerPretExemplaireIndisponible(): void
    {
        $this->expectException(ExemplaireUnavailableException::class);

        $utilisateur = $this->makeUtilisateur();
        $exemplaire  = $this->makeExemplaire(Exemplaire::STATUT_EMPRUNTE);

        $this->pretService->enregistrerPret($utilisateur, $exemplaire);
    }

    public function testEnregistrerPretMaxPrets(): void
    {
        $this->expectException(PretMaxReachedException::class);

        $utilisateur = $this->makeUtilisateur();
        $exemplaire  = $this->makeExemplaire(Exemplaire::STATUT_DISPONIBLE);

        $this->pretRepository->method('countPretsActifs')->willReturn(Pret::MAX_PRETS_SIMULTANES);

        $this->pretService->enregistrerPret($utilisateur, $exemplaire);
    }

    public function testEnregistrerRetourPretEnCours(): void
    {
        $exemplaire = $this->makeExemplaire(Exemplaire::STATUT_EMPRUNTE);
        $pret = new Pret();
        $pret->setExemplaire($exemplaire);
        $pret->setUtilisateur($this->makeUtilisateur());
        $pret->setStatut(Pret::STATUT_EN_COURS);

        $this->em->expects($this->once())->method('flush');
        $this->em->method('beginTransaction');
        $this->em->method('commit');

        $result = $this->pretService->enregistrerRetour($pret);

        $this->assertSame(Pret::STATUT_RENDU, $result->getStatut());
        $this->assertNotNull($result->getDateRetourEffective());
        $this->assertSame(Exemplaire::STATUT_DISPONIBLE, $exemplaire->getStatut());
    }

    public function testEnregistrerRetourPretDejaRendu(): void
    {
        $this->expectException(PretAlreadyReturnedException::class);

        $pret = new Pret();
        $pret->setExemplaire($this->makeExemplaire());
        $pret->setUtilisateur($this->makeUtilisateur());
        $pret->setStatut(Pret::STATUT_RENDU);

        $this->pretService->enregistrerRetour($pret);
    }

    public function testCalculDateRetourDefaut(): void
    {
        $utilisateur = $this->makeUtilisateur();
        $exemplaire  = $this->makeExemplaire();

        $this->pretRepository->method('countPretsActifs')->willReturn(0);
        $this->em->method('beginTransaction');
        $this->em->method('commit');

        $pret = $this->pretService->enregistrerPret($utilisateur, $exemplaire);

        $expectedDate = (new \DateTimeImmutable())->modify('+' . Pret::DUREE_DEFAUT_JOURS . ' days');
        $this->assertEqualsWithDelta(
            $expectedDate->getTimestamp(),
            $pret->getDateRetourPrevue()->getTimestamp(),
            5
        );
    }

    public function testCalculDateRetourPersonnalisee(): void
    {
        $utilisateur = $this->makeUtilisateur();
        $exemplaire  = $this->makeExemplaire();
        $dateCustom  = new \DateTimeImmutable('2026-07-01');

        $this->pretRepository->method('countPretsActifs')->willReturn(0);
        $this->em->method('beginTransaction');
        $this->em->method('commit');

        $pret = $this->pretService->enregistrerPret($utilisateur, $exemplaire, $dateCustom);

        $this->assertEquals($dateCustom, $pret->getDateRetourPrevue());
    }
}
