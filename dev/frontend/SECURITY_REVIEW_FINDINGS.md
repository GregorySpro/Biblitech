# Security & Code Review - Action Plan
**BiblioTech API Integration Layer**
**Date:** 2026-05-20
**Status:** 37 Issues Found - Prioritization in Progress

---

## CRITICAL ISSUES (Must fix before production)

### Phase 1 - Code Compilation & Type Safety

- [ ] **Fix undefined variables in DashboardPage.tsx**
  - [ ] Line 62: Declare `MonPretRow` type
  - [ ] Line 122-123: Declare `selectedPret` and `setSelectedPret` state
  - [ ] Lines 163, 219, 223, 236: Import or remove references to undefined mock data

- [ ] **Fix unsafe type casting**
  - [ ] PretsPage.tsx Line 83-84: Replace `as unknown as PretRow[]` with validation function
  - [ ] Create TypeScript type guard for API response validation

- [ ] **Implement missing onClick handlers**
  - [ ] CataloguePage: "Rechercher" button (Google Books ISBN search)
  - [ ] CataloguePage: "Ajouter un livre" button
  - [ ] PretsPage: "Nouveau prêt" button
  - [ ] PretsPage: "Enregistrer le retour" button
  - [ ] AdherentsPage: "Ajouter un adhérent" button
  - [ ] AdherentsPage: "Modifier" button
  - [ ] AdherentsPage: "Supprimer" button

- [ ] **Replace mock data with real API data**
  - [ ] AdherentsPage.tsx Line 91: Use real data for user count
  - [ ] DashboardPage.tsx Lines 128-130: Transform myPrets into display format
  - [ ] DashboardPage.tsx Lines 162, 219, 223, 236: Use real allPrets data

- [ ] **Add error display to all pages**
  - [ ] Import ErrorAlert component
  - [ ] CataloguePage: Display `error` state
  - [ ] PretsPage: Display `error` state
  - [ ] AdherentsPage: Display `error` state
  - [ ] DashboardPage: Display `error` states

### Phase 2 - Input Validation

- [ ] **Add validation to all API services** (IN PROGRESS)
  - [x] livreService.ts - Added validation
  - [x] pretService.ts - Added validation
  - [ ] utilisateurService.ts - Add validation
  - [ ] statsService.ts - Add validation

- [ ] **Add ISBN validation**
  - [ ] CataloguePage: Validate ISBN format before API call
  - [ ] Prevent empty searches

- [ ] **Add search parameter validation**
  - [ ] Validate search string length
  - [ ] Prevent SQL injection patterns
  - [ ] Sanitize user input

### Phase 3 - Error Handling & UX

- [ ] **Add LoadingState component to pages**
  - [ ] CataloguePage: Show spinner when loading
  - [ ] PretsPage: Show spinner when loading
  - [ ] AdherentsPage: Show spinner when loading
  - [ ] DashboardPage: Show spinners for stats and tables

- [ ] **Add error messages to buttons during loading**
  - [ ] Disable buttons during API calls
  - [ ] Show loading state on button with spinner

- [ ] **Implement specific error messages**
  - [ ] Replace generic "Erreur" with detailed messages
  - [ ] Handle network errors
  - [ ] Handle 401 unauthorized
  - [ ] Handle 403 forbidden
  - [ ] Handle 404 not found
  - [ ] Handle 500 server errors

- [ ] **Add retry mechanisms**
  - [ ] Retry button on error state
  - [ ] Manual refetch capability

---

## HIGH PRIORITY ISSUES

### RGPD Compliance

- [ ] **Add data deletion confirmation dialog**
  - [ ] utilisateurService.delete() should require explicit confirmation
  - [ ] Show what will happen (soft delete/anonymization)
  - [ ] Get user consent before deletion

- [ ] **Add audit logging**
  - [ ] Log all sensitive data access
  - [ ] Log all deletions with timestamps
  - [ ] Log CRUD operations

- [ ] **Add data export feature**
  - [ ] Create endpoint to export user's personal data
  - [ ] Implement "Download My Data" button
  - [ ] Support Article 20 GDPR (data portability)

### Security

- [ ] **Implement client-side authorization checks**
  - [ ] Verify RBAC on sensitive pages
  - [ ] Redirect non-authorized users
  - [ ] Show permission denied message

- [ ] **Add CORS error handling**
  - [ ] Catch CORS errors specifically
  - [ ] Show user-friendly error message
  - [ ] Log CORS violations

- [ ] **Implement token refresh mechanism**
  - [ ] Add refresh token support
  - [ ] Automatically refresh before expiration
  - [ ] Handle 401 with grace

### Code Quality

- [ ] **Remove all console.log statements**
  - [ ] CataloguePage: Check for console logs
  - [ ] PretsPage: Check for console logs
  - [ ] AdherentsPage: Check for console logs
  - [ ] DashboardPage: Check for console logs
  - [ ] All service files: Check for console logs

- [ ] **Fix optional chaining inconsistency**
  - [ ] CataloguePage: Add null checks to all data access
  - [ ] PretsPage: Consistent optional chaining
  - [ ] Add default values where needed

---

## MEDIUM PRIORITY ISSUES

- [ ] Implement request deduplication
- [ ] Add debouncing for search
- [ ] Fix useApiCall infinite loop risk (useEffect)
- [ ] Implement i18n for French text
- [ ] Add email masking for privacy
- [ ] Create validation type guards
- [ ] Add comprehensive logging
- [ ] Implement rate limiting on client

---

## DEFERRED (Can wait for Jalon 6)

- [ ] Hardcoded French text → i18n
- [ ] Email privacy masking
- [ ] Advanced audit trails
- [ ] Advanced rate limiting
- [ ] Data privacy regulations (beyond RGPD)

---

## File-by-File Status

| File | Issues | Priority | Status |
|------|--------|----------|--------|
| CataloguePage.tsx | 5 | CRITICAL | Pending fix |
| PretsPage.tsx | 6 | CRITICAL | Pending fix |
| AdherentsPage.tsx | 4 | CRITICAL | Pending fix |
| DashboardPage.tsx | 8 | CRITICAL | Pending fix |
| livreService.ts | 1 | CRITICAL | ✅ FIXED |
| pretService.ts | 1 | CRITICAL | ✅ FIXED |
| utilisateurService.ts | 2 | HIGH | Pending fix |
| authService.ts | 1 | HIGH | Pending fix |
| statsService.ts | 1 | HIGH | Pending fix |
| useApiCall.ts | 2 | CRITICAL | ✅ FIXED |
| api.ts | 2 | HIGH | Pending fix |

---

## Tests Required After Fixes

- [ ] CataloguePage loads real books
- [ ] ISBN search functional
- [ ] PretsPage displays real loans
- [ ] Return functionality works
- [ ] AdherentsPage shows real users
- [ ] Error messages display correctly
- [ ] Loading states appear
- [ ] Button handlers functional
- [ ] RGPD deletion flow works
- [ ] Invalid inputs rejected

---

## Security Audit Checklist

- [ ] No console.log in production code
- [ ] All errors handled gracefully
- [ ] Input validation on all API calls
- [ ] Type safety - no unsafe casting
- [ ] RGPD compliance
- [ ] Error messages don't leak sensitive info
- [ ] No hardcoded credentials
- [ ] CORS properly configured
- [ ] RBAC enforced on backend
- [ ] Rate limiting in place
