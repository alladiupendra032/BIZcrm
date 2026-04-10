-- ============================================================
-- Business CRM & Operations Management System
-- Phase 1 — Complete Supabase Database Schema
-- 
-- HOW TO USE:
-- 1. Go to https://supabase.com → your project
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste THIS ENTIRE FILE
-- 5. Click "Run" (or press Ctrl+Enter)
-- ============================================================


-- ============================================================
-- STEP 1: CREATE ALL 6 TABLES
-- ============================================================

-- 1. organizations
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. users (extends Supabase Auth — one row per auth user)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  email           TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'Admin'
                  CHECK (role IN ('Admin', 'Manager', 'Team Member')),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL
);

-- 3. customers
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  company         TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'Lead'
                  CHECK (status IN ('Lead', 'Active', 'Closed')),
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. deals
CREATE TABLE IF NOT EXISTS deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID REFERENCES customers(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  value               DECIMAL(12, 2),
  stage               TEXT NOT NULL DEFAULT 'New'
                      CHECK (stage IN ('New', 'Contacted', 'Negotiation', 'Won', 'Lost')),
  expected_close_date DATE,
  assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5. tasks
CREATE TABLE IF NOT EXISTS tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  assigned_to      UUID REFERENCES users(id) ON DELETE SET NULL,
  related_customer UUID REFERENCES customers(id) ON DELETE SET NULL,
  related_deal     UUID REFERENCES deals(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  due_date         TIMESTAMPTZ,
  organization_id  UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 6. activity_log
CREATE TABLE IF NOT EXISTS activity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY ON ALL 6 TABLES
-- ============================================================

ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 3: HELPER FUNCTION (used by RLS policies)
-- ============================================================

-- Returns the organization_id of the currently logged-in user
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$;


-- ============================================================
-- STEP 4: RLS POLICIES
-- ============================================================

-- ── organizations ──────────────────────────────────────────

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = get_my_org_id() OR owner_id = auth.uid());

CREATE POLICY "Org owner can update organization"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Allow insert during signup"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());


-- ── users ──────────────────────────────────────────────────

CREATE POLICY "Users can view teammates in same org"
  ON users FOR SELECT
  USING (organization_id = get_my_org_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Allow insert during signup"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());


-- ── customers ──────────────────────────────────────────────

CREATE POLICY "Org members can view customers"
  ON customers FOR SELECT
  USING (organization_id = get_my_org_id());

CREATE POLICY "Org members can insert customers"
  ON customers FOR INSERT
  WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "Org members can update customers"
  ON customers FOR UPDATE
  USING (organization_id = get_my_org_id());

CREATE POLICY "Only Admin can delete customers"
  ON customers FOR DELETE
  USING (
    organization_id = get_my_org_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
  );


-- ── deals ──────────────────────────────────────────────────

CREATE POLICY "Org members can view deals"
  ON deals FOR SELECT
  USING (organization_id = get_my_org_id());

CREATE POLICY "Admin and Manager can insert deals"
  ON deals FOR INSERT
  WITH CHECK (
    organization_id = get_my_org_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

CREATE POLICY "Admin and Manager can update deals"
  ON deals FOR UPDATE
  USING (
    organization_id = get_my_org_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'Manager')
  );

CREATE POLICY "Only Admin can delete deals"
  ON deals FOR DELETE
  USING (
    organization_id = get_my_org_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
  );


-- ── tasks ──────────────────────────────────────────────────

CREATE POLICY "Tasks visible based on role"
  ON tasks FOR SELECT
  USING (
    organization_id = get_my_org_id()
    AND (
      (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'Manager')
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Org members can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (organization_id = get_my_org_id());

CREATE POLICY "Users can update their tasks or Admins/Managers"
  ON tasks FOR UPDATE
  USING (
    organization_id = get_my_org_id()
    AND (
      assigned_to = auth.uid()
      OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Only Admin can delete tasks"
  ON tasks FOR DELETE
  USING (
    organization_id = get_my_org_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
  );


-- ── activity_log ───────────────────────────────────────────

CREATE POLICY "Org members can view activity log"
  ON activity_log FOR SELECT
  USING (organization_id = get_my_org_id());

CREATE POLICY "System can insert activity log entries"
  ON activity_log FOR INSERT
  WITH CHECK (organization_id = get_my_org_id());


-- ============================================================
-- STEP 5: PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_org          ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org      ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_status   ON customers(status);
CREATE INDEX IF NOT EXISTS idx_deals_org          ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage        ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_customer     ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org          ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned     ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_org       ON activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_created   ON activity_log(created_at DESC);


-- ============================================================
-- STEP 6: VERIFY — Run this after everything above to confirm
-- ============================================================

-- Should return 6 rows, ALL with rowsecurity = true
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'users',
    'customers',
    'deals',
    'tasks',
    'activity_log'
  )
ORDER BY tablename;
