-- ============================================================================
-- TRACKED DATABASE SCHEMA
-- Version: 00001
-- Description: Initial schema for Tracked hobby tracking app
-- Tables: profiles, hobbies, hobby_logs, follows
-- All tables have RLS enabled with appropriate policies
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE
-- Stores user profile information, linked to Supabase auth.users
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS immediately
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Indexes for RLS policy columns
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_public ON profiles(is_public);

-- Policy: Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated, anon
USING (is_public = true);

-- Policy: Users can view their own profile (even if private)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- Policy: Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- HOBBIES TABLE
-- Stores user hobbies with tracking type (time or quantity)
-- ============================================================================
CREATE TABLE hobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tracking_type TEXT NOT NULL CHECK (tracking_type IN ('time', 'quantity')),
  goal_total INTEGER,
  goal_unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS immediately
ALTER TABLE hobbies ENABLE ROW LEVEL SECURITY;

-- Indexes for RLS policy columns
CREATE INDEX idx_hobbies_id ON hobbies(id);
CREATE INDEX idx_hobbies_user_id ON hobbies(user_id);

-- Policy: Users can view their own hobbies
CREATE POLICY "Users can view own hobbies"
ON hobbies FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy: Anyone can view hobbies of public profiles
CREATE POLICY "Public hobbies are viewable"
ON hobbies FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = hobbies.user_id
    AND profiles.is_public = true
  )
);

-- Policy: Users can insert their own hobbies
CREATE POLICY "Users can insert own hobbies"
ON hobbies FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own hobbies
CREATE POLICY "Users can update own hobbies"
ON hobbies FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own hobbies
CREATE POLICY "Users can delete own hobbies"
ON hobbies FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- HOBBY_LOGS TABLE
-- Stores progress entries for hobbies (time in minutes or quantity units)
-- ============================================================================
CREATE TABLE hobby_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hobby_id UUID NOT NULL REFERENCES hobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value INTEGER NOT NULL,
  note TEXT,
  image_urls TEXT[],
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS immediately
ALTER TABLE hobby_logs ENABLE ROW LEVEL SECURITY;

-- Indexes for RLS policy columns and common queries
CREATE INDEX idx_hobby_logs_id ON hobby_logs(id);
CREATE INDEX idx_hobby_logs_user_id ON hobby_logs(user_id);
CREATE INDEX idx_hobby_logs_hobby_id ON hobby_logs(hobby_id);
CREATE INDEX idx_hobby_logs_logged_at ON hobby_logs(logged_at DESC);
CREATE INDEX idx_hobby_logs_created_at ON hobby_logs(created_at DESC);

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs"
ON hobby_logs FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy: Followers can view logs (owner is public OR viewer follows owner)
CREATE POLICY "Followers can view logs"
ON hobby_logs FOR SELECT
TO authenticated
USING (
  -- Owner is public
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = hobby_logs.user_id
    AND profiles.is_public = true
  )
  OR
  -- Viewer follows owner
  EXISTS (
    SELECT 1 FROM follows
    WHERE follows.following_id = hobby_logs.user_id
    AND follows.follower_id = (SELECT auth.uid())
  )
);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own logs"
ON hobby_logs FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own logs
CREATE POLICY "Users can update own logs"
ON hobby_logs FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own logs
CREATE POLICY "Users can delete own logs"
ON hobby_logs FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- FOLLOWS TABLE
-- Stores social graph (who follows whom)
-- ============================================================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS immediately
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Indexes for RLS policy columns
CREATE INDEX idx_follows_id ON follows(id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Policy: Users can view who they follow
CREATE POLICY "Users can view own follows"
ON follows FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = follower_id);

-- Policy: Users can view their followers
CREATE POLICY "Users can view own followers"
ON follows FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = following_id);

-- Policy: Anyone can view follows of public profiles
CREATE POLICY "Public follows are viewable"
ON follows FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = follows.following_id
    AND profiles.is_public = true
  )
);

-- Policy: Users can follow others (insert)
CREATE POLICY "Users can follow"
ON follows FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = follower_id);

-- Policy: Users can unfollow (delete)
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = follower_id);

-- ============================================================================
-- TRIGGER: Auto-create profile on user signup
-- This ensures every auth.users entry has a corresponding profiles entry
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
