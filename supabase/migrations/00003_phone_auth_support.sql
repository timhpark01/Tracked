-- ============================================================================
-- PHONE AUTH SUPPORT
-- Version: 00003
-- Description: Update trigger to support phone authentication signups
-- ============================================================================

-- Update the trigger to handle phone auth gracefully
-- For email signups: auto-create profile with email as initial username
-- For phone signups: skip auto-creation, profile created after username selection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-create profile for email signups (not phone signups)
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.phone IS NULL THEN
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, NEW.email);
  END IF;
  -- For phone signups, profile is created after username selection in the app
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
