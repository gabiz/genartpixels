CREATE POLICY "Frame owner can manage frame_stats" ON frame_stats
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      JOIN frames f ON f.owner_handle = u.handle 
      WHERE f.id = frame_id
    )
  );
