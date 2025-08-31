/**
 * Integration tests for frame permission management endpoints
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Test database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Skip integration tests if environment variables are not set
const skipIntegrationTests = !supabaseUrl || !supabaseServiceKey

let supabase: ReturnType<typeof createClient<Database>>
if (!skipIntegrationTests) {
  supabase = createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

describe('Frame Permission Management Integration Tests', () => {
  let testUser: any
  let testUserHandle: string
  let otherTestUser: any
  let otherTestUserHandle: string
  let testFrameId: string
  let testFrameHandle: string

  beforeAll(async () => {
    if (skipIntegrationTests) {
      console.log('Skipping integration tests - Supabase environment variables not set')
      return
    }

    // Create test users
    const { data: authData1, error: authError1 } = await supabase.auth.admin.createUser({
      email: 'test-permissions-owner@example.com',
      password: 'testpassword123',
      email_confirm: true
    })

    if (authError1 || !authData1.user) {
      throw new Error('Failed to create test user 1')
    }

    testUser = authData1.user
    testUserHandle = `testowner_${Date.now()}`

    const { data: authData2, error: authError2 } = await supabase.auth.admin.createUser({
      email: 'test-permissions-user@example.com',
      password: 'testpassword123',
      email_confirm: true
    })

    if (authError2 || !authData2.user) {
      throw new Error('Failed to create test user 2')
    }

    otherTestUser = authData2.user
    otherTestUserHandle = `testuser_${Date.now()}`

    // Create user profiles
    await supabase.from('users').insert([
      {
        id: testUser.id,
        handle: testUserHandle,
        email: testUser.email!,
        pixels_available: 100,
        last_refill: new Date().toISOString()
      },
      {
        id: otherTestUser.id,
        handle: otherTestUserHandle,
        email: otherTestUser.email!,
        pixels_available: 100,
        last_refill: new Date().toISOString()
      }
    ])

    // Create test frame
    testFrameHandle = `permission-test-${Date.now()}`
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .insert({
        handle: testFrameHandle,
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

    if (frameError || !frame) {
      throw new Error('Failed to create test frame')
    }

    testFrameId = frame.id
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

    if (otherTestUser) {
      await supabase.from('users').delete().eq('id', otherTestUser.id)
      await supabase.auth.admin.deleteUser(otherTestUser.id)
    }
  })

  describe('Permission CRUD Operations', () => {
    it('should grant contributor permission', async () => {
      if (skipIntegrationTests) return

      const { data: permission, error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: testFrameId,
          user_handle: otherTestUserHandle,
          permission_type: 'contributor',
          granted_by: testUserHandle
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(permission).toBeDefined()
      expect(permission.permission_type).toBe('contributor')
      expect(permission.user_handle).toBe(otherTestUserHandle)
      expect(permission.granted_by).toBe(testUserHandle)
    })

    it('should list frame permissions', async () => {
      if (skipIntegrationTests) return

      const { data: permissions, error } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', testFrameId)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(permissions).toBeDefined()
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThanOrEqual(1)

      const userPermission = permissions.find(p => p.user_handle === otherTestUserHandle)
      expect(userPermission).toBeDefined()
      expect(userPermission?.permission_type).toBe('contributor')
    })

    it('should update permission type', async () => {
      if (skipIntegrationTests) return

      const { data: updatedPermission, error } = await supabase
        .from('frame_permissions')
        .update({ permission_type: 'blocked' })
        .eq('frame_id', testFrameId)
        .eq('user_handle', otherTestUserHandle)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updatedPermission).toBeDefined()
      expect(updatedPermission.permission_type).toBe('blocked')
    })

    it('should handle upsert operations', async () => {
      if (skipIntegrationTests) return

      // Upsert should update existing permission
      const { data: upsertedPermission, error } = await supabase
        .from('frame_permissions')
        .upsert({
          frame_id: testFrameId,
          user_handle: otherTestUserHandle,
          permission_type: 'pending',
          granted_by: testUserHandle
        }, {
          onConflict: 'frame_id,user_handle'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(upsertedPermission).toBeDefined()
      expect(upsertedPermission.permission_type).toBe('pending')
    })

    it('should remove permission', async () => {
      if (skipIntegrationTests) return

      const { error } = await supabase
        .from('frame_permissions')
        .delete()
        .eq('frame_id', testFrameId)
        .eq('user_handle', otherTestUserHandle)

      expect(error).toBeNull()

      // Verify permission is removed
      const { data: deletedPermission, error: verifyError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', testFrameId)
        .eq('user_handle', otherTestUserHandle)
        .single()

      expect(verifyError).toBeDefined()
      expect(verifyError?.code).toBe('PGRST116') // Not found
      expect(deletedPermission).toBeNull()
    })
  })

  describe('Permission Constraints', () => {
    it('should enforce unique permissions per user per frame', async () => {
      if (skipIntegrationTests) return

      // Create first permission
      const { data: permission1, error: error1 } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: testFrameId,
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
          frame_id: testFrameId,
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
        .eq('frame_id', testFrameId)
        .eq('user_handle', otherTestUserHandle)
    })

    it('should validate permission types', async () => {
      if (skipIntegrationTests) return

      const validTypes = ['contributor', 'blocked', 'pending']
      
      for (const permissionType of validTypes) {
        const { data: permission, error } = await supabase
          .from('frame_permissions')
          .insert({
            frame_id: testFrameId,
            user_handle: otherTestUserHandle,
            permission_type: permissionType as any,
            granted_by: testUserHandle
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(permission).toBeDefined()
        expect(permission.permission_type).toBe(permissionType)

        // Clean up
        await supabase
          .from('frame_permissions')
          .delete()
          .eq('frame_id', testFrameId)
          .eq('user_handle', otherTestUserHandle)
      }
    })

    it('should require valid user handles', async () => {
      if (skipIntegrationTests) return

      const { data: permission, error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: testFrameId,
          user_handle: 'nonexistent_user',
          permission_type: 'contributor',
          granted_by: testUserHandle
        })
        .select()
        .single()

      // This should fail due to foreign key constraint
      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
      expect(permission).toBeNull()
    })
  })

  describe('Permission Queries', () => {
    beforeAll(async () => {
      if (skipIntegrationTests) return

      // Set up test permissions
      await supabase.from('frame_permissions').insert([
        {
          frame_id: testFrameId,
          user_handle: otherTestUserHandle,
          permission_type: 'contributor',
          granted_by: testUserHandle
        }
      ])
    })

    afterAll(async () => {
      if (skipIntegrationTests) return

      // Clean up test permissions
      await supabase
        .from('frame_permissions')
        .delete()
        .eq('frame_id', testFrameId)
    })

    it('should query permissions by frame', async () => {
      if (skipIntegrationTests) return

      const { data: permissions, error } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', testFrameId)

      expect(error).toBeNull()
      expect(permissions).toBeDefined()
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThanOrEqual(1)
    })

    it('should query permissions by user', async () => {
      if (skipIntegrationTests) return

      const { data: permissions, error } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('user_handle', otherTestUserHandle)

      expect(error).toBeNull()
      expect(permissions).toBeDefined()
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThanOrEqual(1)
    })

    it('should query specific user permission for frame', async () => {
      if (skipIntegrationTests) return

      const { data: permission, error } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', testFrameId)
        .eq('user_handle', otherTestUserHandle)
        .single()

      expect(error).toBeNull()
      expect(permission).toBeDefined()
      expect(permission.permission_type).toBe('contributor')
    })

    it('should filter permissions by type', async () => {
      if (skipIntegrationTests) return

      const { data: contributors, error } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', testFrameId)
        .eq('permission_type', 'contributor')

      expect(error).toBeNull()
      expect(contributors).toBeDefined()
      expect(Array.isArray(contributors)).toBe(true)
      
      contributors.forEach(permission => {
        expect(permission.permission_type).toBe('contributor')
      })
    })
  })
})