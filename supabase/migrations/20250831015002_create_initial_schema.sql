-- Gen Art Pixels Database Schema
-- This migration creates all tables, indexes, triggers, and functions for the platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle VARCHAR(20) UNIQUE NOT NULL CHECK (length(handle) >= 5 AND length(handle) <= 20),
  email VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  pixels_available INTEGER DEFAULT 100 CHECK (pixels_available >= 0 AND pixels_available <= 100),
  last_refill TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Frames table
CREATE TABLE frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle VARCHAR(100) NOT NULL CHECK (length(handle) >= 3 AND length(handle) <= 100),
  title VARCHAR(255) NOT NULL CHECK (length(title) >= 1),
  description TEXT,
  keywords TEXT[],
  owner_handle VARCHAR(20) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  width INTEGER NOT NULL CHECK (width > 0 AND width <= 1024),
  height INTEGER NOT NULL CHECK (height > 0 AND height <= 1024),
  permissions VARCHAR(20) DEFAULT 'open' CHECK (permissions IN ('open', 'approval-required', 'owner-only')),
  is_frozen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pixels table
CREATE TABLE pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  x INTEGER NOT NULL CHECK (x >= 0),
  y INTEGER NOT NULL CHECK (y >= 0),
  color INTEGER NOT NULL, -- ARGB format: 0xAARRGGBB, 0x00000000 for transparent
  contributor_handle VARCHAR(20) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(frame_id, x, y)
);

-- Frame permissions table
CREATE TABLE frame_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  user_handle VARCHAR(20) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('contributor', 'blocked', 'pending')),
  granted_by VARCHAR(20) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(frame_id, user_handle)
);

