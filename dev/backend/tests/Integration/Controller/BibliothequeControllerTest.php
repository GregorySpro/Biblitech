<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class BibliothequeControllerTest extends WebTestCase
{
    private int $bibliothequeId = 1;

    /** Generate test JWT token for given role. */
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

    public function testListBibliothequesSuperAdminOnly(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/bibliotheques', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testGetBibliothequeByIdAdmin(): void
    {
        $client = static::createClient();
        $client->request('GET', "/api/bibliotheques/{$this->bibliothequeId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('nom', $data);
    }

    public function testGetBibliothequeByIdAdherentForbidden(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/bibliotheques/999', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
    }

    public function testCreateBibliothequeAdminForbidden(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/bibliotheques', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            'nom'     => 'New Library',
            'ville'   => 'Paris',
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testCreateBibliothequeValidation(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/bibliotheques', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            // Missing 'nom'
            'ville' => 'Paris',
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testUpdateBibliothequeAdmin(): void
    {
        $client = static::createClient();
        $client->request('PUT', "/api/bibliotheques/{$this->bibliothequeId}", [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            'nom' => 'Updated Library Name',
        ]));

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Updated Library Name', $data['nom']);
    }

    public function testUpdateBibliothequeAdherentForbidden(): void
    {
        $client = static::createClient();
        $client->request('PUT', "/api/bibliotheques/{$this->bibliothequeId}", [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ], json_encode([
            'nom' => 'Attempt',
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testToggleBibliothequeActive(): void
    {
        $client = static::createClient();
        $client->request('PATCH', "/api/bibliotheques/{$this->bibliothequeId}/activer", [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            'active' => false,
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testGetBibliothequeNotFound(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/bibliotheques/99999', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ]);

        $this->assertResponseStatusCodeSame(404);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('BIBLIOTHEQUE_NOT_FOUND', $data['code']);
    }
}
