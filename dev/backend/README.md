# BiblioTech - Backend Setup Guide

## Prerequisites

- PHP 8.2+
- Composer
- PostgreSQL 14+
- Docker & Docker Compose (optional, for containerized setup)

## Installation

### 1. Install Dependencies

```bash
cd dev/backend
composer install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - RS256 private key for JWT signing (generate if needed)
- `JWT_PUBLIC_KEY` - RS256 public key for JWT verification
- `APP_ENV=dev` for development

### 3. Generate JWT Keys (if needed)

```bash
# Generate RS256 key pair
mkdir -p config/jwt
openssl genpkey -algorithm RSA -out config/jwt/private.pem -pkeyopt rsa_keygen_bits:2048
openssl pkey -in config/jwt/private.pem -pubout -out config/jwt/public.pem

# Update .env with key paths
```

### 4. Database Setup

```bash
# Create database
php bin/console doctrine:database:create

# Run migrations
php bin/console doctrine:migrations:migrate

# Load fixtures (optional test data)
php bin/console doctrine:fixtures:load
```

### 5. Start Development Server

```bash
# Using Symfony CLI
symfony serve

# Or using PHP built-in server
php -S 127.0.0.1:8000 -t public

# Server runs at: http://localhost:8000
```

## API Endpoints

### Authentication
- `POST /api/login` - Login (email + password)
- `POST /api/logout` - Logout
- `POST /api/refresh` - Refresh JWT token

### Books (Livres)
- `GET /api/livres` - List all books
- `GET /api/livres/{id}` - Get book details
- `GET /api/livres/isbn/{isbn}` - Search by ISBN (Google Books integration)
- `POST /api/livres` - Create book (bibliothecaire+)
- `PUT /api/livres/{id}` - Update book (bibliothecaire+)
- `DELETE /api/livres/{id}` - Delete book (admin+)

### Book Copies (Exemplaires)
- `GET /api/exemplaires?livreId={id}` - List copies for a book
- `GET /api/exemplaires/{id}` - Get copy details
- `POST /api/exemplaires` - Create copy (bibliothecaire+)
- `PUT /api/exemplaires/{id}` - Update copy status (bibliothecaire+)
- `DELETE /api/exemplaires/{id}` - Delete copy (admin+)

### Users (Utilisateurs)
- `GET /api/utilisateurs/me` - Get current user
- `GET /api/utilisateurs` - List users (admin+)
- `GET /api/utilisateurs/{id}` - Get user details
- `POST /api/utilisateurs` - Create user (admin+)
- `PUT /api/utilisateurs/{id}` - Update user
- `DELETE /api/utilisateurs/{id}` - Delete/anonymize user (admin+)

### Loans (Prêts)
- `GET /api/prets` - List all loans
- `GET /api/prets/{id}` - Get loan details
- `GET /api/prets/adherent/{id}` - List loans for member
- `GET /api/prets/retards` - List overdue loans
- `POST /api/prets` - Create loan (bibliothecaire+)
- `PATCH /api/prets/{id}/retour` - Register return

### Libraries (Bibliothèques)
- `GET /api/bibliotheques` - List libraries (super_admin only)
- `GET /api/bibliotheques/{id}` - Get library details
- `POST /api/bibliotheques` - Create library (super_admin only)
- `PUT /api/bibliotheques/{id}` - Update library (admin+)
- `DELETE /api/bibliotheques/{id}` - Delete library (super_admin only)
- `PATCH /api/bibliotheques/{id}/activer` - Toggle library active status (super_admin only)

## Role-Based Access Control (RBAC)

### Roles
- **super_admin**: Full system access, multi-library management
- **admin**: Library administration, user management
- **bibliothecaire**: Content management (books, copies, loans)
- **adherent**: Read-only access to catalog, view own loans

## Testing

### Run All Tests
```bash
php bin/phpunit
```

### Run Specific Test Suite
```bash
# Controller tests
php bin/phpunit tests/Integration/Controller/

# Service tests
php bin/phpunit tests/Unit/Service/
```

### Coverage Report
```bash
php bin/phpunit --coverage-html coverage/
```

## Architecture

### Directory Structure
```
src/
├── Controller/       # API endpoints
├── Entity/          # Doctrine entities
├── Repository/      # Database queries
├── Service/         # Business logic
└── Security/        # JWT, authentication

tests/
├── Integration/     # API endpoint tests
└── Unit/           # Service unit tests
```

### Key Features
- **Multi-tenant isolation**: Users only see data from their library
- **RGPD compliance**: User deletion anonymizes data if loans exist
- **JWT RS256 authentication**: Stateless, scalable auth
- **Permission checks**: Every endpoint validates user roles
- **Google Books API**: Search and import book metadata by ISBN

## Database Schema

Key entities:
- `Utilisateur` - Users with roles and library assignment
- `Bibliotheque` - Library organizations
- `Livre` - Book catalog
- `Exemplaire` - Physical book copies
- `Pret` - Loan tracking with status (en_cours, rendu, en_retard)

## Troubleshooting

### JWT Token Issues
- Ensure keys are in `config/jwt/` with correct permissions
- Verify `JWT_SECRET_KEY` and `JWT_PUBLIC_KEY` in `.env`

### Database Connection
- Check `DATABASE_URL` format: `postgresql://user:pass@host/db`
- Ensure PostgreSQL is running

### Permission Denied Errors
- Verify user role has access to the endpoint
- Check if user belongs to the correct library (multi-tenant isolation)

## Development Commands

```bash
# Create new migration
php bin/console make:migration

# Load test fixtures
php bin/console doctrine:fixtures:load --append

# Clear cache
php bin/console cache:clear

# List all routes
php bin/console debug:router
```

## Security Notes

- All endpoints require Bearer token authentication (except /api/login)
- Passwords are hashed using Argon2i
- SQL injection prevented via Doctrine ORM
- CSRF protection via framework defaults
- RGPD: User deletion anonymizes personal data if loans exist

## Contact & Support

For issues or questions, refer to the project documentation or contact the development team.