-- Frame snapshots table
CREATE TABLE frame_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  snapshot_data BYTEA NOT NULL, -- Compressed pixel data
  pixel_count INTEGER NOT NULL CHECK (pixel_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Frame stats table
CREATE TABLE frame_stats (
  frame_id UUID PRIMARY KEY REFERENCES frames(id) ON DELETE CASCADE,
  contributors_count INTEGER DEFAULT 0 CHECK (contributors_count >= 0),
  total_pixels INTEGER DEFAULT 0 CHECK (total_pixels >= 0),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Frame likes table
CREATE TABLE frame_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  user_handle VARCHAR(20) NOT NULL REFERENCES users(handle) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(frame_id, user_handle)
);

-- Create indexes for performance optimization

-- Users indexes
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_last_refill ON users(last_refill);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Frames indexes
CREATE UNIQUE INDEX idx_frames_owner_handle ON frames(owner_handle, handle);
CREATE INDEX idx_frames_owner ON frames(owner_handle);
CREATE INDEX idx_frames_keywords ON frames USING GIN(keywords);
CREATE INDEX idx_frames_created_at ON frames(created_at DESC);
CREATE INDEX idx_frames_updated_at ON frames(updated_at DESC);
CREATE INDEX idx_frames_permissions ON frames(permissions);
CREATE INDEX idx_frames_is_frozen ON frames(is_frozen);

-- Pixels indexes
CREATE INDEX idx_pixels_frame ON pixels(frame_id);
CREATE INDEX idx_pixels_contributor ON pixels(contributor_handle);
CREATE INDEX idx_pixels_placed_at ON pixels(placed_at DESC);
CREATE INDEX idx_pixels_frame_placed_at ON pixels(frame_id, placed_at DESC);
CREATE INDEX idx_pixels_coordinates ON pixels(frame_id, x, y);

-- Frame permissions indexes
CREATE INDEX idx_frame_permissions_frame ON frame_permissions(frame_id);
CREATE INDEX idx_frame_permissions_user ON frame_permissions(user_handle);
CREATE INDEX idx_frame_permissions_type ON frame_permissions(permission_type);

-- Frame snapshots indexes
CREATE INDEX idx_frame_snapshots_frame_time ON frame_snapshots(frame_id, created_at DESC);
CREATE INDEX idx_frame_snapshots_created_at ON frame_snapshots(created_at DESC);

-- Frame stats indexes
CREATE INDEX idx_frame_stats_activity ON frame_stats(last_activity DESC);
CREATE INDEX idx_frame_stats_contributors ON frame_stats(contributors_count DESC);
CREATE INDEX idx_frame_stats_pixels ON frame_stats(total_pixels DESC);
CREATE INDEX idx_frame_stats_likes ON frame_stats(likes_count DESC);

-- Frame likes indexes
CREATE INDEX idx_frame_likes_frame ON frame_likes(frame_id);
CREATE INDEX idx_frame_likes_user ON frame_likes(user_handle);
CREATE INDEX idx_frame_likes_created_at ON frame_likes(created_at DESC);

-- Create functions for automatic stats updates

-- Function to update frame stats when pixels are placed
CREATE OR REPLACE FUNCTION update_frame_stats_on_pixel()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO frame_stats (frame_id, contributors_count, total_pixels, last_activity)
  VALUES (NEW.frame_id, 1, 1, NEW.placed_at)
  ON CONFLICT (frame_id) DO UPDATE SET
    contributors_count = (
      SELECT COUNT(DISTINCT contributor_handle) 
      FROM pixels 
      WHERE frame_id = NEW.frame_id
    ),
    total_pixels = frame_stats.total_pixels + 1,
    last_activity = NEW.placed_at,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update frame stats when pixels are deleted (for undo functionality)
CREATE OR REPLACE FUNCTION update_frame_stats_on_pixel_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE frame_stats 
  SET 
    contributors_count = (
      SELECT COUNT(DISTINCT contributor_handle) 
      FROM pixels 
      WHERE frame_id = OLD.frame_id
    ),
    total_pixels = GREATEST(frame_stats.total_pixels - 1, 0),
    updated_at = NOW()
  WHERE frame_id = OLD.frame_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to update frame stats when likes are added/removed
CREATE OR REPLACE FUNCTION update_frame_stats_on_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO frame_stats (frame_id, likes_count)
    VALUES (NEW.frame_id, 1)
    ON CONFLICT (frame_id) DO UPDATE SET
      likes_count = frame_stats.likes_count + 1,
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE frame_stats 
    SET 
      likes_count = GREATEST(frame_stats.likes_count - 1, 0),
      updated_at = NOW()
    WHERE frame_id = OLD.frame_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize frame stats when a frame is created
CREATE OR REPLACE FUNCTION initialize_frame_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO frame_stats (frame_id, contributors_count, total_pixels, likes_count, last_activity)
  VALUES (NEW.id, 0, 0, 0, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate pixel coordinates against frame dimensions
CREATE OR REPLACE FUNCTION validate_pixel_coordinates()
RETURNS TRIGGER AS $$
DECLARE
  frame_width INTEGER;
  frame_height INTEGER;
BEGIN
  SELECT width, height INTO frame_width, frame_height
  FROM frames
  WHERE id = NEW.frame_id;
  
  IF NEW.x >= frame_width OR NEW.y >= frame_height THEN
    RAISE EXCEPTION 'Pixel coordinates (%, %) are outside frame dimensions (% x %)', 
      NEW.x, NEW.y, frame_width, frame_height;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger to update frame stats when pixels are placed
CREATE TRIGGER trigger_update_frame_stats_on_pixel
  AFTER INSERT ON pixels
  FOR EACH ROW
  EXECUTE FUNCTION update_frame_stats_on_pixel();

-- Trigger to update frame stats when pixels are deleted
CREATE TRIGGER trigger_update_frame_stats_on_pixel_delete
  AFTER DELETE ON pixels
  FOR EACH ROW
  EXECUTE FUNCTION update_frame_stats_on_pixel_delete();

-- Trigger to update frame stats when likes are added/removed
CREATE TRIGGER trigger_update_frame_stats_on_like
  AFTER INSERT OR DELETE ON frame_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_frame_stats_on_like();

-- Trigger to initialize frame stats when a frame is created
CREATE TRIGGER trigger_initialize_frame_stats
  AFTER INSERT ON frames
  FOR EACH ROW
  EXECUTE FUNCTION initialize_frame_stats();

-- Trigger to update updated_at columns
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_frames_updated_at
  BEFORE UPDATE ON frames
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to validate pixel coordinates
CREATE TRIGGER trigger_validate_pixel_coordinates
  BEFORE INSERT OR UPDATE ON pixels
  FOR EACH ROW
  EXECUTE FUNCTION validate_pixel_coordinates();

-- Create Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE frame_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE frame_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE frame_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE frame_likes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Frames policies (public read, owner write)
CREATE POLICY "Anyone can view frames" ON frames
  FOR SELECT USING (true);

CREATE POLICY "Users can create frames" ON frames
  FOR INSERT WITH CHECK (auth.uid()::text IN (SELECT id::text FROM users WHERE handle = owner_handle));

CREATE POLICY "Frame owners can update their frames" ON frames
  FOR UPDATE USING (auth.uid()::text IN (SELECT id::text FROM users WHERE handle = owner_handle));

CREATE POLICY "Frame owners can delete their frames" ON frames
  FOR DELETE USING (auth.uid()::text IN (SELECT id::text FROM users WHERE handle = owner_handle));

-- Pixels policies (public read, authenticated write with permissions)
CREATE POLICY "Anyone can view pixels" ON pixels
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can place pixels" ON pixels
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid()::text IN (SELECT id::text FROM users WHERE handle = contributor_handle)
  );

-- Frame permissions policies
CREATE POLICY "Anyone can view frame permissions" ON frame_permissions
  FOR SELECT USING (true);

CREATE POLICY "Frame owners can manage permissions" ON frame_permissions
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      JOIN frames f ON f.owner_handle = u.handle 
      WHERE f.id = frame_id
    )
  );

