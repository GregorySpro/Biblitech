<?php

namespace App\Exception;

class ExemplaireUnavailableException extends \RuntimeException
{
    public function __construct(string $codeExemplaire)
    {
        parent::__construct(sprintf('L\'exemplaire "%s" n\'est pas disponible.', $codeExemplaire));
    }
}
