<?php

namespace App\Exception;

class GoogleBooksApiException extends \RuntimeException
{
    public function __construct(string $reason, int $code = 500)
    {
        parent::__construct(sprintf('Google Books API error: %s', $reason), $code);
    }
}
