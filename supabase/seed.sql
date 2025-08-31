-- Seed data for Gen Art Pixels development
-- This file creates sample data to test the database schema

-- Insert test users
INSERT INTO users (handle, email, pixels_available) VALUES
  ('alice_artist', 'alice@example.com', 85),
  ('bob_creator', 'bob@example.com', 100),
  ('charlie_dev', 'charlie@example.com', 42);

-- Insert test frames
INSERT INTO frames (handle, title, description, keywords, owner_handle, width, height, permissions) VALUES
  ('welcome-banner', 'Welcome Banner', 'A collaborative welcome message for new users', ARRAY['welcome', 'banner', 'community'], 'alice_artist', 128, 72, 'open'),
  ('pixel-portrait', 'Pixel Portrait', 'Community pixel art portrait', ARRAY['portrait', 'art', 'collaborative'], 'bob_creator', 64, 64, 'approval-required'),
  ('test-canvas', 'Test Canvas', 'Small canvas for testing features', ARRAY['test', 'development'], 'charlie_dev', 32, 32, 'owner-only');

-- Get frame IDs for pixel insertion
DO $$
DECLARE
  welcome_frame_id UUID;
  portrait_frame_id UUID;
  test_frame_id UUID;
BEGIN
  SELECT id INTO welcome_frame_id FROM frames WHERE handle = 'welcome-banner';
  SELECT id INTO portrait_frame_id FROM frames WHERE handle = 'pixel-portrait';
  SELECT id INTO test_frame_id FROM frames WHERE handle = 'test-canvas';

  -- Insert test pixels
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Welcome banner pixels (red "HI" text)
    (welcome_frame_id, 10, 10, 4294901760, 'alice_artist'), -- Red pixel
    (welcome_frame_id, 11, 10, 4294901760, 'bob_creator'),
    (welcome_frame_id, 12, 10, 4294901760, 'alice_artist'),
    (welcome_frame_id, 10, 11, 4294901760, 'charlie_dev'),
    (welcome_frame_id, 12, 11, 4294901760, 'bob_creator'),
    (welcome_frame_id, 10, 12, 4294901760, 'alice_artist'),
    (welcome_frame_id, 11, 12, 4294901760, 'charlie_dev'),
    (welcome_frame_id, 12, 12, 4294901760, 'bob_creator'),
    
    -- Portrait frame pixels (simple smiley face)
    (portrait_frame_id, 20, 15, 4278255360, 'bob_creator'), -- Green eye
    (portrait_frame_id, 25, 15, 4278255360, 'alice_artist'), -- Green eye
    (portrait_frame_id, 18, 20, 4294901760, 'charlie_dev'), -- Red mouth
    (portrait_frame_id, 19, 21, 4294901760, 'bob_creator'),
    (portrait_frame_id, 20, 22, 4294901760, 'alice_artist'),
    (portrait_frame_id, 21, 22, 4294901760, 'charlie_dev'),
    (portrait_frame_id, 22, 22, 4294901760, 'bob_creator'),
    (portrait_frame_id, 23, 22, 4294901760, 'alice_artist'),
    (portrait_frame_id, 24, 21, 4294901760, 'charlie_dev'),
    (portrait_frame_id, 25, 20, 4294901760, 'bob_creator'),
    
    -- Test canvas pixels
    (test_frame_id, 5, 5, 4278190080, 'charlie_dev'), -- Black pixel
    (test_frame_id, 6, 6, 4294967295, 'charlie_dev'), -- White pixel
    (test_frame_id, 7, 7, 4278255360, 'charlie_dev'); -- Green pixel

  -- Insert test frame permissions
  INSERT INTO frame_permissions (frame_id, user_handle, permission_type, granted_by) VALUES
    (portrait_frame_id, 'alice_artist', 'contributor', 'bob_creator'),
    (portrait_frame_id, 'charlie_dev', 'contributor', 'bob_creator');

  -- Insert test frame likes
  INSERT INTO frame_likes (frame_id, user_handle) VALUES
    (welcome_frame_id, 'bob_creator'),
    (welcome_frame_id, 'charlie_dev'),
    (portrait_frame_id, 'alice_artist'),
    (portrait_frame_id, 'charlie_dev'),
    (test_frame_id, 'alice_artist');

  -- Insert test frame snapshot
  INSERT INTO frame_snapshots (frame_id, snapshot_data, pixel_count) VALUES
    (welcome_frame_id, E'\\x1f8b08000000000000000313f3c8540400d7ab4f0500000000'::bytea, 8);

END $$;