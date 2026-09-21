<?php

namespace App\Tests\Unit\Service;

use App\Exception\GoogleBooksApiException;
use App\Exception\IsbnNotFoundException;
use App\Service\GoogleBooksService;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

class GoogleBooksServiceTest extends TestCase
{
    private HttpClientInterface&MockObject $httpClient;

    protected function setUp(): void
    {
        $this->httpClient = $this->createMock(HttpClientInterface::class);
    }

    private function makeService(): GoogleBooksService
    {
        return new GoogleBooksService($this->httpClient, 'fake-api-key-for-tests');
    }

    private function makeResponse(int $statusCode, array $data): ResponseInterface&MockObject
    {
        $response = $this->createMock(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn($statusCode);
        $response->method('toArray')->willReturn($data);
        return $response;
    }

    public function testRechercherIsbnTrouve(): void
    {
        $response = $this->makeResponse(200, [
            'totalItems' => 1,
            'items' => [[
                'volumeInfo' => [
                    'title'         => 'Le Petit Prince',
                    'authors'       => ['Antoine de Saint-Exupéry'],
                    'publisher'     => 'Gallimard',
                    'publishedDate' => '1943',
                    'description'   => 'Un roman poétique.',
                    'imageLinks'    => ['thumbnail' => 'http://books.google.com/cover.jpg'],
                ],
            ]],
        ]);

        $this->httpClient->method('request')->willReturn($response);

        $result = $this->makeService()->rechercherParIsbn('9782070612758');

        $this->assertSame('Le Petit Prince', $result['titre']);
        $this->assertSame('Antoine de Saint-Exupéry', $result['auteur']);
        $this->assertSame('Gallimard', $result['editeur']);
        $this->assertSame(1943, $result['anneePublication']);
        // Vérification que l'URL est convertie en HTTPS
        $this->assertStringStartsWith('https://', $result['couvertureUrl']);
    }

    public function testRechercherIsbnInconnu(): void
    {
        $this->expectException(IsbnNotFoundException::class);

        $response = $this->makeResponse(200, ['totalItems' => 0]);
        $this->httpClient->method('request')->willReturn($response);

        $this->makeService()->rechercherParIsbn('9999999999999');
    }

    public function testRechercherIsbnTimeoutApi(): void
    {
        $this->expectException(GoogleBooksApiException::class);

        $transportException = $this->createMock(TransportExceptionInterface::class);

        $this->httpClient->method('request')->willThrowException($transportException);

        $this->makeService()->rechercherParIsbn('9782070612758');
    }

    public function testRechercherIsbnQuotaDepasse(): void
    {
        $this->expectException(GoogleBooksApiException::class);

        $response = $this->makeResponse(429, []);
        $this->httpClient->method('request')->willReturn($response);

        $this->makeService()->rechercherParIsbn('9782070612758');
    }

    public function testCleApiNonConfiguree(): void
    {
        $this->expectException(\RuntimeException::class);

        (new GoogleBooksService($this->httpClient, ''))->rechercherParIsbn('9782070612758');
    }

    public function testMappingMetadonnees(): void
    {
        $response = $this->makeResponse(200, [
            'totalItems' => 1,
            'items' => [[
                'volumeInfo' => [
                    'title'   => '1984',
                    'authors' => ['George Orwell'],
                ],
            ]],
        ]);
        $this->httpClient->method('request')->willReturn($response);

        $result = $this->makeService()->rechercherParIsbn('9780451524935');

        $this->assertArrayHasKey('isbn', $result);
        $this->assertArrayHasKey('titre', $result);
        $this->assertArrayHasKey('auteur', $result);
        $this->assertArrayHasKey('editeur', $result);
        $this->assertArrayHasKey('anneePublication', $result);
        $this->assertArrayHasKey('description', $result);
        $this->assertArrayHasKey('couvertureUrl', $result);
        $this->assertSame('9780451524935', $result['isbn']);
    }
}
