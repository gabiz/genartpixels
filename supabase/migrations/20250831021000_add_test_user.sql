-- Add test user and frame for viewtester/view-test

-- Insert test user
INSERT INTO users (handle, email, pixels_available) VALUES
  ('viewtester', 'viewtester@example.com', 100)
ON CONFLICT (handle) DO NOTHING;

-- Insert test frame
INSERT INTO frames (handle, title, description, keywords, owner_handle, width, height, permissions) VALUES
  ('view-test', 'View Test Frame', 'A test frame for debugging realtime connections', ARRAY['test', 'realtime', 'debug'], 'viewtester', 64, 64, 'open')
ON CONFLICT (owner_handle, handle) DO NOTHING;

-- Add some test pixels to the frame
DO $$
DECLARE
  test_frame_id UUID;
BEGIN
  SELECT id INTO test_frame_id FROM frames WHERE handle = 'view-test' AND owner_handle = 'viewtester';
  
  IF test_frame_id IS NOT NULL THEN
    -- Insert test pixels (simple pattern)
    INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
      (test_frame_id, 10, 10, 4294901760, 'viewtester'), -- Red pixel
      (test_frame_id, 11, 10, 4278255360, 'viewtester'), -- Green pixel  
      (test_frame_id, 12, 10, 4278190335, 'viewtester'), -- Blue pixel
      (test_frame_id, 10, 11, 4294967040, 'viewtester'), -- Yellow pixel
      (test_frame_id, 11, 11, 4294901760, 'viewtester'), -- Red pixel
      (test_frame_id, 12, 11, 4278255360, 'viewtester') -- Green pixel
    ON CONFLICT (frame_id, x, y) DO NOTHING;
  END IF;
END $$;