-- Frame snapshots policies (public read for efficiency)
CREATE POLICY "Anyone can view frame snapshots" ON frame_snapshots
  FOR SELECT USING (true);

CREATE POLICY "System can create snapshots" ON frame_snapshots
  FOR INSERT WITH CHECK (true);

-- Frame stats policies (public read)
CREATE POLICY "Anyone can view frame stats" ON frame_stats
  FOR SELECT USING (true);

-- Frame likes policies
CREATE POLICY "Anyone can view frame likes" ON frame_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like frames" ON frame_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid()::text IN (SELECT id::text FROM users WHERE handle = user_handle)
  );

CREATE POLICY "Users can unlike frames they liked" ON frame_likes
  FOR DELETE USING (
    auth.uid()::text IN (SELECT id::text FROM users WHERE handle = user_handle)
  );

-- Create helpful views for common queries

-- View for frame details with stats
CREATE VIEW frame_details AS
SELECT 
  f.*,
  fs.contributors_count,
  fs.total_pixels,
  fs.likes_count,
  fs.last_activity
FROM frames f
LEFT JOIN frame_stats fs ON f.id = fs.frame_id;

-- View for user statistics
CREATE VIEW user_stats AS
SELECT 
  u.handle,
  u.created_at,
  COUNT(DISTINCT f.id) as frames_created,
  COUNT(DISTINCT p.frame_id) as frames_contributed_to,
  COUNT(p.id) as total_pixels_placed,
  COUNT(DISTINCT fl.frame_id) as frames_liked
FROM users u
LEFT JOIN frames f ON u.handle = f.owner_handle
LEFT JOIN pixels p ON u.handle = p.contributor_handle
LEFT JOIN frame_likes fl ON u.handle = fl.user_handle
GROUP BY u.handle, u.created_at;

-- Create indexes on views for better performance
CREATE INDEX idx_frame_details_created_at ON frames(created_at DESC);
CREATE INDEX idx_frame_details_likes ON frame_stats(likes_count DESC);
CREATE INDEX idx_frame_details_activity ON frame_stats(last_activity DESC);

-- Insert default color palette as a reference (for documentation)
COMMENT ON COLUMN pixels.color IS 'ARGB format color value. Predefined palette includes: 0x00000000 (transparent), 0xFF6D001A (dark red), 0xFFBE0039 (red), 0xFFFF4500 (orange), 0xFFFFA800 (yellow-orange), 0xFFFFD635 (yellow), 0xFF00A368 (dark green), 0xFF00CC78 (green), 0xFF7EED56 (light green), 0xFF00756F (dark teal), 0xFF009EAA (teal), 0xFF00CCC0 (light teal), 0xFF2450A4 (dark blue), 0xFF3690EA (blue), 0xFF51E9F4 (light blue), 0xFF493AC1 (dark indigo), 0xFF6A5CFF (indigo), 0xFF94B3FF (light indigo), 0xFF811E9F (dark purple), 0xFFB44AC0 (purple), 0xFFE4ABFF (light purple), 0xFFDE107F (dark pink), 0xFFFF3881 (pink), 0xFFFF99AA (light pink), 0xFF6D482F (brown), 0xFF9C6926 (tan), 0xFFFFB470 (light tan), 0xFF000000 (black), 0xFF515252 (dark gray), 0xFF898D90 (gray), 0xFFD4D7D9 (light gray), 0xFFFFFFFF (white)';