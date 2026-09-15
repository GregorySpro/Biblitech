<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class UtilisateurControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private int $adherentId = 3;
    private int $adminId = 2;

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

    public function testGetCurrentUser(): void
    {
        $this->client->request('GET', '/api/utilisateurs/me', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('email', $data);
        $this->assertArrayHasKey('role', $data);
    }

    public function testListUsersAdminOnly(): void
    {
        $this->client->request('GET', '/api/utilisateurs', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    public function testListUsersAdherentForbidden(): void
    {
        $this->client->request('GET', '/api/utilisateurs', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testGetUserOwnProfile(): void
    {
        $this->client->request('GET', "/api/utilisateurs/{$this->adherentId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $data);
    }

    public function testGetUserOtherProfileAdherentForbidden(): void
    {
        $this->client->request('GET', '/api/utilisateurs/1', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testCreateUserAdmin(): void
    {
        $email = 'newuser_' . time() . '@test.fr';

        $this->client->request('POST', '/api/utilisateurs', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            'nom'      => 'Dupont',
            'prenom'   => 'Jean',
            'email'    => $email,
            'password' => 'SecurePassword123!',
            'role'     => 'adherent',
        ]));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Jean', $data['prenom']);
        $this->assertSame('Dupont', $data['nom']);
        $this->assertSame('adherent', $data['role']);
    }

    public function testCreateUserAdherentForbidden(): void
    {
        $this->client->request('POST', '/api/utilisateurs', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ], json_encode([
            'nom'      => 'Test',
            'prenom'   => 'User',
            'email'    => 'test@test.fr',
            'password' => 'pass123',
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testCreateUserMissingRequired(): void
    {
        $this->client->request('POST', '/api/utilisateurs', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            'nom' => 'Incomplete',
        ]));

        $this->assertResponseStatusCodeSame(400);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('VALIDATION_ERROR', $data['code']);
    }

    public function testCreateUserDuplicateEmail(): void
    {
        $token = $this->getToken('admin');
        $email = 'duplicate_' . time() . '@test.fr';

        $this->client->request('POST', '/api/utilisateurs', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'nom'      => 'User',
            'prenom'   => 'First',
            'email'    => $email,
            'password' => 'pass123',
        ]));

        $this->client->request('POST', '/api/utilisateurs', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'nom'      => 'User',
            'prenom'   => 'Second',
            'email'    => $email,
            'password' => 'pass123',
        ]));

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('USER_EMAIL_DUPLICATE', $data['code']);
    }

    public function testUpdateUserOwnProfile(): void
    {
        $this->client->request('PUT', "/api/utilisateurs/{$this->adherentId}", [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ], json_encode([
            'prenom' => 'UpdatedName',
        ]));

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('UpdatedName', $data['prenom']);
    }

    public function testUpdateUserAdmin(): void
    {
        $this->client->request('PUT', "/api/utilisateurs/{$this->adherentId}", [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode([
            'nom' => 'AdminUpdate',
        ]));

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('AdminUpdate', $data['nom']);
    }

    public function testUpdateUserAdherentOtherProfileForbidden(): void
    {
        $this->client->request('PUT', '/api/utilisateurs/1', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ], json_encode([
            'nom' => 'Attempt',
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testDeleteUserAdmin(): void
    {
        $token = $this->getToken('admin');

        $this->client->request('POST', '/api/utilisateurs', [], [], [
            'CONTENT_TYPE'       => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'nom'      => 'ToDelete',
            'prenom'   => 'User',
            'email'    => 'todelete_' . time() . '@test.fr',
            'password' => 'pass123',
        ]));
        $id = json_decode($this->client->getResponse()->getContent(), true)['id'];

        $this->client->request('DELETE', "/api/utilisateurs/{$id}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(204);
    }

    public function testDeleteUserAdherentForbidden(): void
    {
        $this->client->request('DELETE', "/api/utilisateurs/{$this->adherentId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testDeleteUserNotFound(): void
    {
        $this->client->request('DELETE', '/api/utilisateurs/99999', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ]);

        $this->assertResponseStatusCodeSame(404);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('USER_NOT_FOUND', $data['code']);
    }
}
