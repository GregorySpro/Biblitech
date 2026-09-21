<?php

namespace App\Exception;

class PretMaxReachedException extends \RuntimeException
{
    public function __construct(int $max)
    {
        parent::__construct(sprintf('L\'adhérent a atteint le nombre maximum de %d prêts simultanés.', $max));
    }
}
