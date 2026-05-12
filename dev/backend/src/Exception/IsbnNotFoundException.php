<?php

namespace App\Exception;

class IsbnNotFoundException extends \RuntimeException
{
    public function __construct(string $isbn)
    {
        parent::__construct(sprintf('Aucun livre trouvé pour l\'ISBN "%s" dans Google Books.', $isbn));
    }
}
