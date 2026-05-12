<?php

namespace App\Service;

use App\Exception\GoogleBooksApiException;
use App\Exception\IsbnNotFoundException;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

class GoogleBooksService
{
    private const API_URL = 'https://www.googleapis.com/books/v1/volumes';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $apiKey,
    ) {
        if (empty($this->apiKey)) {
            throw new \RuntimeException('La variable d\'environnement GOOGLE_BOOKS_API_KEY n\'est pas configurée.');
        }
    }

    /**
     * Recherche un livre par ISBN via l'API Google Books.
     * Retourne un tableau de métadonnées prêt à pré-remplir un formulaire.
     *
     * @throws IsbnNotFoundException si l'ISBN n'est pas trouvé
     * @throws GoogleBooksApiException en cas d'erreur d'appel à l'API
     */
    public function rechercherParIsbn(string $isbn): array
    {
        try {
            $response = $this->httpClient->request('GET', self::API_URL, [
                'query' => [
                    'q'   => 'isbn:' . $isbn,
                    'key' => $this->apiKey,
                ],
                'timeout' => 5.0,
            ]);

            $statusCode = $response->getStatusCode();

            if ($statusCode === 429) {
                throw new GoogleBooksApiException('Quota Google Books API dépassé.', 429);
            }

            if ($statusCode !== 200) {
                throw new GoogleBooksApiException(sprintf('Réponse inattendue de l\'API : HTTP %d', $statusCode));
            }

            $data = $response->toArray();

            if (empty($data['items'])) {
                throw new IsbnNotFoundException($isbn);
            }

            return $this->mapMetadonnees($isbn, $data['items'][0]);
        } catch (TransportExceptionInterface $e) {
            throw new GoogleBooksApiException('Timeout ou erreur réseau : ' . $e->getMessage());
        }
    }

    private function mapMetadonnees(string $isbn, array $item): array
    {
        $info = $item['volumeInfo'] ?? [];

        $auteurs = $info['authors'] ?? [];
        $auteur  = !empty($auteurs) ? implode(', ', $auteurs) : null;

        $editeurs = $info['publisher'] ?? null;

        $annee = null;
        if (!empty($info['publishedDate'])) {
            $annee = (int) substr($info['publishedDate'], 0, 4);
        }

        $couverture = null;
        if (!empty($info['imageLinks']['thumbnail'])) {
            // Forcer HTTPS pour éviter les mixed content
            $couverture = str_replace('http://', 'https://', $info['imageLinks']['thumbnail']);
        }

        return [
            'isbn'            => $isbn,
            'titre'           => $info['title'] ?? 'Titre inconnu',
            'auteur'          => $auteur,
            'editeur'         => $editeurs,
            'anneePublication' => $annee,
            'description'     => $info['description'] ?? null,
            'couvertureUrl'   => $couverture,
        ];
    }
}
