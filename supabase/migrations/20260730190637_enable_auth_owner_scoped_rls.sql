/*
# Enable authentication & owner-scoped data isolation

## Purpose
Convert FarmIQ AI from a single-tenant anon-accessible demo into a multi-user
authenticated application. Each signed-in user sees only their own profile and
analyses. Shared reference data (crop / soil types) stays readable by all
authenticated users.

## Changes

1. `analysisrecords.user_id`
   - Add `DEFAULT auth.uid()` so inserts that omit user_id are auto-owned.
   - Set `NOT NULL` (existing demo rows already have a non-null user_id; any
     stray nulls are back-filled to the demo user first).
   - Replace the foreign key with `ON DELETE CASCADE` (a NOT NULL column cannot
     use `ON DELETE SET NULL`).

2. RLS policy migration (drop the previous anon-open policies first):
   - `users` → owner-scoped CRUD: `auth.uid() = id` for SELECT/INSERT/UPDATE/DELETE.
   - `referencedata` → authenticated read-only (shared reference data; no
     write policies, so authenticated clients cannot modify it).
   - `analysisrecords` → owner-scoped CRUD: `auth.uid() = user_id` for all verbs.

## Security
- All tables keep RLS enabled.
- Policies use `auth.uid()` (never `current_user`).
- `USING (true)` is used ONLY for the intentionally-shared `referencedata`
  SELECT, which is documented as shared reference data.

## Important Notes
1. Re-runnable: every `CREATE POLICY` is preceded by `DROP POLICY IF EXISTS`.
2. After this migration the anon-key client can no longer read/write data —
   a valid authenticated session is required. The frontend auth flow must be
   built alongside this migration (sign-in + sign-up UI).
3. `user_id` defaults to `auth.uid()`, so the frontend inserts analyses without
   passing an explicit owner.
*/

-- Back-fill any null user_id before constraining.
UPDATE analysisrecords
SET user_id = (SELECT id FROM users LIMIT 1)
WHERE user_id IS NULL;

ALTER TABLE analysisrecords ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE analysisrecords ALTER COLUMN user_id SET NOT NULL;

-- Replace FK with CASCADE (NOT NULL incompatible with SET NULL).
ALTER TABLE analysisrecords DROP CONSTRAINT IF EXISTS analysisrecords_user_id_fkey;
ALTER TABLE analysisrecords ADD CONSTRAINT analysisrecords_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ---------- users: owner-scoped ----------
DROP POLICY IF EXISTS "anon_select_users" ON users;
DROP POLICY IF EXISTS "anon_insert_users" ON users;
DROP POLICY IF EXISTS "anon_update_users" ON users;
DROP POLICY IF EXISTS "anon_delete_users" ON users;

DROP POLICY IF EXISTS "select_own_profile" ON users;
CREATE POLICY "select_own_profile" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON users;
CREATE POLICY "insert_own_profile" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON users;
CREATE POLICY "update_own_profile" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON users;
CREATE POLICY "delete_own_profile" ON users FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ---------- referencedata: shared read-only ----------
DROP POLICY IF EXISTS "anon_select_referencedata" ON referencedata;
DROP POLICY IF EXISTS "anon_insert_referencedata" ON referencedata;
DROP POLICY IF EXISTS "anon_update_referencedata" ON referencedata;
DROP POLICY IF EXISTS "anon_delete_referencedata" ON referencedata;

DROP POLICY IF EXISTS "select_referencedata" ON referencedata;
CREATE POLICY "select_referencedata" ON referencedata FOR SELECT
  TO authenticated USING (true);

-- ---------- analysisrecords: owner-scoped ----------
DROP POLICY IF EXISTS "anon_select_analysisrecords" ON analysisrecords;
DROP POLICY IF EXISTS "anon_insert_analysisrecords" ON analysisrecords;
DROP POLICY IF EXISTS "anon_update_analysisrecords" ON analysisrecords;
DROP POLICY IF EXISTS "anon_delete_analysisrecords" ON analysisrecords;

DROP POLICY IF EXISTS "select_own_analyses" ON analysisrecords;
CREATE POLICY "select_own_analyses" ON analysisrecords FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analyses" ON analysisrecords;
CREATE POLICY "insert_own_analyses" ON analysisrecords FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analyses" ON analysisrecords;
CREATE POLICY "update_own_analyses" ON analysisrecords FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_analyses" ON analysisrecords;
CREATE POLICY "delete_own_analyses" ON analysisrecords FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
