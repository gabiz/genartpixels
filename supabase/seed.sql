-- Comprehensive Seed Data for Gen Art Pixels
-- This file creates a rich dataset with multiple users, diverse frames, and complete pixel art

-- Color palette constants (ARGB format as BIGINT)
-- Transparent: 0
-- Dark Red: 1745977370, Red: 3187671097, Orange: 4283782400
-- Yellow-Orange: 4294901760, Yellow: 4294953525
-- Dark Green: 42401640, Green: 13421688, Light Green: 2130263382
-- Dark Teal: 7695215, Teal: 10067626, Light Teal: 13421504
-- Dark Blue: 38068388, Blue: 57737450, Light Blue: 1358954996
-- Dark Indigo: 1213089985, Indigo: 1784831999, Light Indigo: 2495168511
-- Dark Purple: 2165414303, Purple: 3024834752, Light Purple: 3836477439
-- Dark Pink: 3707764863, Pink: 4283782273, Light Pink: 4294936234
-- Brown: 1815855151, Tan: 2574804262, Light Tan: 4294936688
-- Black: 4278190080, Dark Gray: 1364283986, Gray: 2307048848
-- Light Gray: 3568644569, White: 4294967295

-- Insert diverse users with different pixel availability
INSERT INTO users (handle, email, pixels_available, avatar_url) VALUES
  ('pixel_master', 'master@genartpixels.com', 95, 'https://api.dicebear.com/7.x/pixel-art/png?seed=master'),
  ('art_lover_42', 'artlover@example.com', 78, 'https://api.dicebear.com/7.x/pixel-art/png?seed=lover'),
  ('creative_soul', 'creative@example.com', 100, 'https://api.dicebear.com/7.x/pixel-art/png?seed=soul'),
  ('retro_gamer', 'retro@example.com', 23, 'https://api.dicebear.com/7.x/pixel-art/png?seed=gamer'),
  ('digital_nomad', 'nomad@example.com', 67, 'https://api.dicebear.com/7.x/pixel-art/png?seed=nomad'),
  ('color_wizard', 'wizard@example.com', 89, 'https://api.dicebear.com/7.x/pixel-art/png?seed=wizard'),
  ('pixel_pioneer', 'pioneer@example.com', 45, 'https://api.dicebear.com/7.x/pixel-art/png?seed=pioneer'),
  ('art_collective', 'collective@example.com', 100, 'https://api.dicebear.com/7.x/pixel-art/png?seed=collective'),
  ('minimalist_dev', 'minimal@example.com', 12, 'https://api.dicebear.com/7.x/pixel-art/png?seed=minimal'),
  ('rainbow_artist', 'rainbow@example.com', 84, 'https://api.dicebear.com/7.x/pixel-art/png?seed=rainbow');

-- Insert frames with different sizes, permissions, and themes
INSERT INTO frames (handle, title, description, keywords, owner_handle, width, height, permissions, is_frozen) VALUES
  -- Quick Landscape frames (128x72)
  ('welcome-to-pixels', 'Welcome to Gen Art Pixels!', 'A vibrant welcome banner showcasing our community spirit', ARRAY['welcome', 'banner', 'community', 'colorful'], 'pixel_master', 128, 72, 'open', false),
  ('sunset-landscape', 'Pixel Sunset', 'Collaborative sunset landscape with mountains and sky', ARRAY['landscape', 'sunset', 'nature', 'mountains'], 'art_lover_42', 128, 72, 'open', false),
  ('retro-game-banner', 'Retro Gaming Tribute', 'Homage to classic 8-bit gaming with iconic elements', ARRAY['retro', 'gaming', '8bit', 'nostalgia'], 'retro_gamer', 128, 72, 'approval-required', false),
  
  -- Quick Portrait frames (72x128)
  ('character-portrait', 'Fantasy Character', 'A detailed fantasy character portrait', ARRAY['character', 'fantasy', 'portrait', 'rpg'], 'creative_soul', 72, 128, 'approval-required', false),
  ('abstract-tower', 'Abstract Tower', 'Minimalist abstract tower reaching skyward', ARRAY['abstract', 'minimalist', 'architecture', 'modern'], 'minimalist_dev', 72, 128, 'open', false),
  
  -- Core frames (128x128)
  ('community-logo', 'Community Logo', 'Our official community logo created together', ARRAY['logo', 'community', 'official', 'identity'], 'art_collective', 128, 128, 'approval-required', false),
  ('mandala-pattern', 'Collaborative Mandala', 'Sacred geometry mandala pattern', ARRAY['mandala', 'pattern', 'sacred', 'geometry'], 'color_wizard', 128, 128, 'open', false),
  ('pixel-pet-cafe', 'Pixel Pet Cafe', 'Cute pixel pets enjoying coffee together', ARRAY['pets', 'cute', 'cafe', 'animals'], 'digital_nomad', 128, 128, 'open', false),
  ('space-exploration', 'Space Explorer', 'Astronaut exploring alien worlds', ARRAY['space', 'astronaut', 'exploration', 'scifi'], 'pixel_pioneer', 128, 128, 'approval-required', false),
  
  -- Epic frame (512x288)
  ('epic-battle-scene', 'Epic Battle Scene', 'Massive collaborative battle scene with heroes and dragons', ARRAY['epic', 'battle', 'fantasy', 'dragons', 'heroes'], 'art_collective', 512, 288, 'open', false),
  
  -- Small test frames
  ('color-palette-test', 'Color Palette Test', 'Testing all available colors', ARRAY['test', 'colors', 'palette'], 'color_wizard', 32, 32, 'owner-only', false),
  ('frozen-masterpiece', 'Frozen Masterpiece', 'A completed work that is now frozen', ARRAY['complete', 'masterpiece', 'frozen'], 'pixel_master', 64, 64, 'open', true);

