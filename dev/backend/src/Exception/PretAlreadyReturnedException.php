<?php

namespace App\Exception;

class PretAlreadyReturnedException extends \RuntimeException
{
    public function __construct(int $pretId)
    {
        parent::__construct(sprintf('Le prêt #%d a déjà été rendu.', $pretId));
    }
}
