

## Problem

The `app_config` table has RLS that only allows superadmins to read/write. When any other user (or unauthenticated visitor) queries `maintenance_mode`, they get `null` back, so maintenance mode appears OFF for everyone except superadmins.

## Solution

Two changes needed:

### 1. Database: Add public read policy for maintenance_mode

Create a migration that adds a SELECT policy allowing anyone (anon + authenticated) to read the `maintenance_mode` row from `app_config`:

```sql
CREATE POLICY "Anyone can read maintenance mode"
ON public.app_config
FOR SELECT
TO anon, authenticated
USING (key = 'maintenance_mode');
```

This lets the MaintenanceGate query work for all users while keeping other config keys protected.

### 2. Code: Remove /auth bypass, block everyone except superadmin

In `src/App.tsx`, remove the bypass for `/auth` and `/superadmin` routes. When maintenance is ON and user is not superadmin, always show `MaintenanceScreen` — no exceptions, no navigation possible. This covers:
- Unauthenticated users → maintenance screen
- Regular authenticated users → maintenance screen  
- Superadmins → full access

Lines 118-121 change from allowing `/auth` and `/superadmin` to only allowing `/superadmin` (so you can still log in as superadmin to manage things).

