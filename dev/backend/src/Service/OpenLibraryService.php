<?php

namespace App\Service;

use App\Exception\GoogleBooksApiException;
use App\Exception\IsbnNotFoundException;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class OpenLibraryService
{
    private const API_URL = 'https://openlibrary.org/api/books';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
    ) {
    }

    /**
     * Recherche un livre par ISBN via l'API Open Library.
     * Retourne un tableau de métadonnées prêt à pré-remplir un formulaire.
     *
     * @throws IsbnNotFoundException si l'ISBN n'est pas trouvé
     * @throws GoogleBooksApiException en cas d'erreur réseau ou d'API
     */
    public function rechercherParIsbn(string $isbn): array
    {
        try {
            $response = $this->httpClient->request('GET', self::API_URL, [
                'query' => [
                    'bibkeys' => 'ISBN:' . $isbn,
                    'format'  => 'json',
                    'jscmd'   => 'details',
                ],
                'timeout' => 5.0,
            ]);

            $statusCode = $response->getStatusCode();

            if ($statusCode !== 200) {
                throw new GoogleBooksApiException(
                    sprintf('Réponse inattendue de l\'API Open Library : HTTP %d', $statusCode),
                    503
                );
            }

            $data = $response->toArray();

            $key = 'ISBN:' . $isbn;
            if (empty($data[$key])) {
                throw new IsbnNotFoundException($isbn);
            }

            return $this->mapMetadonnees($isbn, $data[$key]);
        } catch (IsbnNotFoundException $e) {
            throw $e;
        } catch (GoogleBooksApiException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new GoogleBooksApiException('Erreur réseau ou timeout : ' . $e->getMessage(), 503);
        }
    }

    private function mapMetadonnees(string $isbn, array $entry): array
    {
        $details = $entry['details'] ?? [];

        $auteurs = $details['authors'] ?? [];
        $auteur  = !empty($auteurs)
            ? implode(', ', array_map(fn ($a) => $a['name'] ?? '', $auteurs))
            : null;

        $publishers = $details['publishers'] ?? [];
        $editeur    = !empty($publishers) ? $publishers[0] : null;

        $annee = null;
        if (!empty($details['publish_date'])) {
            preg_match('/\d{4}/', $details['publish_date'], $m);
            $annee = isset($m[0]) ? (int) $m[0] : null;
        }

        // Couverture : priorité au thumbnail Open Library, sinon URL canonique par ISBN
        $couverture = null;
        if (!empty($entry['thumbnail_url'])) {
            $couverture = str_replace(['-S.jpg', 'http://'], ['-M.jpg', 'https://'], $entry['thumbnail_url']);
        } else {
            $couverture = 'https://covers.openlibrary.org/b/isbn/' . $isbn . '-M.jpg';
        }

        $description = null;
        if (!empty($details['description'])) {
            $description = is_array($details['description'])
                ? ($details['description']['value'] ?? null)
                : $details['description'];
        }

        return [
            'isbn'             => $isbn,
            'titre'            => $details['title'] ?? $details['full_title'] ?? 'Titre inconnu',
            'auteur'           => $auteur,
            'editeur'          => $editeur,
            'anneePublication' => $annee,
            'description'      => $description,
            'couvertureUrl'    => $couverture,
        ];
    }
}
