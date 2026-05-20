# BiblioTech - Frontend Setup Guide

## Prerequisites

- Node.js 18+ & npm
- React 18+
- TypeScript

## Installation

### 1. Install Dependencies

```bash
cd dev/frontend
npm install
```

### 2. Environment Configuration

Create `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=BiblioTech
```

### 3. Development Server

```bash
# Start dev server with hot reload
npm run dev

# Server runs at: http://localhost:5173
```

### 4. Build for Production

```bash
npm run build

# Output in: dist/
```

## Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── Badge.tsx
│   ├── DataTable.tsx
│   ├── ErrorAlert.tsx
│   ├── LoadingState.tsx
│   └── ...
├── pages/          # Main application pages
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Catalogue.tsx    # Book management
│   ├── Adherents.tsx    # User management
│   ├── Prets.tsx        # Loan management
│   └── ...
├── services/       # API communication layer
│   ├── api.ts            # Axios instance
│   ├── livreService.ts
│   ├── exemplaireService.ts
│   ├── pretService.ts
│   └── utilisateurService.ts
├── hooks/          # Custom React hooks
│   ├── useAuth.ts       # Authentication context
│   ├── useApiCall.ts    # API data fetching
│   └── ...
├── types/          # TypeScript interfaces
│   └── index.ts
└── App.tsx         # Root component
```

## Key Pages

### Login
- Email + password authentication
- JWT token storage in localStorage
- Role-based redirect to dashboard

### Dashboard
- Statistics (total books, users, loans)
- Recent activity
- Quick links to main features
- Role-specific data visibility

### Catalogue
- List all books with search/filter
- Create/Edit/Delete books
- Manage book copies (exemplaires)
- Google Books ISBN search integration

### Adhérents (Users)
- List and manage users
- Create/Edit/Delete users
- Role assignment (admin, bibliothecaire, adherent)
- Status management (active/inactive)

### Prêts (Loans)
- View all loans with status filtering
- Create new loans
- Register book returns
- View overdue loans (staff view)
- Members see only their loans

## Components

### Badge
- Display status/role with color coding
- Variants: info, success, warning, danger, neutral

### DataTable
- Sortable columns
- Row selection
- Responsive design
- Empty state handling

### ErrorAlert
- Display error messages
- Dismissible with action callback
- Color-coded styling

### LoadingState
- Skeleton loader appearance
- Customizable message
- Smooth animations

### BottomSheet
- Mobile detail panel
- Animated slide-up from bottom
- Responsive design

## Services

### API Layer (services/)

All services follow the same pattern:

```typescript
// Example: livreService.ts
export const livreService = {
  getAll: () => api.get<Livre[]>('/api/livres'),
  getById: (id) => api.get<Livre>(`/api/livres/${id}`),
  create: (data) => api.post<Livre>('/api/livres', data),
  update: (id, data) => api.put<Livre>(`/api/livres/${id}`, data),
  delete: (id) => api.delete(`/api/livres/${id}`),
}
```

### useAuth Hook
- Current user info
- Token management
- Logout functionality
- Role checking

```typescript
const { user, token, logout } = useAuth()
if (user?.role === 'admin') { ... }
```

### useApiCall Hook
- Fetch data with loading/error states
- Auto-refetch capability
- Error handling

```typescript
const { data, loading, error, refetch } = useApiCall(
  () => livreService.getAll()
)
```

## Form Validation

### Current Validation
- Required field checks
- Email format validation (basic)
- ISBN required for books
- Duplicate checking (email, ISBN)

### Enhancement Opportunities
- Regex patterns for ISBN (ISBN-10/13)
- Phone number formatting
- Code exemplaire patterns
- Date range validation for loans

## Styling

- Tailwind CSS for utility classes
- Custom color palette (blue, red, green tones)
- Responsive breakpoints (mobile-first)
- Smooth transitions via Framer Motion

## Authentication Flow

1. User submits email + password on `/login`
2. Backend returns JWT token
3. Token stored in localStorage
4. Token added to all API requests via Authorization header
5. Protected routes redirect to login if no token
6. Token refresh on API 401 response (if implemented)

## Error Handling

- API errors display in ErrorAlert component
- Form validation errors shown inline
- Network errors caught and displayed
- Confirmation modals for destructive actions

## Performance Optimization

- Memoization of filtered lists (useMemo)
- Conditional component rendering
- Lazy loading of pages (code splitting ready)
- Efficient re-renders via React hooks

## Common Tasks

### Add a new page
1. Create `src/pages/NewPage.tsx`
2. Add route in `App.tsx`
3. Import components and services
4. Implement with error/loading states

### Add a new API call
1. Create/update service in `src/services/`
2. Use `useApiCall` hook in component
3. Handle loading and error states
4. Show ErrorAlert on failure

### Add form validation
1. Add validation in form handler function
2. Display error message
3. Prevent API call if validation fails
4. Clear error when user corrects input

## Testing

### Unit Tests (Jest)
```bash
npm run test

# Coverage
npm run test:coverage
```

### E2E Tests (Cypress)
```bash
npm run cypress

# Headless mode
npm run cypress:headless
```

## Build & Deployment

### Production Build
```bash
npm run build

# Output: dist/ folder
```

### Environment Variables for Prod
```
VITE_API_BASE_URL=https://api.production.com
VITE_APP_ENV=production
```

### Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

- Pagination not yet implemented in UI (data fetched in full)
- No offline support
- No notification/toast system (uses alerts)
- Limited date range filters

## Future Enhancements

- [ ] Toast notifications
- [ ] Pagination controls
- [ ] Advanced search/filters
- [ ] Bulk operations
- [ ] Export to CSV
- [ ] Multi-language support (i18n)
- [ ] Offline mode (PWA)

## Troubleshooting

### Port Already in Use
```bash
npm run dev -- --port 3000
```

### API Connection Issues
- Check `VITE_API_BASE_URL` in `.env`
- Ensure backend is running
- Check CORS headers from backend
- Open browser DevTools for error details

### TypeScript Errors
```bash
npm run type-check
```

### Build Errors
```bash
npm run build -- --debug
```

## Development Tips

- Use React DevTools browser extension
- Use Redux/Zustand DevTools (if state management added)
- Check Network tab in DevTools for API calls
- Use VS Code TypeScript language features

## Contact & Support

For issues or questions, refer to the project documentation or contact the development team.
