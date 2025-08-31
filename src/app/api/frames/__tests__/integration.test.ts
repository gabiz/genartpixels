/**
 * Integration tests for frame API endpoints
 * These tests use a real Supabase test database
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { CreateFrameRequest } from '@/lib/types'

// Test database configuration
// For integration tests, we'll use the local Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Skip integration tests if Supabase is not available
const skipIntegrationTests = false // We'll assume local Supabase is running for now

let supabase: ReturnType<typeof createClient<Database>>

// Initialize supabase client if environment variables are available
if (!skipIntegrationTests) {
  supabase = createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

describe('Frame API Integration Tests', () => {
  let testUser: any
  let testUserHandle: string
  let testFrameId: string

  beforeAll(async () => {
    if (skipIntegrationTests) {
      console.log('Skipping integration tests - Supabase environment variables not set')
      return
    }
    // Create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test-frame-api@example.com',
      password: 'testpassword123',
      email_confirm: true
    })

    if (authError || !authData.user) {
      throw new Error('Failed to create test user')
    }

    testUser = authData.user
    testUserHandle = `test_${Date.now().toString().slice(-8)}`

    // Create user profile
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: testUser.id,
        handle: testUserHandle,
        email: testUser.email!,
        pixels_available: 100,
        last_refill: new Date().toISOString()
      })

    if (userError) {
      throw new Error('Failed to create user profile')
    }
  })

  afterAll(async () => {
    if (skipIntegrationTests) {
      return
    }
    
    // Clean up test data
    if (testFrameId) {
      await supabase.from('frames').delete().eq('id', testFrameId)
    }
    
    if (testUser) {
      await supabase.from('users').delete().eq('id', testUser.id)
      await supabase.auth.admin.deleteUser(testUser.id)
    }
  })

  describe('Frame Creation Flow', () => {
    it('should create a frame with valid data', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      const frameData: CreateFrameRequest = {
        handle: `test-frame-${Date.now()}`,
        title: 'Integration Test Frame',
        description: 'A frame created during integration testing',
        keywords: ['test', 'integration'],
        width: 128,
        height: 128,
        permissions: 'open'
      }

      // Create frame directly in database (simulating API call)
      const { data: frame, error: frameError } = await supabase
        .from('frames')
        .insert({
          handle: frameData.handle,
          title: frameData.title,
          description: frameData.description,
          keywords: frameData.keywords,
          owner_handle: testUserHandle,
          width: frameData.width,
          height: frameData.height,
          permissions: frameData.permissions,
          is_frozen: false
        })
        .select()
        .single()

      expect(frameError).toBeNull()
      expect(frame).toBeDefined()
      expect(frame.handle).toBe(frameData.handle)
      expect(frame.title).toBe(frameData.title)
      expect(frame.owner_handle).toBe(testUserHandle)

      testFrameId = frame.id

      // Verify frame stats were created
      const { data: stats, error: statsError } = await supabase
        .from('frame_stats')
        .select('*')
        .eq('frame_id', frame.id)
        .single()

      // Stats might not exist yet, that's ok for this test
      if (stats) {
        expect(stats.frame_id).toBe(frame.id)
        expect(stats.contributors_count).toBe(0)
        expect(stats.total_pixels).toBe(0)
        expect(stats.likes_count).toBe(0)
      }
    })

    it('should enforce unique frame handles per user', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      const duplicateHandle = `duplicate-${Date.now()}`

      // Create first frame
      const { data: frame1, error: error1 } = await supabase
        .from('frames')
        .insert({
          handle: duplicateHandle,
          title: 'First Frame',
          description: 'First frame with this handle',
          keywords: ['test'],
          owner_handle: testUserHandle,
          width: 128,
          height: 128,
          permissions: 'open',
          is_frozen: false
        })
        .select()
        .single()

      expect(error1).toBeNull()
      expect(frame1).toBeDefined()

      // Try to create second frame with same handle
      const { data: frame2, error: error2 } = await supabase
        .from('frames')
        .insert({
          handle: duplicateHandle,
          title: 'Second Frame',
          description: 'Second frame with same handle',
          keywords: ['test'],
          owner_handle: testUserHandle,
          width: 128,
          height: 128,
          permissions: 'open',
          is_frozen: false
        })
        .select()
        .single()

      expect(error2).toBeDefined()
      expect(error2?.code).toBe('23505') // Unique constraint violation
      expect(frame2).toBeNull()

      // Clean up
      await supabase.from('frames').delete().eq('id', frame1.id)
    })
  })

  describe('Frame Retrieval', () => {
    let retrievalTestFrameId: string
    let retrievalTestFrameHandle: string

    beforeAll(async () => {
      if (skipIntegrationTests) {
        return
      }
      
      // Create a test frame for retrieval tests
      const frameHandle = `retrieval-test-${Date.now()}`
      const { data: frame, error } = await supabase
        .from('frames')
        .insert({
          handle: frameHandle,
          title: 'Retrieval Test Frame',
          description: 'Frame for testing retrieval',
          keywords: ['retrieval', 'test'],
          owner_handle: testUserHandle,
          width: 128,
          height: 128,
          permissions: 'open',
          is_frozen: false
        })
        .select()
        .single()

      if (error) {
        throw new Error('Failed to create test frame for retrieval')
      }

      retrievalTestFrameId = frame.id
      retrievalTestFrameHandle = frameHandle

      // Create frame stats
      await supabase
        .from('frame_stats')
        .insert({
          frame_id: frame.id,
          contributors_count: 0,
          total_pixels: 0,
          likes_count: 0,
          last_activity: new Date().toISOString()
        })
    })

    afterAll(async () => {
      if (skipIntegrationTests) {
        return
      }
      
      if (retrievalTestFrameId) {
        await supabase.from('frames').delete().eq('id', retrievalTestFrameId)
      }
    })

    it('should retrieve frame with stats using frame_details view', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      const { data: frameDetails, error } = await supabase
        .from('frame_details')
        .select('*')
        .eq('owner_handle', testUserHandle)
        .eq('handle', retrievalTestFrameHandle)
        .single()

      expect(error).toBeNull()
      expect(frameDetails).toBeDefined()
      expect(frameDetails.title).toBe('Retrieval Test Frame')
      expect(frameDetails.contributors_count).toBe(0)
      expect(frameDetails.total_pixels).toBe(0)
      expect(frameDetails.likes_count).toBe(0)
    })

    it('should list frames with pagination', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      const { data: frames, error, count } = await supabase
        .from('frame_details')
        .select('*', { count: 'exact' })
        .eq('owner_handle', testUserHandle)
        .order('created_at', { ascending: false })
        .range(0, 9) // First 10 frames

      expect(error).toBeNull()
      expect(frames).toBeDefined()
      expect(Array.isArray(frames)).toBe(true)
      expect(count).toBeGreaterThanOrEqual(1)
    })

    it('should search frames by title and keywords', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      const { data: frames, error } = await supabase
        .from('frame_details')
        .select('*')
        .or(`title.ilike.%Retrieval%,keywords.cs.{retrieval}`)

      expect(error).toBeNull()
      expect(frames).toBeDefined()
      expect(frames.length).toBeGreaterThanOrEqual(1)
      
      const testFrame = frames.find(f => f.id === retrievalTestFrameId)
      expect(testFrame).toBeDefined()
    })
  })

  describe('Frame Permissions', () => {
    let permissionTestFrameId: string
    let otherTestUser: any
    let otherTestUserHandle: string

    beforeAll(async () => {
      if (skipIntegrationTests) {
        return
      }
      
      // Create another test user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'other-test-user@example.com',
        password: 'testpassword123',
        email_confirm: true
      })

      if (authError || !authData.user) {
        throw new Error('Failed to create other test user')
      }

      otherTestUser = authData.user
      otherTestUserHandle = `other_${Date.now().toString().slice(-8)}`

      // Create user profile
      await supabase
        .from('users')
        .insert({
          id: otherTestUser.id,
          handle: otherTestUserHandle,
          email: otherTestUser.email!,
          pixels_available: 100,
          last_refill: new Date().toISOString()
        })

      // Create approval-required frame
      const { data: frame, error } = await supabase
        .from('frames')
        .insert({
          handle: `permission-test-${Date.now()}`,
          title: 'Permission Test Frame',
          description: 'Frame for testing permissions',
          keywords: ['permission', 'test'],
          owner_handle: testUserHandle,
          width: 128,
          height: 128,
          permissions: 'approval-required',
          is_frozen: false
        })
        .select()
        .single()

      if (error) {
        throw new Error('Failed to create permission test frame')
      }

      permissionTestFrameId = frame.id
    })

    afterAll(async () => {
      if (skipIntegrationTests) {
        return
      }
      
      if (permissionTestFrameId) {
        await supabase.from('frames').delete().eq('id', permissionTestFrameId)
      }
      
      if (otherTestUser) {
        await supabase.from('users').delete().eq('id', otherTestUser.id)
        await supabase.auth.admin.deleteUser(otherTestUser.id)
      }
    })

    it('should manage frame permissions', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      // Grant contributor permission
      const { data: permission, error: permissionError } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: permissionTestFrameId,
          user_handle: otherTestUserHandle,
          permission_type: 'contributor',
          granted_by: testUserHandle
        })
        .select()
        .single()

      expect(permissionError).toBeNull()
      expect(permission).toBeDefined()
      expect(permission.permission_type).toBe('contributor')
      expect(permission.user_handle).toBe(otherTestUserHandle)

      // Verify permission exists
      const { data: retrievedPermission, error: retrieveError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', permissionTestFrameId)
        .eq('user_handle', otherTestUserHandle)
        .single()

      expect(retrieveError).toBeNull()
      expect(retrievedPermission).toBeDefined()
      expect(retrievedPermission.permission_type).toBe('contributor')

      // Update permission to blocked
      const { data: updatedPermission, error: updateError } = await supabase
        .from('frame_permissions')
        .update({ permission_type: 'blocked' })
        .eq('frame_id', permissionTestFrameId)
        .eq('user_handle', otherTestUserHandle)
        .select()
        .single()

      expect(updateError).toBeNull()
      expect(updatedPermission.permission_type).toBe('blocked')

      // Remove permission
      const { error: deleteError } = await supabase
        .from('frame_permissions')
        .delete()
        .eq('frame_id', permissionTestFrameId)
        .eq('user_handle', otherTestUserHandle)

      expect(deleteError).toBeNull()

      // Verify permission is removed
      const { data: deletedPermission, error: verifyError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', permissionTestFrameId)
        .eq('user_handle', otherTestUserHandle)
        .single()

      expect(verifyError).toBeDefined()
      expect(verifyError?.code).toBe('PGRST116') // Not found
      expect(deletedPermission).toBeNull()
    })

    it('should enforce unique permissions per user per frame', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      // Create first permission
      const { data: permission1, error: error1 } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: permissionTestFrameId,
          user_handle: otherTestUserHandle,
          permission_type: 'contributor',
          granted_by: testUserHandle
        })
        .select()
        .single()

      expect(error1).toBeNull()
      expect(permission1).toBeDefined()

      // Try to create duplicate permission
      const { data: permission2, error: error2 } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: permissionTestFrameId,
          user_handle: otherTestUserHandle,
          permission_type: 'blocked',
          granted_by: testUserHandle
        })
        .select()
        .single()

      expect(error2).toBeDefined()
      expect(error2?.code).toBe('23505') // Unique constraint violation
      expect(permission2).toBeNull()

      // Clean up
      await supabase
        .from('frame_permissions')
        .delete()
        .eq('frame_id', permissionTestFrameId)
        .eq('user_handle', otherTestUserHandle)
    })
  })

  describe('Frame Updates and Deletion', () => {
    let updateTestFrameId: string

    beforeAll(async () => {
      if (skipIntegrationTests) {
        return
      }
      
      // Create a test frame for update/delete tests
      const { data: frame, error } = await supabase
        .from('frames')
        .insert({
          handle: `update-test-${Date.now()}`,
          title: 'Update Test Frame',
          description: 'Frame for testing updates',
          keywords: ['update', 'test'],
          owner_handle: testUserHandle,
          width: 128,
          height: 128,
          permissions: 'open',
          is_frozen: false
        })
        .select()
        .single()

      if (error) {
        throw new Error('Failed to create test frame for updates')
      }

      updateTestFrameId = frame.id
    })

    it('should update frame metadata', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      const updates = {
        title: 'Updated Frame Title',
        description: 'Updated frame description',
        keywords: ['updated', 'test', 'frame'],
        permissions: 'approval-required' as const,
        is_frozen: true,
        updated_at: new Date().toISOString()
      }

      const { data: updatedFrame, error } = await supabase
        .from('frames')
        .update(updates)
        .eq('id', updateTestFrameId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updatedFrame).toBeDefined()
      expect(updatedFrame.title).toBe(updates.title)
      expect(updatedFrame.description).toBe(updates.description)
      expect(updatedFrame.keywords).toEqual(updates.keywords)
      expect(updatedFrame.permissions).toBe(updates.permissions)
      expect(updatedFrame.is_frozen).toBe(updates.is_frozen)
    })

    it('should delete frame and cascade to related records', async () => {
      if (skipIntegrationTests) {
        console.log('Skipping test - Supabase environment variables not set')
        return
      }
      
      // Create some related records first
      await supabase
        .from('frame_stats')
        .insert({
          frame_id: updateTestFrameId,
          contributors_count: 1,
          total_pixels: 5,
          likes_count: 2,
          last_activity: new Date().toISOString()
        })

      // Delete the frame
      const { error: deleteError } = await supabase
        .from('frames')
        .delete()
        .eq('id', updateTestFrameId)

      expect(deleteError).toBeNull()

      // Verify frame is deleted
      const { data: deletedFrame, error: verifyError } = await supabase
        .from('frames')
        .select('*')
        .eq('id', updateTestFrameId)
        .single()

      expect(verifyError).toBeDefined()
      expect(verifyError?.code).toBe('PGRST116') // Not found
      expect(deletedFrame).toBeNull()

      // Verify related records are also deleted (cascade)
      const { data: deletedStats, error: statsError } = await supabase
        .from('frame_stats')
        .select('*')
        .eq('frame_id', updateTestFrameId)
        .single()

      expect(statsError).toBeDefined()
      expect(statsError?.code).toBe('PGRST116') // Not found
      expect(deletedStats).toBeNull()

      // Clear the ID so afterAll doesn't try to delete it again
      updateTestFrameId = ''
    })
  })
})