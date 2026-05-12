<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class PretControllerTest extends WebTestCase
{
    private function getToken(string $role): string
    {
        $client = static::createClient();
        $emails = [
            'adherent'       => 'adherent@test.fr',
            'bibliothecaire' => 'bibliothecaire@test.fr',
            'admin'          => 'admin@test.fr',
        ];
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => $emails[$role],
            'password' => 'password',
        ]));
        return json_decode($client->getResponse()->getContent(), true)['token'];
    }

    public function testPostPretSucces(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ], json_encode([
            'exemplaire_id'  => 1,  // Fixture : exemplaire disponible
            'utilisateur_id' => 3,  // Fixture : adhérent
        ]));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('en_cours', $data['statut']);
    }

    public function testPostPretExemplaireIndisponible(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ], json_encode([
            'exemplaire_id'  => 2,  // Fixture : exemplaire déjà emprunté
            'utilisateur_id' => 3,
        ]));

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('EXEMPLAIRE_UNAVAILABLE', $data['code']);
    }

    public function testPatchRetour(): void
    {
        $client = static::createClient();
        $token  = $this->getToken('bibliothecaire');

        // Créer un prêt
        $client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['exemplaire_id' => 1, 'utilisateur_id' => 3]));
        $pretId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Enregistrer le retour
        $client->request('PATCH', "/api/prets/$pretId/retour", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('rendu', $data['statut']);
        $this->assertNotNull($data['dateRetourEffective']);
    }

    public function testPatchRetourDejaRendu(): void
    {
        $client = static::createClient();
        $token  = $this->getToken('bibliothecaire');

        // Créer et rendre un prêt
        $client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['exemplaire_id' => 1, 'utilisateur_id' => 3]));
        $pretId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('PATCH', "/api/prets/$pretId/retour", [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);

        // Tenter un deuxième retour
        $client->request('PATCH', "/api/prets/$pretId/retour", [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('PRET_ALREADY_RETURNED', $data['code']);
    }

    public function testAdherentVoitSesPrets(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/prets', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        // Tous les prêts retournés doivent appartenir à l'adhérent connecté (id:3)
        foreach ($data as $pret) {
            $this->assertSame(3, $pret['utilisateur']['id']);
        }
    }

    public function testAdherentNeVoitPasAutresPrets(): void
    {
        $client = static::createClient();
        // Prêt #5 appartient à un autre utilisateur (fixture)
        $client->request('GET', '/api/prets/5', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
    }

    public function testEnregistrerRetourAdherentInterdit(): void
    {
        $client = static::createClient();
        $client->request('PATCH', '/api/prets/1/retour', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testRetardsBibliothecaire(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/prets/retards', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }
}
