# BiblioTech

Application desktop de gestion de bibliothèques multi-tenant.

## Stack technique

- **Backend** : Symfony 7 + API Platform + PHP 8.3
- **Frontend** : React 18 + Tailwind CSS + Tauri
- **Base de données** : PostgreSQL (Supabase)
- **Auth** : JWT (LexikJWTAuthenticationBundle)
- **Containerisation** : Docker + Docker Compose

## Structure du projet

```
dev/
├── backend/          # API Symfony
│   ├── src/
│   │   ├── Controller/   # Points d'entrée HTTP (routes /api/*)
│   │   ├── Entity/       # Entités Doctrine (= tables PostgreSQL)
│   │   ├── Repository/   # Accès aux données
│   │   ├── Service/      # Logique métier
│   │   └── DTO/          # Data Transfer Objects
│   ├── config/           # Configuration Symfony
│   └── migrations/       # Migrations Doctrine
├── frontend/         # Application React + Tauri
│   └── src/
│       ├── components/   # Composants React réutilisables
│       ├── pages/        # Pages (une par route)
│       ├── hooks/        # Custom hooks React
│       ├── services/     # Appels API (axios)
│       └── context/      # Contextes React (auth, etc.)
└── docker/           # Fichiers Docker Compose
```

## Lancer le projet (à venir)

```bash
cd dev/
docker-compose up -d
```

## Jalons

| Jalon | Mois | Statut |
|---|---|---|
| 1 – CDCF | Janvier 2026 | ✅ Livré |
| 2 – UI/UX & Méthodo | Février 2026 | ✅ Livré |
| 3 – Modélisation BDD | Mars 2026 | ✅ Livré |
| 4 – Conception & Architecture | Avril 2026 | ✅ Livré |
| 5 – Développement & Tests | Mai 2026 | 🔄 En cours |
| 6 – Finalisation & Déploiement | Juin 2026 | ⏳ À venir |
