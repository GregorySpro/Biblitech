# Note de sécurité — BiblioTech

> Document interne — Analyse des vulnérabilités identifiées et mesures correctives appliquées.
> **Version 2.0** — Audit complet post-Jalon 5 + Jalon 6
> Date : 2026-07-06

---

## Résumé exécutif

L'audit du code source (2 sessions, Jalon 5 + Jalon 6) a identifié **14 vulnérabilités** confirmées. Toutes les vulnérabilités critiques et hautes ont été corrigées. Le projet présente un niveau de sécurité **satisfaisant pour un contexte académique** après application des correctifs. 3 risques résiduels sont documentés et acceptés pour ce contexte.

| Sévérité | Nb identifiées | Nb corrigées | Risque résiduel documenté |
|---|---|---|---|
| Critique | 1 | 1 | — |
| Haute | 6 | 6 | — |
| Moyenne | 7 | 5 | 2 (acceptés) |
| Faible | 0 | 0 | 1 (accepté) |

---

## Vulnérabilités corrigées — Session Jalon 5 (patch initial)

### CVE-B01 — Crash PHP sur le retour de prêt *(Critique)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/PretController.php` |
| Sévérité | Critique |
| Type | Undefined variable |

**Description :** La méthode `retour()` utilisait la variable `$request` sans la déclarer dans sa signature. Tout appel à `PATCH /api/prets/{id}/retour` provoquait un crash PHP.

**Correctif :** Ajout du paramètre `Request $request` dans la signature de la méthode.

---

### CVE-B02 — Exposition de toutes les bibliothèques à tout utilisateur authentifié *(Haute)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/BibliothequeController.php` |
| Sévérité | Haute — Fuite d'informations |

**Correctif :** Les non-super_admin ne voient que les bibliothèques actives.

---

### CVE-B03 — Élévation de privilège à la création d'utilisateur *(Haute)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/UtilisateurController.php` |
| Sévérité | Haute — Privilege escalation |

**Correctif :** Admin limité aux rôles adherent/bibliothecaire/admin dans sa propre bibliothèque.

---

### CVE-B04 — Absence de validation de la force du mot de passe côté serveur *(Haute, partielle)*

**Correctif initial :** `validatePasswordStrength()` ajoutée sur `changePasswordFirstLogin()` et `updateMe()`.

**Correctif complémentaire (session Jalon 6) :** Étendue à `create()` et `update()`.

---

### CVE-B05 — Acceptation de CGU sans validation de la version *(Moyenne)*

**Correctif :** Validation contre `CguVersionRepository::findCurrentVersion()`.

---

### CVE-B06 — Isolation multi-tenant absente sur les prêts (create + retour) *(Haute)*

**Correctif :** Vérifications `bibliotheque_id` dans `PretController::create()` et `retour()`.

---

### CVE-B07 — Body `code_postal` vs `codePostal` *(Faible)*

**Correctif :** `BibliothequeController::create()` et `update()` corrigés en snake_case.

---

### CVE-B08 — Rate Limiter non connecté à AuthController *(Moyenne)*

**Correctif :** Injection de `RateLimiterFactory` dans `AuthController` avec vérification par IP avant tout traitement du login.

---

## Vulnérabilités corrigées — Session Jalon 6 (audit complet)

### CVE-B09 — Isolation multi-tenant manquante sur 4 méthodes UtilisateurController *(Haute)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/UtilisateurController.php` |
| Sévérité | Haute — Broken access control (OWASP A01) |
| Méthodes | `show()`, `update()`, `delete()`, `suspendrePrets()` |
| Confiance | 9/10 (confirmé par analyse multi-agents) |

**Description :** Un `admin` de la bibliothèque A pouvait accéder, modifier, supprimer ou suspendre n'importe quel utilisateur de la bibliothèque B. Les quatre méthodes ne vérifiaient que le *rôle* de l'acteur, pas la *bibliothèque* de la cible.

**Scénario d'exploitation :**
1. L'attaquant s'authentifie en tant qu'admin de la bibliothèque A (credentials légitimes).
2. Il énumère les IDs via `GET /api/utilisateurs/{id}` — aucun filtre bibliothèque ne bloque.
3. Il appelle `PUT /api/utilisateurs/42` avec `{"password": "Attacker1!"}` pour un utilisateur de la bibliothèque B.
4. Aucun contrôle n'échoue. L'attaquant possède maintenant le compte cible.
5. Si la cible est admin de la bibliothèque B, l'attaquant a pris le contrôle total d'une autre bibliothèque.

**Correctif :** Ajout d'un contrôle `bibliothequeId` après fetch de l'utilisateur cible dans les 4 méthodes :
```php
if ($user->getRole() !== 'super_admin' && $utilisateur->getBibliothequeId() !== $user->getBibliothequeId()) {
    return $this->json(['status' => 403, 'code' => 'ACCESS_DENIED', ...], Response::HTTP_FORBIDDEN);
}
```

