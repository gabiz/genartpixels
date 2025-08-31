/**
 * Integration tests for database schema and constraints
 * These tests verify that the database schema works correctly with proper validation
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// Test database configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

describe('Database Schema Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await supabase.from('frame_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('pixels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('frame_permissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('frame_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('frame_stats').delete().neq('frame_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('frames').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  describe('Users Table', () => {
    test('should create user with valid handle', async () => {
      const { data, error } = await supabase
        .from('users')
        .insert({
          handle: 'testuser',
          email: 'test@example.com'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        handle: 'testuser',
        email: 'test@example.com',
        pixels_available: 100
      });
    });

    test('should reject handle shorter than 5 characters', async () => {
      const { error } = await supabase
        .from('users')
        .insert({
          handle: 'test',
          email: 'test@example.com'
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });

    test('should reject handle longer than 20 characters', async () => {
      const { error } = await supabase
        .from('users')
        .insert({
          handle: 'thishandleistoolongtobevalid',
          email: 'test@example.com'
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('too long for type character varying');
    });

    test('should enforce unique handles', async () => {
      await supabase
        .from('users')
        .insert({
          handle: 'uniqueuser',
          email: 'test1@example.com'
        });

      const { error } = await supabase
        .from('users')
        .insert({
          handle: 'uniqueuser',
          email: 'test2@example.com'
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('duplicate key value');
    });

    test('should validate pixels_available range', async () => {
      const { error } = await supabase
        .from('users')
        .insert({
          handle: 'testuser',
          email: 'test@example.com',
          pixels_available: 150
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });
  });

  describe('Frames Table', () => {
    let testUserId: string;

    beforeEach(async () => {
      const { data } = await supabase
        .from('users')
        .insert({
          handle: 'frameowner',
          email: 'owner@example.com'
        })
        .select()
        .single();
      testUserId = data!.id;
    });

    test('should create frame with valid data', async () => {
      const { data, error } = await supabase
        .from('frames')
        .insert({
          handle: 'test-frame',
          title: 'Test Frame',
          description: 'A test frame',
          keywords: ['test', 'pixel-art'],
          owner_handle: 'frameowner',
          width: 128,
          height: 128
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        handle: 'test-frame',
        title: 'Test Frame',
        owner_handle: 'frameowner',
        width: 128,
        height: 128,
        permissions: 'open',
        is_frozen: false
      });
    });

    test('should automatically create frame stats when frame is created', async () => {
      const { data: frame } = await supabase
        .from('frames')
        .insert({
          handle: 'stats-test',
          title: 'Stats Test Frame',
          owner_handle: 'frameowner',
          width: 64,
          height: 64
        })
        .select()
        .single();

      const { data: stats, error } = await supabase
        .from('frame_stats')
        .select()
        .eq('frame_id', frame!.id)
        .single();

      expect(error).toBeNull();
      expect(stats).toMatchObject({
        frame_id: frame!.id,
        contributors_count: 0,
        total_pixels: 0,
        likes_count: 0
      });
    });

    test('should reject frame handle shorter than 3 characters', async () => {
      const { error } = await supabase
        .from('frames')
        .insert({
          handle: 'ab',
          title: 'Test Frame',
          owner_handle: 'frameowner',
          width: 128,
          height: 128
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });

    test('should enforce unique frame handle per owner', async () => {
      await supabase
        .from('frames')
        .insert({
          handle: 'duplicate-test',
          title: 'First Frame',
          owner_handle: 'frameowner',
          width: 128,
          height: 128
        });

      const { error } = await supabase
        .from('frames')
        .insert({
          handle: 'duplicate-test',
          title: 'Second Frame',
          owner_handle: 'frameowner',
          width: 64,
          height: 64
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('duplicate key value');
    });

    test('should validate frame dimensions', async () => {
      const { error } = await supabase
        .from('frames')
        .insert({
          handle: 'invalid-size',
          title: 'Invalid Size Frame',
          owner_handle: 'frameowner',
          width: 0,
          height: 128
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });

    test('should validate permissions enum', async () => {
      const { error } = await supabase
        .from('frames')
        .insert({
          handle: 'invalid-perms',
          title: 'Invalid Permissions',
          owner_handle: 'frameowner',
          width: 128,
          height: 128,
          permissions: 'invalid' as any
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });
  });

  describe('Pixels Table', () => {
    let frameId: string;
    let contributorHandle: string;

    beforeEach(async () => {
      // Create test user
      await supabase
        .from('users')
        .insert({
          handle: 'pixelartist',
          email: 'artist@example.com'
        });
      contributorHandle = 'pixelartist';

      // Create test frame
      const { data: frame } = await supabase
        .from('frames')
        .insert({
          handle: 'pixel-test',
          title: 'Pixel Test Frame',
          owner_handle: 'pixelartist',
          width: 10,
          height: 10
        })
        .select()
        .single();
      frameId = frame!.id;
    });

    test('should place pixel with valid coordinates', async () => {
      const { data, error } = await supabase
        .from('pixels')
        .insert({
          frame_id: frameId,
          x: 5,
          y: 5,
          color: 4294901760, // Red in decimal (0xFFFF0000)
          contributor_handle: contributorHandle
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        frame_id: frameId,
        x: 5,
        y: 5,
        color: 4294901760,
        contributor_handle: contributorHandle
      });
    });

    test('should update frame stats when pixel is placed', async () => {
      await supabase
        .from('pixels')
        .insert({
          frame_id: frameId,
          x: 1,
          y: 1,
          color: 4278255360, // Green in decimal (0xFF00FF00)
          contributor_handle: contributorHandle
        });

      const { data: stats } = await supabase
        .from('frame_stats')
        .select()
        .eq('frame_id', frameId)
        .single();

      expect(stats).toMatchObject({
        contributors_count: 1,
        total_pixels: 1
      });
    });

    test('should reject pixel outside frame boundaries', async () => {
      const { error } = await supabase
        .from('pixels')
        .insert({
          frame_id: frameId,
          x: 15, // Frame is only 10x10
          y: 5,
          color: 4294901760, // Red in decimal
          contributor_handle: contributorHandle
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('outside frame dimensions');
    });

    test('should enforce unique pixel coordinates per frame', async () => {
      await supabase
        .from('pixels')
        .insert({
          frame_id: frameId,
          x: 3,
          y: 3,
          color: 4294901760, // Red in decimal
          contributor_handle: contributorHandle
        });

      const { error } = await supabase
        .from('pixels')
        .insert({
          frame_id: frameId,
          x: 3,
          y: 3,
          color: 4278255360, // Green in decimal
          contributor_handle: contributorHandle
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('duplicate key value');
    });

    test('should validate negative coordinates', async () => {
      const { error } = await supabase
        .from('pixels')
        .insert({
          frame_id: frameId,
          x: -1,
          y: 5,
          color: 4294901760, // Red in decimal
          contributor_handle: contributorHandle
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });
  });

  describe('Frame Permissions Table', () => {
    let frameId: string;
    let ownerHandle: string;
    let userHandle: string;

    beforeEach(async () => {
      // Create owner
      await supabase
        .from('users')
        .insert({
          handle: 'frameowner',
          email: 'owner@example.com'
        });
      ownerHandle = 'frameowner';

      // Create regular user
      await supabase
        .from('users')
        .insert({
          handle: 'regularuser',
          email: 'user@example.com'
        });
      userHandle = 'regularuser';

      // Create frame
      const { data: frame } = await supabase
        .from('frames')
        .insert({
          handle: 'perm-test',
          title: 'Permission Test Frame',
          owner_handle: ownerHandle,
          width: 64,
          height: 64
        })
        .select()
        .single();
      frameId = frame!.id;
    });

    test('should create frame permission', async () => {
      const { data, error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: frameId,
          user_handle: userHandle,
          permission_type: 'contributor',
          granted_by: ownerHandle
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        frame_id: frameId,
        user_handle: userHandle,
        permission_type: 'contributor',
        granted_by: ownerHandle
      });
    });

    test('should validate permission type enum', async () => {
      const { error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: frameId,
          user_handle: userHandle,
          permission_type: 'invalid' as any,
          granted_by: ownerHandle
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });

    test('should enforce unique permission per user per frame', async () => {
      await supabase
        .from('frame_permissions')
        .insert({
          frame_id: frameId,
          user_handle: userHandle,
          permission_type: 'contributor',
          granted_by: ownerHandle
        });

      const { error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: frameId,
          user_handle: userHandle,
          permission_type: 'blocked',
          granted_by: ownerHandle
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('duplicate key value');
    });
  });

  describe('Frame Likes Table', () => {
    let frameId: string;
    let userHandle: string;

    beforeEach(async () => {
      // Create user
      await supabase
        .from('users')
        .insert({
          handle: 'liker',
          email: 'liker@example.com'
        });
      userHandle = 'liker';

      // Create frame
      const { data: frame } = await supabase
        .from('frames')
        .insert({
          handle: 'like-test',
          title: 'Like Test Frame',
          owner_handle: 'liker',
          width: 32,
          height: 32
        })
        .select()
        .single();
      frameId = frame!.id;
    });

    test('should create frame like', async () => {
      const { data, error } = await supabase
        .from('frame_likes')
        .insert({
          frame_id: frameId,
          user_handle: userHandle
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        frame_id: frameId,
        user_handle: userHandle
      });
    });

    test('should update frame stats when like is added', async () => {
      await supabase
        .from('frame_likes')
        .insert({
          frame_id: frameId,
          user_handle: userHandle
        });

      const { data: stats } = await supabase
        .from('frame_stats')
        .select()
        .eq('frame_id', frameId)
        .single();

      expect(stats?.likes_count).toBe(1);
    });

    test('should update frame stats when like is removed', async () => {
      const { data: like } = await supabase
        .from('frame_likes')
        .insert({
          frame_id: frameId,
          user_handle: userHandle
        })
        .select()
        .single();

      await supabase
        .from('frame_likes')
        .delete()
        .eq('id', like!.id);

      const { data: stats } = await supabase
        .from('frame_stats')
        .select()
        .eq('frame_id', frameId)
        .single();

      expect(stats?.likes_count).toBe(0);
    });

    test('should enforce unique like per user per frame', async () => {
      await supabase
        .from('frame_likes')
        .insert({
          frame_id: frameId,
          user_handle: userHandle
        });

      const { error } = await supabase
        .from('frame_likes')
        .insert({
          frame_id: frameId,
          user_handle: userHandle
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('duplicate key value');
    });
  });

  describe('Frame Snapshots Table', () => {
    let frameId: string;

    beforeEach(async () => {
      // Create user and frame
      await supabase
        .from('users')
        .insert({
          handle: 'snapshotuser',
          email: 'snapshot@example.com'
        });

      const { data: frame } = await supabase
        .from('frames')
        .insert({
          handle: 'snapshot-test',
          title: 'Snapshot Test Frame',
          owner_handle: 'snapshotuser',
          width: 16,
          height: 16
        })
        .select()
        .single();
      frameId = frame!.id;
    });

    test('should create frame snapshot', async () => {
      const snapshotData = new Uint8Array([1, 2, 3, 4, 5]);
      
      const { data, error } = await supabase
        .from('frame_snapshots')
        .insert({
          frame_id: frameId,
          snapshot_data: snapshotData,
          pixel_count: 10
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        frame_id: frameId,
        pixel_count: 10
      });
    });

    test('should validate pixel count is non-negative', async () => {
      const { error } = await supabase
        .from('frame_snapshots')
        .insert({
          frame_id: frameId,
          snapshot_data: new Uint8Array([1, 2, 3]),
          pixel_count: -1
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('check constraint');
    });
  });

  describe('Database Views', () => {
    let frameId: string;
    let userHandle: string;

    beforeEach(async () => {
      // Create test data
      await supabase
        .from('users')
        .insert({
          handle: 'viewtester',
          email: 'view@example.com'
        });
      userHandle = 'viewtester';

      const { data: frame } = await supabase
        .from('frames')
        .insert({
          handle: 'view-test',
          title: 'View Test Frame',
          owner_handle: userHandle,
          width: 8,
          height: 8
        })
        .select()
        .single();
      frameId = frame!.id;

      // Add some pixels and likes
      await supabase
        .from('pixels')
        .insert({
          frame_id: frameId,
          x: 0,
          y: 0,
          color: 4294901760, // Red in decimal
          contributor_handle: userHandle
        });

      await supabase
        .from('frame_likes')
        .insert({
          frame_id: frameId,
          user_handle: userHandle
        });
    });

    test('should query frame_details view', async () => {
      const { data, error } = await supabase
        .from('frame_details')
        .select('*')
        .eq('id', frameId)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        handle: 'view-test',
        title: 'View Test Frame',
        contributors_count: 1,
        total_pixels: 1,
        likes_count: 1
      });
    });

    test('should query user_stats view', async () => {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('handle', userHandle)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        handle: userHandle,
        frames_created: 1,
        frames_contributed_to: 1,
        total_pixels_placed: 1,
        frames_liked: 1
      });
    });
  });
});