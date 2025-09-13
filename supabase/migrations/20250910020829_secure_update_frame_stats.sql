-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_frame_stats_on_pixel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Ensure no one can call this function directly
REVOKE EXECUTE ON FUNCTION update_frame_stats_on_pixel() FROM PUBLIC;
