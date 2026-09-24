-- Lock down row-level security.
--
-- Game-state tables become read-only for users: XP, streaks, points, parts and
-- generated levels are written only by server routes using the service role
-- (which bypasses RLS). Without this, any signed-in user could write their own
-- scores, points, parts or level criteria straight from the browser with the
-- public anon key.
--
-- Deploy the app code that writes these tables with the service role BEFORE
-- running this, or scoring and purchases will fail to save.
--
-- Run in the Supabase SQL editor. Safe to re-run.

-- 1. Drop every existing policy on these tables so the end state is exactly
--    what's defined below, whatever was created by hand in the dashboard.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'xp_ledger', 'streaks', 'world_points', 'user_parts', 'game_assignments',
        'profiles', 'reflections', 'waitlist'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Make sure RLS is on everywhere.
ALTER TABLE public.xp_ledger        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_points     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_parts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist         ENABLE ROW LEVEL SECURITY;

-- 3. Game state: users can read their own rows; no user writes.
CREATE POLICY "Users read own xp_ledger"
  ON public.xp_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own streaks"
  ON public.streaks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own world_points"
  ON public.world_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own user_parts"
  ON public.user_parts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own game_assignments"
  ON public.game_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. Profiles: users manage their own row (name, bio, robot, game preferences).
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Reflections: users read and add their own.
CREATE POLICY "Users read own reflections"
  ON public.reflections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own reflections"
  ON public.reflections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. waitlist: no policies — only the service role (admin page/route) can access it.
