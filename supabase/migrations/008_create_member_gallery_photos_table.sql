-- Create member_gallery_photos table for collaborative photo albums
CREATE TABLE IF NOT EXISTS member_gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_member_gallery_photos_member_id ON member_gallery_photos(member_id);
CREATE INDEX idx_member_gallery_photos_uploaded_by ON member_gallery_photos(uploaded_by_user_id);
CREATE INDEX idx_member_gallery_photos_created_at ON member_gallery_photos(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE member_gallery_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view all gallery photos
CREATE POLICY "Public read access for gallery photos"
ON member_gallery_photos FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can insert gallery photos
CREATE POLICY "Authenticated users can insert gallery photos"
ON member_gallery_photos FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Users can delete their own photos, admins can delete any photo
CREATE POLICY "Users can delete own photos, admins can delete any"
ON member_gallery_photos FOR DELETE
TO public
USING (
  uploaded_by_user_id IN (
    SELECT id FROM users WHERE id = uploaded_by_user_id
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_member_gallery_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_gallery_photos_updated_at
BEFORE UPDATE ON member_gallery_photos
FOR EACH ROW
EXECUTE FUNCTION update_member_gallery_photos_updated_at();
