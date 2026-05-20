<?php

namespace App\Tests\Integration\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class LivreControllerTest extends WebTestCase
{
    /** Génère un token JWT de test pour un rôle donné (simplifié, à adapter avec fixtures réelles). */
    private function getToken(string $role): string
    {
        $client = static::createClient();
        $emails = [
            'adherent'      => 'adherent@test.fr',
            'bibliothecaire' => 'bibliothecaire@test.fr',
            'admin'         => 'admin@test.fr',
        ];
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email'    => $emails[$role],
            'password' => 'password',
        ]));
        return json_decode($client->getResponse()->getContent(), true)['token'];
    }

    public function testGetCatalogueAdherent(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/livres', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    public function testGetCatalogueFiltre(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/livres?titre=Prince', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseIsSuccessful();
    }

    public function testPostLivreBibliothecaire(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/livres', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ], json_encode([
            'titre'  => 'Livre de test PHPUnit',
            'auteur' => 'Auteur Test',
        ]));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Livre de test PHPUnit', $data['titre']);
    }

    public function testPostLivreAdherentInterdit(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/livres', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('adherent'),
        ], json_encode(['titre' => 'Tentative interdite']));

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('ACCESS_DENIED', $data['code']);
    }

    public function testPostLivreIsbnDuplique(): void
    {
        $client = static::createClient();
        $token  = $this->getToken('bibliothecaire');

        // Premier ajout
        $client->request('POST', '/api/livres', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['titre' => 'Livre ISBN', 'isbn' => '9782070612758']));

        // Deuxième ajout avec même ISBN
        $client->request('POST', '/api/livres', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['titre' => 'Doublon', 'isbn' => '9782070612758']));

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('LIVRE_ISBN_DUPLICATE', $data['code']);
    }

    public function testDeleteLivreAdmin(): void
    {
        $client = static::createClient();
        // D'abord créer un livre
        $client->request('POST', '/api/livres', [], [], [
            'CONTENT_TYPE'      => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ], json_encode(['titre' => 'À supprimer']));
        $id = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('DELETE', "/api/livres/$id", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('admin'),
        ]);

        $this->assertResponseStatusCodeSame(204);
    }

    public function testDeleteLivreBibliothecaireInterdit(): void
    {
        $client = static::createClient();
        $client->request('DELETE', '/api/livres/1', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $this->getToken('bibliothecaire'),
        ]);

        $this->assertResponseStatusCodeSame(403);
    }
}
