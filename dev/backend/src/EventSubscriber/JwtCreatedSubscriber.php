<?php

namespace App\EventSubscriber;

use App\Entity\Utilisateur;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class JwtCreatedSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            'lexik_jwt_authentication.on_jwt_created' => 'onJwtCreated',
        ];
    }

    public function onJwtCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof Utilisateur) {
            return;
        }

        $payload = $event->getData();
        $payload['role']            = $user->getRole();
        $payload['bibliotheque_id'] = $user->getBibliothequeId();

        $event->setData($payload);
    }
}
