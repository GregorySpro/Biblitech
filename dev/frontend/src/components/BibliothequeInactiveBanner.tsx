import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'

export function BibliothequeInactiveBanner() {
  const { user } = useAuth()

  // Le super_admin n'a pas de bibliothèque, le flag n'est pas dans le JWT
  // On utilise une convention : si la bibliothèque est inactive, le JWT contient un flag via un custom claim
  // Pour l'instant ce composant sert de placeholder — la logique sera enrichie avec un endpoint dédié
  if (!user) return null

  // La suspension est vérifiée côté backend à chaque opération
  // Ce bandeau s'affiche si l'adhérent a ses prêts suspendus
  if (!user.prets_suspendus) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-amber-600" />
      <span>
        Vos prêts sont actuellement suspendus en raison de retards non régularisés.
        Contactez votre bibliothèque pour plus d'informations.
      </span>
    </div>
  )
}
