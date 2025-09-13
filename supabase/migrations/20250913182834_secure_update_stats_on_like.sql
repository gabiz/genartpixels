-- Function to update frame stats when likes are added/removed
CREATE OR REPLACE FUNCTION update_frame_stats_on_like()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
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

-- Ensure no one can call this function directly
REVOKE EXECUTE ON FUNCTION update_frame_stats_on_like() FROM PUBLIC;

-- (Optional) Only allow the database owner role to execute
GRANT EXECUTE ON FUNCTION update_frame_stats_on_like() TO postgres;