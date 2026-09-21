<?php

namespace App\Exception;

class PretAlreadyReturnedException extends \RuntimeException
{
    public function __construct(?int $pretId)
    {
        parent::__construct($pretId !== null ? sprintf('Le prêt #%d a déjà été rendu.', $pretId) : 'Ce prêt a déjà été rendu.');
    }
}
