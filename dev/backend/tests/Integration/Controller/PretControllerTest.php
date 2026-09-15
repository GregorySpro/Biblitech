<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class PretControllerTest extends WebTestCase
{
    private KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
    }

    private function getToken(string $role): string
    {
        $emails = [
            'adherent'       => 'adherent@test.fr',
            'bibliothecaire' => 'bibliothecaire@test.fr',
            'admin'          => 'admin@test.fr',
        ];
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => $emails[$role],
            'password' => 'password',
        ]));
        return json_decode($this->client->getResponse()->getContent(), true)['token'];
    }

    public function testPostPretSucces(): void
    {
        $this->client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ], json_encode([
            'exemplaire_id'  => 1,
            'utilisateur_id' => 3,
        ]));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('en_cours', $data['statut']);
    }

    public function testPostPretExemplaireIndisponible(): void
    {
        $this->client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ], json_encode([
            'exemplaire_id'  => 2,
            'utilisateur_id' => 3,
        ]));

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('EXEMPLAIRE_UNAVAILABLE', $data['code']);
    }

    public function testPatchRetour(): void
    {
        $token = $this->getToken('bibliothecaire');

        $this->client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['exemplaire_id' => 1, 'utilisateur_id' => 3]));
        $pretId = json_decode($this->client->getResponse()->getContent(), true)['id'];

        $this->client->request('PATCH', "/api/prets/$pretId/retour", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('rendu', $data['statut']);
        $this->assertNotNull($data['dateRetourEffective']);
    }

    public function testPatchRetourDejaRendu(): void
    {
        $token = $this->getToken('bibliothecaire');

        $this->client->request('POST', '/api/prets', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['exemplaire_id' => 1, 'utilisateur_id' => 3]));
        $pretId = json_decode($this->client->getResponse()->getContent(), true)['id'];

        $this->client->request('PATCH', "/api/prets/$pretId/retour", [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);
        $this->client->request('PATCH', "/api/prets/$pretId/retour", [], [], ['HTTP_AUTHORIZATION' => 'Bearer ' . $token]);

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('PRET_ALREADY_RETURNED', $data['code']);
    }

    public function testAdherentVoitSesPrets(): void
    {
        $this->client->request('GET', '/api/prets', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        foreach ($data as $pret) {
            $this->assertSame(3, $pret['utilisateur']['id']);
        }
    }

    public function testAdherentNeVoitPasAutresPrets(): void
    {
        $this->client->request('GET', '/api/prets/5', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
    }

    public function testEnregistrerRetourAdherentInterdit(): void
    {
        $this->client->request('PATCH', '/api/prets/1/retour', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testRetardsBibliothecaire(): void
    {
        $this->client->request('GET', '/api/prets/retards', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }
}