---

### CVE-B10 — Validation du mot de passe absente dans `update()` et `create()` *(Moyenne)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/UtilisateurController.php:327` |
| Sévérité | Moyenne |
| Confiance | 8/10 |

**Description :** `PUT /api/utilisateurs/{id}` permettait à un admin de définir un mot de passe trivial (`"a"`) pour n'importe quel utilisateur de sa bibliothèque, sans validation de complexité ni notification à l'utilisateur concerné. `POST /api/utilisateurs` avait le même oubli.

**Correctif :**
- Appel à `validatePasswordStrength()` ajouté dans `update()` et `create()`
- `setMustChangePassword(true)` déclenché lors d'une réinitialisation admin, forçant le changement au prochain login

---

### CVE-B11 — Endpoint `byEmail` accessible aux adhérents (exposition de données personnelles) *(Moyenne)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/UtilisateurController.php:121` |
| Sévérité | Moyenne — Information disclosure / RGPD |
| Confiance | 8/10 |

**Description :** `GET /api/utilisateurs/by-email?email=...` n'avait aucune restriction de rôle. Un adhérent pouvait énumérer les membres de sa bibliothèque (nom, prénom, email, rôle, `prets_suspendus`, `mustChangePassword`) via recherche partielle par email, en boucle sur tous les préfixes possibles.

**Scénario :** `GET /api/utilisateurs/by-email?email=a` → liste jusqu'à 10 adhérents de la même bibliothèque avec leurs données personnelles et leur statut de suspension.

**Correctif :** Restriction de l'endpoint aux rôles `bibliothecaire`, `admin` et `super_admin`.

---

### CVE-B12 — Statut exemplaire non validé contre les valeurs autorisées *(Moyenne)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/ExemplaireController.php:116` |
| Sévérité | Moyenne — Corruption d'état métier |

**Description :** `ExemplaireController::create()` et `update()` acceptaient n'importe quelle chaîne comme valeur de `statut`. Un bibliothécaire pouvait créer un exemplaire avec `statut: 'emprunte'` sans créer de prêt associé, corrompant l'état du système et faussant les statistiques.

**Correctif :** Validation contre la whitelist `[STATUT_DISPONIBLE, STATUT_EMPRUNTE, STATUT_INDISPONIBLE]` dans les deux méthodes.

---

### CVE-B13 — Isolation multi-tenant absente sur `PretController::show()` et `byAdherent()` *(Moyenne)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/PretController.php:94` et `:80` |
| Sévérité | Moyenne — Cross-tenant data access |

**Description :** Un bibliothécaire de la bibliothèque A pouvait consulter le détail d'un prêt individuel (`GET /api/prets/{id}`) ou l'historique complet d'un adhérent d'une autre bibliothèque (`GET /api/prets/adherent/{id}`).

**Correctif :** Ajout du contrôle `bibliotheque_id` dans les deux méthodes.

---

### CVE-B14 — Auto-modification de mot de passe sans vérification du mot de passe actuel *(Haute)*

| Propriété | Valeur |
|---|---|
| Fichier | `src/Controller/UtilisateurController.php:353` |
| Sévérité | Haute — Account Takeover |
| Confiance | 9/10 (confirmé scan agent principal) |

**Description :** `PUT /api/utilisateurs/{id}` permettait à tout utilisateur authentifié de changer son propre mot de passe (`$user->getId() === $id`) **sans fournir le mot de passe actuel**. Contrairement à `PATCH /api/utilisateurs/me` qui exige `current_password`, la route admin ne l'imposait pas pour la modification de son propre compte.

**Scénario d'exploitation :**
1. L'attaquant compromet brièvement une session (token JWT volé, session partagée).
2. Il appelle `PUT /api/utilisateurs/{id_victime}` avec `{"password": "NewP@ss1"}`.
3. Aucune vérification du mot de passe actuel → le mot de passe est changé définitivement.
4. La victime perd accès à son compte, l'attaquant maintient un accès persistent même après expiration du token initial.