-- Complex pixel art data insertion
DO $$
DECLARE
  welcome_frame_id UUID;
  sunset_frame_id UUID;
  retro_frame_id UUID;
  character_frame_id UUID;
  tower_frame_id UUID;
  logo_frame_id UUID;
  mandala_frame_id UUID;
  cafe_frame_id UUID;
  space_frame_id UUID;
  epic_frame_id UUID;
  palette_frame_id UUID;
  frozen_frame_id UUID;
  
  -- Color constants
  c_transparent BIGINT := 0;
  c_black BIGINT := 4278190080;
  c_white BIGINT := 4294967295;
  c_red BIGINT := 3187671097;
  c_dark_red BIGINT := 1745977370;
  c_orange BIGINT := 4283782400;
  c_yellow BIGINT := 4294953525;
  c_green BIGINT := 13421688;
  c_dark_green BIGINT := 42401640;
  c_light_green BIGINT := 2130263382;
  c_blue BIGINT := 57737450;
  c_dark_blue BIGINT := 38068388;
  c_light_blue BIGINT := 1358954996;
  c_purple BIGINT := 3024834752;
  c_dark_purple BIGINT := 2165414303;
  c_pink BIGINT := 4283782273;
  c_brown BIGINT := 1815855151;
  c_tan BIGINT := 2574804262;
  c_gray BIGINT := 2307048848;
  c_light_gray BIGINT := 3568644569;
  c_dark_gray BIGINT := 1364283986;
  
