-- Enable realtime for Gen Art Pixels tables
-- This migration configures realtime subscriptions for collaborative features

-- Enable realtime on the tables we need to subscribe to
ALTER PUBLICATION supabase_realtime ADD TABLE pixels;
ALTER PUBLICATION supabase_realtime ADD TABLE frames;
ALTER PUBLICATION supabase_realtime ADD TABLE frame_stats;

-- Grant necessary permissions for realtime to work with RLS
-- The realtime system needs to be able to read from these tables

-- Create a function to check if realtime can access the data
CREATE OR REPLACE FUNCTION can_access_realtime_data()
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow realtime access for authenticated users and public read operations
  RETURN auth.role() = 'authenticated' OR auth.role() = 'anon';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow realtime subscriptions
-- Pixels table - allow realtime to broadcast pixel changes
DROP POLICY IF EXISTS "Anyone can view pixels" ON pixels;
CREATE POLICY "Anyone can view pixels" ON pixels
  FOR SELECT USING (true);

-- Frames table - allow realtime to broadcast frame changes  
DROP POLICY IF EXISTS "Anyone can view frames" ON frames;
CREATE POLICY "Anyone can view frames" ON frames
  FOR SELECT USING (true);

-- Frame stats table - allow realtime to broadcast stats changes
DROP POLICY IF EXISTS "Anyone can view frame stats" ON frame_stats;
CREATE POLICY "Anyone can view frame stats" ON frame_stats
  FOR SELECT USING (true);

-- Create a function to validate realtime subscriptions
CREATE OR REPLACE FUNCTION validate_realtime_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Log realtime events for debugging (remove in production)
  RAISE LOG 'Realtime event: % on table %', TG_OP, TG_TABLE_NAME;
  
  -- Always allow the operation to proceed
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to log realtime events (for debugging)
CREATE TRIGGER log_pixel_realtime_events
  AFTER INSERT OR UPDATE OR DELETE ON pixels
  FOR EACH ROW
  EXECUTE FUNCTION validate_realtime_subscription();

CREATE TRIGGER log_frame_realtime_events
  AFTER INSERT OR UPDATE OR DELETE ON frames
  FOR EACH ROW
  EXECUTE FUNCTION validate_realtime_subscription();

-- Grant realtime permissions
GRANT SELECT ON pixels TO anon, authenticated;
GRANT SELECT ON frames TO anon, authenticated;
GRANT SELECT ON frame_stats TO anon, authenticated;

-- Ensure the realtime schema has the necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Create a view for realtime frame events that includes necessary context
CREATE OR REPLACE VIEW realtime_frame_events AS
SELECT 
  f.id as frame_id,
  f.handle,
  f.owner_handle,
  f.title,
  f.permissions,
  f.is_frozen,
  f.updated_at,
  'frame_update' as event_type
FROM frames f;

-- Grant access to the realtime view
GRANT SELECT ON realtime_frame_events TO anon, authenticated;

-- Note: Views cannot be added to realtime publications, only tables

-- Migration complete: Realtime subscriptions enabled for collaborative pixel art features