**Correctif :** Ajout d'un contrôle `current_password` dans `update()` lorsque `$user->getId() === $id`. Correction bonus : `setMustChangePassword(true)` ne s'applique maintenant que lors d'une réinitialisation par un admin d'un autre utilisateur (pas lors d'un auto-changement).

---

## Corrections de bugs silencieux

### BUG-01 — `mot_de_passe` vs `password` dans MonComptePage *(Non-security, mais critique)*

**Fichier :** `src/pages/MonComptePage.tsx:58`

Le frontend envoyait `{ mot_de_passe: newPwd }` mais le backend attendait `{ password: newPwd }`. Le changement de mot de passe depuis la page profil échouait silencieusement (réponse 200 sans modification réelle).

**Correctif :** Correction du nom de champ en `password`.

---

### BUG-02 — Redirect loop sur la garde CGU *(frontend)*

**Fichier :** `src/pages/ProtectedRoute.tsx`

La redirection CGU se déclenchait avant le chargement de la version courante (`currentVersion === null`), causant une boucle infinie.

**Correctif :** Ajout de la condition `currentVersion !== null` avant la comparaison.

---

## Risques résiduels acceptés (non corrigés, justification documentée)

### RR-01 — Enforcement frontend-only de `must_change_password` et CGU *(Moyen)*

**Description :** Les gardes `must_change_password` et `cgu_accepted_version` sont vérifiées dans `ProtectedRoute.tsx`. Un appel direct à l'API (curl, Postman) bypass ces gardes — le backend ne les rejette pas.

**Justification :** Contexte desktop Tauri. L'application n'est pas exposée au web public et n'est pas une API tierce. Un utilisateur technique qui bypasse le frontend pourrait exploiter ce vecteur, mais l'impact reste limité à son propre compte. Le correctif complet nécessiterait un kernel event listener Symfony — hors périmètre Jalon 6.

**Risque accepté :** Oui, pour ce contexte académique.

---

### RR-02 — JWT non invalidé côté serveur lors du logout *(Moyen)*

**Description :** `POST /api/logout` supprime le refresh token mais pas le JWT access token. Un JWT capturé reste valide jusqu'à expiration (configuré à 8h par défaut dans `lexik_jwt_authentication.yaml`).

**Justification :** Pattern classique des architectures stateless JWT. La fenêtre d'exploitation est liée au TTL. Le refresh token (30 jours) est bien invalidé. Un TTL de 8h est raisonnable pour un contexte académique desktop.

**Risque accepté :** Oui. Mitigation recommandée pour une mise en production réelle : réduire le TTL à 15-30 minutes + implémenter un blocklist Redis.

---

### RR-03 — Tokens JWT dans `localStorage` *(Faible en contexte Tauri)*

**Description :** Access token et refresh token stockés dans `localStorage` (accessibles par JS).

**Justification :** Application Tauri = contexte natif. `localStorage` dans Tauri n'est pas exposé au web cross-origin. Le risque XSS est très limité par rapport à une SPA web classique.

**Risque accepté :** Oui, pour ce contexte. Pour une SPA web publique, migration vers `HttpOnly` cookie recommandée.

---

## Ce qui reste acceptable (risque documenté — autres points)

| Point | Justification |
|---|---|
| JWT dans `localStorage` | Application Tauri (desktop natif). Pas exposée au web public. XSS très limité en contexte natif. |
| Clés JWT RSA | Correctement exclues du dépôt Git (double exclusion `.gitignore`). |
| Mots de passe en clair dans les fixtures | Fichier de test uniquement, non déployé en production. |
| Argon2id `memory_cost: 65536` | Conforme aux recommandations OWASP. |
| plaintext hasher en env test | Configuré dans `security.yaml` sous `when@test:` uniquement — n'impacte pas la production. |

---

## Couverture OWASP Top 10 (état final)

| Menace | Contre-mesure |
|---|---|
| **A01 Broken Access Control** | RBAC + isolation `bibliotheque_id` sur tous les endpoints sensibles (corrigé en session Jalon 6) |
| **A02 Cryptographic Failures** | Argon2id, RS256, HTTPS enforced |
| **A03 Injection** | Doctrine ORM uniquement, aucun SQL dynamique |
| **A04 Insecure Design** | Architecture stateless JWT, séparation frontend/backend |
| **A05 Security Misconfiguration** | `.env.local` non versionné, clés JWT hors code source, CORS via variable d'env |
| **A06 Vulnerable Components** | `composer audit` + `npm audit` (manuels) |
| **A07 Auth Failures** | Rate Limiter Symfony (IP) + verrou applicatif (5 tentatives / 15 min) |
| **A08 Data Integrity** | Validation entrées + whitelist statuts |
| **A09 Logging Failures** | Monolog sur tentatives échouées et accès refusés |
| **A10 SSRF** | Google Books API via `GoogleBooksService` — URL non paramétrable par l'utilisateur |

---

## Checklist finale avant soutenance

- [x] Clés JWT exclues du dépôt git
- [x] Variables d'environnement dans `.env.local` (non committé)
- [x] CORS configuré via variable d'environnement `CORS_ALLOW_ORIGIN`
- [x] HTTPS enforced sur les URLs de couvertures Google Books
- [x] Argon2id pour le hachage des mots de passe
- [x] Rate Limiter Symfony connecté à `AuthController`
- [x] Isolation multi-tenant sur tous les endpoints sensibles
- [x] Validation de force du mot de passe côté serveur (tous les endpoints)
- [x] Restriction `byEmail` au staff uniquement
- [x] Validation whitelist des statuts exemplaires
- [ ] Tests E2E de sécurité (Playwright) — Jalon 6
- [ ] Audit OWASP ZAP sur l'instance de production — Jalon 6