BEGIN
  -- Get frame IDs
  SELECT id INTO welcome_frame_id FROM frames WHERE handle = 'welcome-to-pixels';
  SELECT id INTO sunset_frame_id FROM frames WHERE handle = 'sunset-landscape';
  SELECT id INTO retro_frame_id FROM frames WHERE handle = 'retro-game-banner';
  SELECT id INTO character_frame_id FROM frames WHERE handle = 'character-portrait';
  SELECT id INTO tower_frame_id FROM frames WHERE handle = 'abstract-tower';
  SELECT id INTO logo_frame_id FROM frames WHERE handle = 'community-logo';
  SELECT id INTO mandala_frame_id FROM frames WHERE handle = 'mandala-pattern';
  SELECT id INTO cafe_frame_id FROM frames WHERE handle = 'pixel-pet-cafe';
  SELECT id INTO space_frame_id FROM frames WHERE handle = 'space-exploration';
  SELECT id INTO epic_frame_id FROM frames WHERE handle = 'epic-battle-scene';
  SELECT id INTO palette_frame_id FROM frames WHERE handle = 'color-palette-test';
  SELECT id INTO frozen_frame_id FROM frames WHERE handle = 'frozen-masterpiece';

  -- Welcome Banner: "WELCOME" text with decorative border
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Border decoration
    (welcome_frame_id, 5, 5, c_red, 'pixel_master'),
    (welcome_frame_id, 122, 5, c_red, 'art_lover_42'),
    (welcome_frame_id, 5, 66, c_red, 'creative_soul'),
    (welcome_frame_id, 122, 66, c_red, 'retro_gamer'),
    
    -- "WELCOME" text (starting at x=20, y=25)
    -- W
    (welcome_frame_id, 20, 25, c_blue, 'pixel_master'),
    (welcome_frame_id, 20, 26, c_blue, 'pixel_master'),
    (welcome_frame_id, 20, 27, c_blue, 'pixel_master'),
    (welcome_frame_id, 20, 28, c_blue, 'pixel_master'),
    (welcome_frame_id, 20, 29, c_blue, 'pixel_master'),
    (welcome_frame_id, 21, 29, c_blue, 'art_lover_42'),
    (welcome_frame_id, 22, 28, c_blue, 'art_lover_42'),
    (welcome_frame_id, 23, 29, c_blue, 'creative_soul'),
    (welcome_frame_id, 24, 25, c_blue, 'creative_soul'),
    (welcome_frame_id, 24, 26, c_blue, 'creative_soul'),
    (welcome_frame_id, 24, 27, c_blue, 'creative_soul'),
    (welcome_frame_id, 24, 28, c_blue, 'creative_soul'),
    (welcome_frame_id, 24, 29, c_blue, 'creative_soul'),
    
    -- E
    (welcome_frame_id, 27, 25, c_green, 'retro_gamer'),
    (welcome_frame_id, 27, 26, c_green, 'retro_gamer'),
    (welcome_frame_id, 27, 27, c_green, 'retro_gamer'),
    (welcome_frame_id, 27, 28, c_green, 'retro_gamer'),
    (welcome_frame_id, 27, 29, c_green, 'retro_gamer'),
    (welcome_frame_id, 28, 25, c_green, 'digital_nomad'),
    (welcome_frame_id, 29, 25, c_green, 'digital_nomad'),
    (welcome_frame_id, 28, 27, c_green, 'color_wizard'),
    (welcome_frame_id, 28, 29, c_green, 'color_wizard'),
    (welcome_frame_id, 29, 29, c_green, 'pixel_pioneer'),
    
    -- L
    (welcome_frame_id, 32, 25, c_purple, 'art_collective'),
    (welcome_frame_id, 32, 26, c_purple, 'art_collective'),
    (welcome_frame_id, 32, 27, c_purple, 'art_collective'),
    (welcome_frame_id, 32, 28, c_purple, 'art_collective'),
    (welcome_frame_id, 32, 29, c_purple, 'art_collective'),
    (welcome_frame_id, 33, 29, c_purple, 'minimalist_dev'),
    (welcome_frame_id, 34, 29, c_purple, 'minimalist_dev'),
    
    -- C
    (welcome_frame_id, 37, 25, c_orange, 'rainbow_artist'),
    (welcome_frame_id, 38, 25, c_orange, 'rainbow_artist'),
    (welcome_frame_id, 39, 25, c_orange, 'rainbow_artist'),
    (welcome_frame_id, 37, 26, c_orange, 'pixel_master'),
    (welcome_frame_id, 37, 27, c_orange, 'pixel_master'),
    (welcome_frame_id, 37, 28, c_orange, 'pixel_master'),
    (welcome_frame_id, 37, 29, c_orange, 'pixel_master'),
    (welcome_frame_id, 38, 29, c_orange, 'art_lover_42'),
    (welcome_frame_id, 39, 29, c_orange, 'art_lover_42'),
    
    -- O
    (welcome_frame_id, 42, 25, c_yellow, 'creative_soul'),
    (welcome_frame_id, 43, 25, c_yellow, 'creative_soul'),
    (welcome_frame_id, 44, 25, c_yellow, 'creative_soul'),
    (welcome_frame_id, 42, 26, c_yellow, 'retro_gamer'),
    (welcome_frame_id, 44, 26, c_yellow, 'retro_gamer'),
    (welcome_frame_id, 42, 27, c_yellow, 'digital_nomad'),
    (welcome_frame_id, 44, 27, c_yellow, 'digital_nomad'),
    (welcome_frame_id, 42, 28, c_yellow, 'color_wizard'),
    (welcome_frame_id, 44, 28, c_yellow, 'color_wizard'),
    (welcome_frame_id, 42, 29, c_yellow, 'pixel_pioneer'),
    (welcome_frame_id, 43, 29, c_yellow, 'pixel_pioneer'),
    (welcome_frame_id, 44, 29, c_yellow, 'pixel_pioneer'),
    
    -- M
    (welcome_frame_id, 47, 25, c_pink, 'art_collective'),
    (welcome_frame_id, 47, 26, c_pink, 'art_collective'),
    (welcome_frame_id, 47, 27, c_pink, 'art_collective'),
    (welcome_frame_id, 47, 28, c_pink, 'art_collective'),
    (welcome_frame_id, 47, 29, c_pink, 'art_collective'),
    (welcome_frame_id, 48, 26, c_pink, 'minimalist_dev'),
    (welcome_frame_id, 49, 27, c_pink, 'minimalist_dev'),
    (welcome_frame_id, 50, 26, c_pink, 'rainbow_artist'),
    (welcome_frame_id, 51, 25, c_pink, 'rainbow_artist'),
    (welcome_frame_id, 51, 26, c_pink, 'pixel_master'),
    (welcome_frame_id, 51, 27, c_pink, 'pixel_master'),
    (welcome_frame_id, 51, 28, c_pink, 'pixel_master'),
    (welcome_frame_id, 51, 29, c_pink, 'pixel_master'),
    
    -- E
    (welcome_frame_id, 54, 25, c_red, 'art_lover_42'),
    (welcome_frame_id, 54, 26, c_red, 'art_lover_42'),
    (welcome_frame_id, 54, 27, c_red, 'art_lover_42'),
    (welcome_frame_id, 54, 28, c_red, 'art_lover_42'),
    (welcome_frame_id, 54, 29, c_red, 'art_lover_42'),
    (welcome_frame_id, 55, 25, c_red, 'creative_soul'),
    (welcome_frame_id, 56, 25, c_red, 'creative_soul'),
    (welcome_frame_id, 55, 27, c_red, 'retro_gamer'),
    (welcome_frame_id, 55, 29, c_red, 'retro_gamer'),
    (welcome_frame_id, 56, 29, c_red, 'digital_nomad'),
    
    -- Decorative stars around the text
    (welcome_frame_id, 15, 20, c_yellow, 'color_wizard'),
    (welcome_frame_id, 60, 20, c_yellow, 'pixel_pioneer'),
    (welcome_frame_id, 15, 35, c_yellow, 'art_collective'),
    (welcome_frame_id, 60, 35, c_yellow, 'minimalist_dev'),
    (welcome_frame_id, 10, 30, c_orange, 'rainbow_artist'),
    (welcome_frame_id, 65, 30, c_orange, 'pixel_master');

  -- Sunset Landscape: Simple landscape with gradient sky
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Sky gradient (top to bottom: light_blue to orange to yellow)
    -- Top row - light blue
    (sunset_frame_id, 0, 0, c_light_blue, 'art_lover_42'),
    (sunset_frame_id, 10, 0, c_light_blue, 'art_lover_42'),
    (sunset_frame_id, 20, 0, c_light_blue, 'art_lover_42'),
    (sunset_frame_id, 30, 0, c_light_blue, 'art_lover_42'),
    (sunset_frame_id, 40, 0, c_light_blue, 'art_lover_42'),
    (sunset_frame_id, 50, 0, c_light_blue, 'creative_soul'),
    (sunset_frame_id, 60, 0, c_light_blue, 'creative_soul'),
    (sunset_frame_id, 70, 0, c_light_blue, 'creative_soul'),
    (sunset_frame_id, 80, 0, c_light_blue, 'creative_soul'),
    (sunset_frame_id, 90, 0, c_light_blue, 'creative_soul'),
    (sunset_frame_id, 100, 0, c_light_blue, 'retro_gamer'),
    (sunset_frame_id, 110, 0, c_light_blue, 'retro_gamer'),
    (sunset_frame_id, 120, 0, c_light_blue, 'retro_gamer'),
    
    -- Sun
    (sunset_frame_id, 100, 15, c_yellow, 'digital_nomad'),
    (sunset_frame_id, 99, 16, c_yellow, 'digital_nomad'),
    (sunset_frame_id, 100, 16, c_orange, 'digital_nomad'),
    (sunset_frame_id, 101, 16, c_yellow, 'digital_nomad'),
    (sunset_frame_id, 98, 17, c_yellow, 'color_wizard'),
    (sunset_frame_id, 99, 17, c_orange, 'color_wizard'),
    (sunset_frame_id, 100, 17, c_orange, 'color_wizard'),
    (sunset_frame_id, 101, 17, c_orange, 'color_wizard'),
    (sunset_frame_id, 102, 17, c_yellow, 'color_wizard'),
    
    -- Mountains silhouette
    (sunset_frame_id, 20, 45, c_dark_gray, 'pixel_pioneer'),
    (sunset_frame_id, 21, 44, c_dark_gray, 'pixel_pioneer'),
    (sunset_frame_id, 22, 43, c_dark_gray, 'pixel_pioneer'),
    (sunset_frame_id, 23, 42, c_dark_gray, 'pixel_pioneer'),
    (sunset_frame_id, 24, 41, c_dark_gray, 'art_collective'),
    (sunset_frame_id, 25, 40, c_dark_gray, 'art_collective'),
    (sunset_frame_id, 26, 41, c_dark_gray, 'art_collective'),
    (sunset_frame_id, 27, 42, c_dark_gray, 'art_collective'),
    (sunset_frame_id, 28, 43, c_dark_gray, 'minimalist_dev'),
    (sunset_frame_id, 29, 44, c_dark_gray, 'minimalist_dev'),
    (sunset_frame_id, 30, 45, c_dark_gray, 'minimalist_dev'),
    
    -- Ground
    (sunset_frame_id, 0, 60, c_dark_green, 'rainbow_artist'),
    (sunset_frame_id, 10, 60, c_dark_green, 'rainbow_artist'),
    (sunset_frame_id, 20, 60, c_dark_green, 'rainbow_artist'),
    (sunset_frame_id, 30, 60, c_dark_green, 'pixel_master'),
    (sunset_frame_id, 40, 60, c_dark_green, 'pixel_master'),
    (sunset_frame_id, 50, 60, c_dark_green, 'pixel_master'),
    (sunset_frame_id, 60, 60, c_dark_green, 'art_lover_42'),
    (sunset_frame_id, 70, 60, c_dark_green, 'art_lover_42'),
    (sunset_frame_id, 80, 60, c_dark_green, 'art_lover_42'),
    (sunset_frame_id, 90, 60, c_dark_green, 'creative_soul'),
    (sunset_frame_id, 100, 60, c_dark_green, 'creative_soul'),
    (sunset_frame_id, 110, 60, c_dark_green, 'creative_soul'),
    (sunset_frame_id, 120, 60, c_dark_green, 'retro_gamer');

  -- Retro Game Banner: Classic game elements
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Pac-Man inspired character
    (retro_frame_id, 20, 30, c_yellow, 'retro_gamer'),
    (retro_frame_id, 21, 29, c_yellow, 'retro_gamer'),
    (retro_frame_id, 22, 29, c_yellow, 'retro_gamer'),
    (retro_frame_id, 23, 29, c_yellow, 'retro_gamer'),
    (retro_frame_id, 24, 30, c_yellow, 'retro_gamer'),
    (retro_frame_id, 20, 31, c_yellow, 'pixel_master'),
    (retro_frame_id, 21, 31, c_yellow, 'pixel_master'),
    (retro_frame_id, 22, 31, c_black, 'pixel_master'), -- Eye
    (retro_frame_id, 23, 31, c_yellow, 'pixel_master'),
    (retro_frame_id, 24, 31, c_yellow, 'pixel_master'),
    (retro_frame_id, 20, 32, c_yellow, 'art_lover_42'),
    (retro_frame_id, 21, 32, c_yellow, 'art_lover_42'),
    (retro_frame_id, 22, 32, c_yellow, 'art_lover_42'),
    (retro_frame_id, 23, 32, c_yellow, 'art_lover_42'),
    (retro_frame_id, 24, 32, c_yellow, 'art_lover_42'),
    (retro_frame_id, 20, 33, c_yellow, 'creative_soul'),
    (retro_frame_id, 21, 33, c_yellow, 'creative_soul'),
    (retro_frame_id, 24, 33, c_yellow, 'creative_soul'),
    (retro_frame_id, 21, 34, c_yellow, 'digital_nomad'),
    (retro_frame_id, 22, 34, c_yellow, 'digital_nomad'),
    (retro_frame_id, 23, 34, c_yellow, 'digital_nomad'),
    
    -- Power pellets
    (retro_frame_id, 30, 31, c_white, 'color_wizard'),
    (retro_frame_id, 35, 31, c_white, 'pixel_pioneer'),
    (retro_frame_id, 40, 31, c_white, 'art_collective'),
    
    -- Space Invader
    (retro_frame_id, 80, 25, c_green, 'minimalist_dev'),
    (retro_frame_id, 83, 25, c_green, 'minimalist_dev'),
    (retro_frame_id, 81, 26, c_green, 'rainbow_artist'),
    (retro_frame_id, 82, 26, c_green, 'rainbow_artist'),
    (retro_frame_id, 80, 27, c_green, 'pixel_master'),
    (retro_frame_id, 81, 27, c_green, 'pixel_master'),
    (retro_frame_id, 82, 27, c_green, 'pixel_master'),
    (retro_frame_id, 83, 27, c_green, 'pixel_master'),
    (retro_frame_id, 79, 28, c_green, 'art_lover_42'),
    (retro_frame_id, 80, 28, c_green, 'art_lover_42'),
    (retro_frame_id, 83, 28, c_green, 'art_lover_42'),
    (retro_frame_id, 84, 28, c_green, 'art_lover_42'),
    (retro_frame_id, 79, 29, c_green, 'creative_soul'),
    (retro_frame_id, 84, 29, c_green, 'creative_soul'),
    
    -- Tetris blocks
    (retro_frame_id, 100, 40, c_red, 'retro_gamer'),
    (retro_frame_id, 101, 40, c_red, 'retro_gamer'),
    (retro_frame_id, 100, 41, c_red, 'retro_gamer'),
    (retro_frame_id, 101, 41, c_red, 'retro_gamer'),
    (retro_frame_id, 103, 38, c_blue, 'digital_nomad'),
    (retro_frame_id, 103, 39, c_blue, 'digital_nomad'),
    (retro_frame_id, 103, 40, c_blue, 'digital_nomad'),
    (retro_frame_id, 104, 40, c_blue, 'digital_nomad');

  -- Character Portrait: Fantasy warrior
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Head outline
    (character_frame_id, 30, 20, c_tan, 'creative_soul'),
    (character_frame_id, 31, 20, c_tan, 'creative_soul'),
    (character_frame_id, 32, 20, c_tan, 'creative_soul'),
    (character_frame_id, 33, 20, c_tan, 'creative_soul'),
    (character_frame_id, 34, 20, c_tan, 'creative_soul'),
    (character_frame_id, 35, 20, c_tan, 'creative_soul'),
    (character_frame_id, 36, 20, c_tan, 'creative_soul'),
    (character_frame_id, 37, 20, c_tan, 'creative_soul'),
    (character_frame_id, 38, 20, c_tan, 'creative_soul'),
    (character_frame_id, 39, 20, c_tan, 'creative_soul'),
    (character_frame_id, 40, 20, c_tan, 'creative_soul'),
    (character_frame_id, 41, 20, c_tan, 'creative_soul'),
    
    -- Eyes
    (character_frame_id, 33, 23, c_black, 'pixel_master'),
    (character_frame_id, 38, 23, c_black, 'pixel_master'),
    
    -- Nose
    (character_frame_id, 35, 25, c_brown, 'art_lover_42'),
    
    -- Mouth
    (character_frame_id, 34, 27, c_dark_red, 'retro_gamer'),
    (character_frame_id, 35, 27, c_dark_red, 'retro_gamer'),
    (character_frame_id, 36, 27, c_dark_red, 'retro_gamer'),
    
    -- Hair
    (character_frame_id, 29, 18, c_brown, 'digital_nomad'),
    (character_frame_id, 30, 18, c_brown, 'digital_nomad'),
    (character_frame_id, 31, 18, c_brown, 'digital_nomad'),
    (character_frame_id, 32, 18, c_brown, 'digital_nomad'),
    (character_frame_id, 33, 18, c_brown, 'color_wizard'),
    (character_frame_id, 34, 18, c_brown, 'color_wizard'),
    (character_frame_id, 35, 18, c_brown, 'color_wizard'),
    (character_frame_id, 36, 18, c_brown, 'color_wizard'),
    (character_frame_id, 37, 18, c_brown, 'pixel_pioneer'),
    (character_frame_id, 38, 18, c_brown, 'pixel_pioneer'),
    (character_frame_id, 39, 18, c_brown, 'pixel_pioneer'),
    (character_frame_id, 40, 18, c_brown, 'pixel_pioneer'),
    (character_frame_id, 41, 18, c_brown, 'art_collective'),
    (character_frame_id, 42, 18, c_brown, 'art_collective'),
    
    -- Armor chest piece
    (character_frame_id, 32, 35, c_gray, 'minimalist_dev'),
    (character_frame_id, 33, 35, c_gray, 'minimalist_dev'),
    (character_frame_id, 34, 35, c_gray, 'minimalist_dev'),
    (character_frame_id, 35, 35, c_gray, 'minimalist_dev'),
    (character_frame_id, 36, 35, c_gray, 'rainbow_artist'),
    (character_frame_id, 37, 35, c_gray, 'rainbow_artist'),
    (character_frame_id, 38, 35, c_gray, 'rainbow_artist'),
    (character_frame_id, 39, 35, c_gray, 'rainbow_artist'),
    (character_frame_id, 31, 36, c_gray, 'pixel_master'),
    (character_frame_id, 32, 36, c_light_gray, 'pixel_master'),
    (character_frame_id, 33, 36, c_light_gray, 'pixel_master'),
    (character_frame_id, 34, 36, c_light_gray, 'pixel_master'),
    (character_frame_id, 35, 36, c_light_gray, 'art_lover_42'),
    (character_frame_id, 36, 36, c_light_gray, 'art_lover_42'),
    (character_frame_id, 37, 36, c_light_gray, 'art_lover_42'),
    (character_frame_id, 38, 36, c_light_gray, 'art_lover_42'),
    (character_frame_id, 39, 36, c_light_gray, 'creative_soul'),
    (character_frame_id, 40, 36, c_gray, 'creative_soul'),
    
    -- Sword
    (character_frame_id, 45, 30, c_light_gray, 'retro_gamer'),
    (character_frame_id, 45, 31, c_light_gray, 'retro_gamer'),
    (character_frame_id, 45, 32, c_light_gray, 'retro_gamer'),
    (character_frame_id, 45, 33, c_light_gray, 'digital_nomad'),
    (character_frame_id, 45, 34, c_light_gray, 'digital_nomad'),
    (character_frame_id, 45, 35, c_brown, 'digital_nomad'), -- Handle
    (character_frame_id, 45, 36, c_brown, 'color_wizard'),
    (character_frame_id, 45, 37, c_brown, 'color_wizard');

  -- Abstract Tower: Minimalist geometric tower
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Base of tower
    (tower_frame_id, 30, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 31, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 32, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 33, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 34, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 35, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 36, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 37, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 38, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 39, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 40, 120, c_dark_gray, 'minimalist_dev'),
    (tower_frame_id, 41, 120, c_dark_gray, 'minimalist_dev'),
    
    -- Tower shaft
    (tower_frame_id, 33, 100, c_gray, 'pixel_master'),
    (tower_frame_id, 34, 100, c_gray, 'pixel_master'),
    (tower_frame_id, 35, 100, c_gray, 'pixel_master'),
    (tower_frame_id, 36, 100, c_gray, 'pixel_master'),
    (tower_frame_id, 37, 100, c_gray, 'pixel_master'),
    (tower_frame_id, 38, 100, c_gray, 'pixel_master'),
    (tower_frame_id, 33, 80, c_light_gray, 'art_lover_42'),
    (tower_frame_id, 34, 80, c_light_gray, 'art_lover_42'),
    (tower_frame_id, 35, 80, c_light_gray, 'art_lover_42'),
    (tower_frame_id, 36, 80, c_light_gray, 'art_lover_42'),
    (tower_frame_id, 37, 80, c_light_gray, 'art_lover_42'),
    (tower_frame_id, 38, 80, c_light_gray, 'art_lover_42'),
    (tower_frame_id, 34, 60, c_white, 'creative_soul'),
    (tower_frame_id, 35, 60, c_white, 'creative_soul'),
    (tower_frame_id, 36, 60, c_white, 'creative_soul'),
    (tower_frame_id, 37, 60, c_white, 'creative_soul'),
    (tower_frame_id, 35, 40, c_light_blue, 'retro_gamer'),
    (tower_frame_id, 36, 40, c_light_blue, 'retro_gamer'),
    (tower_frame_id, 35, 20, c_blue, 'digital_nomad'),
    (tower_frame_id, 36, 20, c_blue, 'digital_nomad');

  -- Color Palette Test: All 32 colors in a grid
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Row 1
    (palette_frame_id, 0, 0, c_transparent, 'color_wizard'),
    (palette_frame_id, 1, 0, c_black, 'color_wizard'),
    (palette_frame_id, 2, 0, c_dark_gray, 'color_wizard'),
    (palette_frame_id, 3, 0, c_gray, 'color_wizard'),
    (palette_frame_id, 4, 0, c_light_gray, 'color_wizard'),
    (palette_frame_id, 5, 0, c_white, 'color_wizard'),
    (palette_frame_id, 6, 0, c_dark_red, 'color_wizard'),
    (palette_frame_id, 7, 0, c_red, 'color_wizard'),
    -- Row 2
    (palette_frame_id, 0, 1, c_orange, 'color_wizard'),
    (palette_frame_id, 1, 1, c_yellow, 'color_wizard'),
    (palette_frame_id, 2, 1, c_dark_green, 'color_wizard'),
    (palette_frame_id, 3, 1, c_green, 'color_wizard'),
    (palette_frame_id, 4, 1, c_light_green, 'color_wizard'),
    (palette_frame_id, 5, 1, c_dark_blue, 'color_wizard'),
    (palette_frame_id, 6, 1, c_blue, 'color_wizard'),
    (palette_frame_id, 7, 1, c_light_blue, 'color_wizard'),
    -- Row 3
    (palette_frame_id, 0, 2, c_dark_purple, 'color_wizard'),
    (palette_frame_id, 1, 2, c_purple, 'color_wizard'),
    (palette_frame_id, 2, 2, c_pink, 'color_wizard'),
    (palette_frame_id, 3, 2, c_brown, 'color_wizard'),
    (palette_frame_id, 4, 2, c_tan, 'color_wizard');

  -- Frozen Masterpiece: Complete smiley face
  INSERT INTO pixels (frame_id, x, y, color, contributor_handle) VALUES
    -- Face outline
    (frozen_frame_id, 20, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 21, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 22, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 23, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 24, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 25, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 26, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 27, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 28, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 29, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 30, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 31, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 32, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 33, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 34, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 35, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 36, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 37, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 38, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 39, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 40, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 41, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 42, 10, c_yellow, 'pixel_master'),
    (frozen_frame_id, 43, 10, c_yellow, 'pixel_master'),
    
    -- Eyes
    (frozen_frame_id, 26, 20, c_black, 'art_lover_42'),
    (frozen_frame_id, 27, 20, c_black, 'art_lover_42'),
    (frozen_frame_id, 36, 20, c_black, 'creative_soul'),
    (frozen_frame_id, 37, 20, c_black, 'creative_soul'),
    
    -- Smile
    (frozen_frame_id, 28, 35, c_black, 'retro_gamer'),
    (frozen_frame_id, 29, 36, c_black, 'retro_gamer'),
    (frozen_frame_id, 30, 37, c_black, 'digital_nomad'),
    (frozen_frame_id, 31, 37, c_black, 'digital_nomad'),
    (frozen_frame_id, 32, 37, c_black, 'color_wizard'),
    (frozen_frame_id, 33, 37, c_black, 'color_wizard'),
    (frozen_frame_id, 34, 36, c_black, 'pixel_pioneer'),
    (frozen_frame_id, 35, 35, c_black, 'pixel_pioneer');

  -- Insert frame permissions for approval-required frames
  INSERT INTO frame_permissions (frame_id, user_handle, permission_type, granted_by) VALUES
    -- Retro game banner permissions
    (retro_frame_id, 'pixel_master', 'contributor', 'retro_gamer'),
    (retro_frame_id, 'art_lover_42', 'contributor', 'retro_gamer'),
    (retro_frame_id, 'creative_soul', 'contributor', 'retro_gamer'),
    (retro_frame_id, 'digital_nomad', 'contributor', 'retro_gamer'),
    
    -- Character portrait permissions
    (character_frame_id, 'pixel_master', 'contributor', 'creative_soul'),
    (character_frame_id, 'art_lover_42', 'contributor', 'creative_soul'),
    (character_frame_id, 'retro_gamer', 'contributor', 'creative_soul'),
    (character_frame_id, 'digital_nomad', 'contributor', 'creative_soul'),
    (character_frame_id, 'color_wizard', 'contributor', 'creative_soul'),
    
    -- Community logo permissions
    (logo_frame_id, 'pixel_master', 'contributor', 'art_collective'),
    (logo_frame_id, 'art_lover_42', 'contributor', 'art_collective'),
    (logo_frame_id, 'creative_soul', 'contributor', 'art_collective'),
    (logo_frame_id, 'retro_gamer', 'contributor', 'art_collective'),
    (logo_frame_id, 'digital_nomad', 'contributor', 'art_collective'),
    (logo_frame_id, 'color_wizard', 'contributor', 'art_collective'),
    (logo_frame_id, 'pixel_pioneer', 'contributor', 'art_collective'),
    (logo_frame_id, 'minimalist_dev', 'contributor', 'art_collective'),
    (logo_frame_id, 'rainbow_artist', 'contributor', 'art_collective'),
    
    -- Space exploration permissions
    (space_frame_id, 'retro_gamer', 'contributor', 'pixel_pioneer'),
    (space_frame_id, 'art_collective', 'contributor', 'pixel_pioneer'),
    (space_frame_id, 'color_wizard', 'contributor', 'pixel_pioneer');

  -- Insert frame likes
  INSERT INTO frame_likes (frame_id, user_handle) VALUES
    -- Welcome banner likes
    (welcome_frame_id, 'art_lover_42'),
    (welcome_frame_id, 'creative_soul'),
    (welcome_frame_id, 'retro_gamer'),
    (welcome_frame_id, 'digital_nomad'),
    (welcome_frame_id, 'color_wizard'),
    (welcome_frame_id, 'pixel_pioneer'),
    (welcome_frame_id, 'art_collective'),
    (welcome_frame_id, 'minimalist_dev'),
    (welcome_frame_id, 'rainbow_artist'),
    
    -- Sunset landscape likes
    (sunset_frame_id, 'pixel_master'),
    (sunset_frame_id, 'creative_soul'),
    (sunset_frame_id, 'retro_gamer'),
    (sunset_frame_id, 'digital_nomad'),
    (sunset_frame_id, 'color_wizard'),
    (sunset_frame_id, 'rainbow_artist'),
    
    -- Retro game banner likes
    (retro_frame_id, 'pixel_master'),
    (retro_frame_id, 'art_lover_42'),
    (retro_frame_id, 'creative_soul'),
    (retro_frame_id, 'digital_nomad'),
    (retro_frame_id, 'color_wizard'),
    (retro_frame_id, 'pixel_pioneer'),
    (retro_frame_id, 'art_collective'),
    (retro_frame_id, 'rainbow_artist'),
    
    -- Character portrait likes
    (character_frame_id, 'pixel_master'),
    (character_frame_id, 'art_lover_42'),
    (character_frame_id, 'retro_gamer'),
    (character_frame_id, 'digital_nomad'),
    (character_frame_id, 'pixel_pioneer'),
    
    -- Abstract tower likes
    (tower_frame_id, 'pixel_master'),
    (tower_frame_id, 'art_lover_42'),
    (tower_frame_id, 'creative_soul'),
    (tower_frame_id, 'art_collective'),
    
    -- Community logo likes
    (logo_frame_id, 'pixel_master'),
    (logo_frame_id, 'art_lover_42'),
    (logo_frame_id, 'creative_soul'),
    (logo_frame_id, 'retro_gamer'),
    (logo_frame_id, 'digital_nomad'),
    (logo_frame_id, 'color_wizard'),
    (logo_frame_id, 'pixel_pioneer'),
    (logo_frame_id, 'minimalist_dev'),
    (logo_frame_id, 'rainbow_artist'),
    
    -- Mandala pattern likes
    (mandala_frame_id, 'pixel_master'),
    (mandala_frame_id, 'art_lover_42'),
    (mandala_frame_id, 'creative_soul'),
    (mandala_frame_id, 'digital_nomad'),
    (mandala_frame_id, 'art_collective'),
    
    -- Pixel pet cafe likes
    (cafe_frame_id, 'pixel_master'),
    (cafe_frame_id, 'art_lover_42'),
    (cafe_frame_id, 'creative_soul'),
    (cafe_frame_id, 'retro_gamer'),
    (cafe_frame_id, 'color_wizard'),
    (cafe_frame_id, 'pixel_pioneer'),
    (cafe_frame_id, 'rainbow_artist'),
    
    -- Space exploration likes
    (space_frame_id, 'art_lover_42'),
    (space_frame_id, 'creative_soul'),
    (space_frame_id, 'retro_gamer'),
    (space_frame_id, 'digital_nomad'),
    
    -- Epic battle scene likes
    (epic_frame_id, 'pixel_master'),
    (epic_frame_id, 'art_lover_42'),
    (epic_frame_id, 'creative_soul'),
    (epic_frame_id, 'retro_gamer'),
    (epic_frame_id, 'digital_nomad'),
    (epic_frame_id, 'color_wizard'),
    (epic_frame_id, 'pixel_pioneer'),
    (epic_frame_id, 'minimalist_dev'),
    (epic_frame_id, 'rainbow_artist'),
    
    -- Frozen masterpiece likes
    (frozen_frame_id, 'art_lover_42'),
    (frozen_frame_id, 'creative_soul'),
    (frozen_frame_id, 'retro_gamer'),
    (frozen_frame_id, 'digital_nomad'),
    (frozen_frame_id, 'color_wizard'),
    (frozen_frame_id, 'art_collective'),
    (frozen_frame_id, 'rainbow_artist');

  -- Insert some sample frame snapshots for frames with significant pixel data
  INSERT INTO frame_snapshots (frame_id, snapshot_data, pixel_count) 
  SELECT 
    f.id,
    E'\\x1f8b08000000000000000313f3c8540400d7ab4f0500000000'::bytea, -- Placeholder compressed data
    (SELECT COUNT(*) FROM pixels WHERE frame_id = f.id)
  FROM frames f 
  WHERE f.handle IN ('welcome-to-pixels', 'sunset-landscape', 'retro-game-banner', 'character-portrait', 'frozen-masterpiece');

