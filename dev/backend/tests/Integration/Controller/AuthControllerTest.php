<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthControllerTest extends WebTestCase
{
    private KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
    }

    public function testLoginSucces(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'bibliothecaire@test.fr',
            'password' => 'password',
        ]));

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $data);
        $this->assertNotEmpty($data['token']);
    }

    public function testLoginMauvaisMotDePasse(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'bibliothecaire@test.fr',
            'password' => 'mauvais_mdp',
        ]));

        $this->assertResponseStatusCodeSame(401);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('AUTH_INVALID_CREDENTIALS', $data['code']);
    }

    public function testLoginEmailInexistant(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'inexistant@test.fr',
            'password' => 'password',
        ]));

        $this->assertResponseStatusCodeSame(401);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('AUTH_INVALID_CREDENTIALS', $data['code']);
    }

    public function testLoginCompteDesactive(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'desactive@test.fr',
            'password' => 'password',
        ]));

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('AUTH_ACCOUNT_DISABLED', $data['code']);
    }

    public function testAccesSansToken(): void
    {
        $this->client->request('GET', '/api/prets');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testAccesTokenMalformate(): void
    {
        $this->client->request('GET', '/api/prets', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer token_invalide_completement',
        ]);

        $this->assertResponseStatusCodeSame(401);
    }
}
