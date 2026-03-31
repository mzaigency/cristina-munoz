

## Plan: Fix Redundant Re-authentication on Navigation

### Problem Identified

Every time you navigate within the admin panel (or between pages), the app triggers multiple redundant authentication checks that create a noticeable "loading/re-auth" feel:

1. **`MaintenanceGate` (App.tsx)** — Re-runs on every `location.pathname` change: calls `getSession()`, queries `app_config`, and checks `user_roles`. This means switching tabs within admin triggers a full maintenance check.

2. **`TenantAdmin.checkAuth()`** — Runs on mount with `[slug]` dependency. Makes 4+ sequential DB queries (getSession → tenant → superadmin role → tenant_admins → tenant_stylists). The slug doesn't change between tab switches, but if the component remounts it re-runs everything.

3. **`useTenantAccess` hook** — Also called in TenantAdmin, performs the same superadmin/admin/stylist checks independently, duplicating queries.

4. **`useCurrentUserTenant` hook** — Used in Index and other pages, performs yet another round of the same queries (tenant_admins, tenant_stylists).

5. **`onAuthStateChange` listener in MaintenanceGate** — Sets state to `null` on any auth event (including `TOKEN_REFRESHED`), causing a full re-render with loading spinner while re-checking maintenance mode.

### Root Cause
There's no centralized auth/session state. Each component independently calls `getSession()` and runs DB queries, causing:
- Visible loading spinners on every navigation
- 10-15+ redundant Supabase queries per page transition
- The `TOKEN_REFRESHED` event in MaintenanceGate resets to loading state, causing a flash

### Solution

**1. Fix MaintenanceGate — Stop re-checking on every pathname change**
- Remove `location.pathname` from the `useEffect` dependency — maintenance mode doesn't change per-route
- Check once on mount, then only re-check on auth state changes
- Filter `onAuthStateChange` to only react to `SIGNED_IN` and `SIGNED_OUT`, not `TOKEN_REFRESHED` or `INITIAL_SESSION`

**2. Consolidate TenantAdmin auth — Remove duplicate checks**
- `TenantAdmin.checkAuth()` and `useTenantAccess()` do the same queries. Remove the manual `checkAuth` logic and rely solely on `useTenantAccess` (which already returns `isAdmin`, `isStylist`, `hasAccess`, `loading`)
- Pass the tenant lookup separately (just fetch tenant by slug, no auth checks)

**3. Stabilize `useCurrentUserTenant` cache**
- The global cache is already implemented but the `checkCache` async function has a race condition — it awaits `getSession()` before checking cache validity, adding latency. Use a synchronous cache check first.

**4. Filter auth events in `useCurrentUserTenant`**
- Currently reacts to `TOKEN_REFRESHED` by clearing cache and re-querying. This is unnecessary — the user hasn't changed. Only clear on `SIGNED_IN` / `SIGNED_OUT`.

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` (MaintenanceGate) | Remove `location.pathname` dep, filter auth events |
| `src/pages/TenantAdmin.tsx` | Replace manual `checkAuth` with `useTenantAccess` + simple tenant fetch |
| `src/hooks/useCurrentUserTenant.ts` | Remove `TOKEN_REFRESHED` from cache-clearing events, sync cache check |
| `src/hooks/useTenantAccess.ts` | Minor: add caching to avoid re-querying on re-renders |

### Expected Result
- No more loading flickers when switching admin tabs
- No re-auth feel when navigating between pages
- ~70% fewer Supabase queries per navigation
- Instant tab switches within admin panel