END $$;

-- Add some additional collaborative activity timestamps
UPDATE pixels SET placed_at = NOW() - INTERVAL '1 day' WHERE contributor_handle = 'pixel_master';
UPDATE pixels SET placed_at = NOW() - INTERVAL '2 hours' WHERE contributor_handle = 'art_lover_42';
UPDATE pixels SET placed_at = NOW() - INTERVAL '30 minutes' WHERE contributor_handle = 'creative_soul';
UPDATE pixels SET placed_at = NOW() - INTERVAL '15 minutes' WHERE contributor_handle = 'retro_gamer';
UPDATE pixels SET placed_at = NOW() - INTERVAL '5 minutes' WHERE contributor_handle = 'digital_nomad';

-- Update user pixel refill times to show realistic usage patterns
UPDATE users SET last_refill = NOW() - INTERVAL '30 minutes' WHERE handle = 'pixel_master';
UPDATE users SET last_refill = NOW() - INTERVAL '45 minutes' WHERE handle = 'art_lover_42';
UPDATE users SET last_refill = NOW() - INTERVAL '1 hour' WHERE handle = 'creative_soul';
UPDATE users SET last_refill = NOW() - INTERVAL '2 hours' WHERE handle = 'retro_gamer';
UPDATE users SET last_refill = NOW() - INTERVAL '3 hours' WHERE handle = 'digital_nomad';