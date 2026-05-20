<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ExemplaireControllerTest extends WebTestCase
{
    private int $livreId = 1;
    private int $exemplaireId = 1;

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

    public function testListExemplairesByLivre(): void
    {
        $client = static::createClient();
        $client->request('GET', "/api/exemplaires?livreId={$this->livreId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    public function testListExemplairesMissingLivreId(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/exemplaires', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseStatusCodeSame(400);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('VALIDATION_ERROR', $data['code']);
    }

    public function testCreateExemplaireBibliothecaire(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/exemplaires', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ], json_encode([
            'livreId'        => $this->livreId,
            'codeExemplaire' => 'EX-TEST-' . time(),
            'statut'         => 'disponible',
        ]));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsNotEmpty($data['codeExemplaire']);
    }

    public function testCreateExemplaireAdherentInterdit(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/exemplaires', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ], json_encode([
            'livreId'        => $this->livreId,
            'codeExemplaire' => 'EX-FORBIDDEN',
        ]));

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testCreateExemplaireCodeDuplicate(): void
    {
        $client = static::createClient();
        $token = $this->getToken('bibliothecaire');
        $code  = 'EX-DUP-' . time();

        // Create first exemplaire
        $client->request('POST', '/api/exemplaires', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'livreId'        => $this->livreId,
            'codeExemplaire' => $code,
        ]));

        // Try to create duplicate
        $client->request('POST', '/api/exemplaires', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'livreId'        => $this->livreId,
            'codeExemplaire' => $code,
        ]));

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('CODE_DUPLICATE', $data['code']);
    }

    public function testGetExemplaireById(): void
    {
        $client = static::createClient();
        $client->request('GET', "/api/exemplaires/{$this->exemplaireId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('codeExemplaire', $data);
    }

    public function testUpdateExemplaire(): void
    {
        $client = static::createClient();
        $client->request('PUT', "/api/exemplaires/{$this->exemplaireId}", [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ], json_encode([
            'statut' => 'emprunte',
        ]));

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('emprunte', $data['statut']);
    }

    public function testDeleteExemplaireAdminOnly(): void
    {
        $client = static::createClient();
        $client->request('DELETE', "/api/exemplaires/{$this->exemplaireId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testDeleteExemplaireAdmin(): void
    {
        $client = static::createClient();
        // First create an exemplaire
        $client->request('POST', '/api/exemplaires', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            'livreId'        => $this->livreId,
            'codeExemplaire' => 'EX-DEL-' . time(),
        ]));
        $id = json_decode($client->getResponse()->getContent(), true)['id'];

        // Delete it
        $client->request('DELETE', "/api/exemplaires/{$id}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ]);

        $this->assertResponseStatusCodeSame(204);
    }
}
