-- Fix color data type to support full ARGB range
-- PostgreSQL INTEGER is 32-bit signed (-2^31 to 2^31-1)
-- ARGB colors need unsigned 32-bit (0 to 2^32-1)
-- Use BIGINT to accommodate the full range

ALTER TABLE pixels ALTER COLUMN color TYPE BIGINT;

-- Update the comment to reflect the correct data type
COMMENT ON COLUMN pixels.color IS 'ARGB format color value stored as BIGINT. Predefined palette includes: 0 (transparent), 1745977370 (dark red), 3187671097 (red), 4283782400 (orange), 4294901760 (yellow-orange), 4294953525 (yellow), 42401640 (dark green), 13421688 (green), 2130263382 (light green), 7695215 (dark teal), 10067626 (teal), 13421504 (light teal), 38068388 (dark blue), 57737450 (blue), 1358954996 (light blue), 1213089985 (dark indigo), 1784831999 (indigo), 2495168511 (light indigo), 2165414303 (dark purple), 3024834752 (purple), 3836477439 (light purple), 3707764863 (dark pink), 4283782273 (pink), 4294936234 (light pink), 1815855151 (brown), 2574804262 (tan), 4294936688 (light tan), 4278190080 (black), 1364283986 (dark gray), 2307048848 (gray), 3568644569 (light gray), 4294967295 (white)';