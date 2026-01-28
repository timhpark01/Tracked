-- Create avatars bucket (public read, authenticated write to own folder)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create log-photos bucket (public read, authenticated write to own folder)
INSERT INTO storage.buckets (id, name, public)
VALUES ('log-photos', 'log-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policies for log-photos bucket
CREATE POLICY "Log photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'log-photos');

CREATE POLICY "Users can upload own log photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'log-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own log photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'log-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
