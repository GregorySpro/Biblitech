<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthControllerTest extends WebTestCase
{
    public function testLoginSucces(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'bibliothecaire@test.fr',
            'password' => 'password',
        ]));

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $data);
        $this->assertNotEmpty($data['token']);
    }

    public function testLoginMauvaisMotDePasse(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'bibliothecaire@test.fr',
            'password' => 'mauvais_mdp',
        ]));

        $this->assertResponseStatusCodeSame(401);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('AUTH_INVALID_CREDENTIALS', $data['code']);
    }

    public function testLoginEmailInexistant(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'inexistant@test.fr',
            'password' => 'password',
        ]));

        $this->assertResponseStatusCodeSame(401);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('AUTH_INVALID_CREDENTIALS', $data['code']);
    }

    public function testLoginCompteDesactive(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => 'desactive@test.fr',
            'password' => 'password',
        ]));

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('AUTH_ACCOUNT_DISABLED', $data['code']);
    }

    public function testAccesSansToken(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/prets');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testAccesTokenMalformate(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/prets', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer token_invalide_completement',
        ]);

        $this->assertResponseStatusCodeSame(401);
    }
}
