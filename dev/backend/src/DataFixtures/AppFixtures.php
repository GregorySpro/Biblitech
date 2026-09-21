<?php

namespace App\DataFixtures;

use App\Entity\Bibliotheque;
use App\Entity\CguVersion;
use App\Entity\Exemplaire;
use App\Entity\Livre;
use App\Entity\Utilisateur;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function load(ObjectManager $manager): void
    {
        // ── CGU v1.0 ─────────────────────────────────────────────────────────
        $cgu = new CguVersion();
        $cgu->setVersion('1.0');
        $cgu->setContenu('Conditions Générales d\'Utilisation BiblioTech v1.0 — Utilisation à des fins de tests.');
        $cgu->setDateEffet(new \DateTimeImmutable('-1 day'));
        $cgu->setPubliePar('système');
        $manager->persist($cgu);

        // ── Bibliothèques ─────────────────────────────────────────────────────
        $biblio1 = new Bibliotheque();
        $biblio1->setNom('Bibliothèque Centrale de Test');
        $biblio1->setAdresse('1 rue de la République');
        $biblio1->setVille('Paris');
        $biblio1->setCodePostal('75001');
        $biblio1->setEmail('test@bibliotheque.fr');
        $manager->persist($biblio1);

        $biblio2 = new Bibliotheque();
        $biblio2->setNom('Bibliothèque Secondaire');
        $biblio2->setAdresse('42 avenue des Tests');
        $biblio2->setVille('Lyon');
        $biblio2->setCodePostal('69001');
        $biblio2->setEmail('test2@bibliotheque.fr');
        $manager->persist($biblio2);

        $manager->flush();

        // ── Super Admin (pas de bibliothèque) ─────────────────────────────────
        $superAdmin = new Utilisateur();
        $superAdmin->setNom('Admin');
        $superAdmin->setPrenom('Super');
        $superAdmin->setEmail('superadmin@test.fr');
        $superAdmin->setPassword($this->passwordHasher->hashPassword($superAdmin, 'password'));
        $superAdmin->setRole(Utilisateur::ROLE_SUPER_ADMIN);
        $superAdmin->setMustChangePassword(false);
        $superAdmin->setCguAcceptedVersion('1.0');
        $manager->persist($superAdmin);

        // ── Admin bibliothèque 1 ──────────────────────────────────────────────
        $admin = new Utilisateur();
        $admin->setNom('Dupont');
        $admin->setPrenom('Marie');
        $admin->setEmail('admin@test.fr');
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'password'));
        $admin->setRole(Utilisateur::ROLE_ADMIN);
        $admin->setBibliotheque($biblio1);
        $admin->setMustChangePassword(false);
        $admin->setCguAcceptedVersion('1.0');
        $manager->persist($admin);

        // ── Bibliothécaire ────────────────────────────────────────────────────
        $bibliothecaire = new Utilisateur();
        $bibliothecaire->setNom('Martin');
        $bibliothecaire->setPrenom('Jean');
        $bibliothecaire->setEmail('bibliothecaire@test.fr');
        $bibliothecaire->setPassword($this->passwordHasher->hashPassword($bibliothecaire, 'password'));
        $bibliothecaire->setRole(Utilisateur::ROLE_BIBLIOTHECAIRE);
        $bibliothecaire->setBibliotheque($biblio1);
        $bibliothecaire->setMustChangePassword(false);
        $bibliothecaire->setCguAcceptedVersion('1.0');
        $manager->persist($bibliothecaire);

        // ── Adhérents ─────────────────────────────────────────────────────────
        $adherent1 = new Utilisateur();
        $adherent1->setNom('Bernard');
        $adherent1->setPrenom('Alice');
        $adherent1->setEmail('adherent@test.fr');
        $adherent1->setPassword($this->passwordHasher->hashPassword($adherent1, 'password'));
        $adherent1->setRole(Utilisateur::ROLE_ADHERENT);
        $adherent1->setBibliotheque($biblio1);
        $adherent1->setMustChangePassword(false);
        $adherent1->setCguAcceptedVersion('1.0');
        $manager->persist($adherent1);

        $adherent2 = new Utilisateur();
        $adherent2->setNom('Moreau');
        $adherent2->setPrenom('Paul');
        $adherent2->setEmail('adherent2@test.fr');
        $adherent2->setPassword($this->passwordHasher->hashPassword($adherent2, 'password'));
        $adherent2->setRole(Utilisateur::ROLE_ADHERENT);
        $adherent2->setBibliotheque($biblio1);
        $adherent2->setMustChangePassword(false);
        $adherent2->setCguAcceptedVersion('1.0');
        $manager->persist($adherent2);

        // ── Compte désactivé ──────────────────────────────────────────────────
        $desactive = new Utilisateur();
        $desactive->setNom('Inactif');
        $desactive->setPrenom('Compte');
        $desactive->setEmail('desactive@test.fr');
        $desactive->setPassword($this->passwordHasher->hashPassword($desactive, 'password'));
        $desactive->setRole(Utilisateur::ROLE_ADHERENT);
        $desactive->setBibliotheque($biblio1);
        $desactive->setActive(false);
        $desactive->setMustChangePassword(false);
        $manager->persist($desactive);

        // ── Compte en premier login ───────────────────────────────────────────
        $premierLogin = new Utilisateur();
        $premierLogin->setNom('Nouveau');
        $premierLogin->setPrenom('Compte');
        $premierLogin->setEmail('premier@test.fr');
        $premierLogin->setPassword($this->passwordHasher->hashPassword($premierLogin, 'password'));
        $premierLogin->setRole(Utilisateur::ROLE_BIBLIOTHECAIRE);
        $premierLogin->setBibliotheque($biblio1);
        $premierLogin->setMustChangePassword(true);
        $manager->persist($premierLogin);

        $manager->flush();

        // ── Livres et exemplaires ─────────────────────────────────────────────
        $livresData = [
            ['isbn' => '9782070360024', 'titre' => 'L\'Étranger', 'auteur' => 'Albert Camus', 'editeur' => 'Gallimard', 'annee' => 1942],
            ['isbn' => '9782070368228', 'titre' => 'Le Petit Prince', 'auteur' => 'Antoine de Saint-Exupéry', 'editeur' => 'Gallimard', 'annee' => 1943],
            ['isbn' => '9782253004226', 'titre' => 'Les Misérables', 'auteur' => 'Victor Hugo', 'editeur' => 'Le Livre de Poche', 'annee' => 1862],
            ['isbn' => '9782070413119', 'titre' => 'Germinal', 'auteur' => 'Émile Zola', 'editeur' => 'Gallimard', 'annee' => 1885],
            ['isbn' => '9782070360024', 'titre' => 'L\'Étranger', 'auteur' => 'Albert Camus', 'editeur' => 'Gallimard', 'annee' => 1942],
        ];

        $codes = ['BIB1-001', 'BIB1-002', 'BIB1-003', 'BIB1-004', 'BIB1-005'];

        foreach (array_slice($livresData, 0, 4) as $i => $ld) {
            $livre = new Livre();
            $livre->setIsbn($ld['isbn']);
            $livre->setTitre($ld['titre']);
            $livre->setAuteur($ld['auteur']);
            $livre->setEditeur($ld['editeur']);
            $livre->setAnneePublication($ld['annee']);
            $livre->setBibliotheque($biblio1);
            $manager->persist($livre);

            $ex = new Exemplaire();
            $ex->setCodeExemplaire($codes[$i]);
            $ex->setEtat('bon');
            $ex->setLivre($livre);
            $manager->persist($ex);
        }

        $manager->flush();
    }
}
