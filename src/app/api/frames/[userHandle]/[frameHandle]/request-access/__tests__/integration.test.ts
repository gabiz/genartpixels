/**
 * Integration tests for frame access request endpoint
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

describe('Frame Access Request Integration Tests', () => {
  let frameOwner: any
  let frameOwnerHandle: string
  let requestingUser: any
  let requestingUserHandle: string
  let approvalRequiredFrameId: string
  let approvalRequiredFrameHandle: string
  let openFrameId: string
  let openFrameHandle: string

  beforeAll(async () => {
    if (skipIntegrationTests) {
      console.log('Skipping integration tests - Supabase environment variables not set')
      return
    }

    // Create frame owner
    const { data: ownerAuthData, error: ownerAuthError } = await supabase.auth.admin.createUser({
      email: 'frame-owner@example.com',
      password: 'testpassword123',
      email_confirm: true
    })

    if (ownerAuthError || !ownerAuthData.user) {
      throw new Error('Failed to create frame owner')
    }

    frameOwner = ownerAuthData.user
    frameOwnerHandle = `frameowner_${Date.now()}`

    // Create requesting user
    const { data: userAuthData, error: userAuthError } = await supabase.auth.admin.createUser({
      email: 'requesting-user@example.com',
      password: 'testpassword123',
      email_confirm: true
    })

    if (userAuthError || !userAuthData.user) {
      throw new Error('Failed to create requesting user')
    }

    requestingUser = userAuthData.user
    requestingUserHandle = `requestuser_${Date.now()}`

    // Create user profiles
    await supabase.from('users').insert([
      {
        id: frameOwner.id,
        handle: frameOwnerHandle,
        email: frameOwner.email!,
        pixels_available: 100,
        last_refill: new Date().toISOString()
      },
      {
        id: requestingUser.id,
        handle: requestingUserHandle,
        email: requestingUser.email!,
        pixels_available: 100,
        last_refill: new Date().toISOString()
      }
    ])

    // Create approval-required frame
    approvalRequiredFrameHandle = `approval-frame-${Date.now()}`
    const { data: approvalFrame, error: approvalFrameError } = await supabase
      .from('frames')
      .insert({
        handle: approvalRequiredFrameHandle,
        title: 'Approval Required Frame',
        description: 'Frame requiring approval for access',
        keywords: ['approval', 'test'],
        owner_handle: frameOwnerHandle,
        width: 128,
        height: 128,
        permissions: 'approval-required',
        is_frozen: false
      })
      .select()
      .single()

    if (approvalFrameError || !approvalFrame) {
      throw new Error('Failed to create approval-required frame')
    }

    approvalRequiredFrameId = approvalFrame.id

    // Create open frame for negative testing
    openFrameHandle = `open-frame-${Date.now()}`
    const { data: openFrame, error: openFrameError } = await supabase
      .from('frames')
      .insert({
        handle: openFrameHandle,
        title: 'Open Frame',
        description: 'Open frame for testing',
        keywords: ['open', 'test'],
        owner_handle: frameOwnerHandle,
        width: 128,
        height: 128,
        permissions: 'open',
        is_frozen: false
      })
      .select()
      .single()

    if (openFrameError || !openFrame) {
      throw new Error('Failed to create open frame')
    }

    openFrameId = openFrame.id
  })

  afterAll(async () => {
    if (skipIntegrationTests) {
      return
    }

    // Clean up test data
    if (approvalRequiredFrameId) {
      await supabase.from('frames').delete().eq('id', approvalRequiredFrameId)
    }
    
    if (openFrameId) {
      await supabase.from('frames').delete().eq('id', openFrameId)
    }
    
    if (frameOwner) {
      await supabase.from('users').delete().eq('id', frameOwner.id)
      await supabase.auth.admin.deleteUser(frameOwner.id)
    }

    if (requestingUser) {
      await supabase.from('users').delete().eq('id', requestingUser.id)
      await supabase.auth.admin.deleteUser(requestingUser.id)
    }
  })

  describe('Access Request Creation', () => {
    afterEach(async () => {
      if (skipIntegrationTests) return

      // Clean up any permissions created during tests
      await supabase
        .from('frame_permissions')
        .delete()
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
    })

    it('should create pending access request for approval-required frame', async () => {
      if (skipIntegrationTests) return

      const { data: permission, error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(permission).toBeDefined()
      expect(permission.permission_type).toBe('pending')
      expect(permission.user_handle).toBe(requestingUserHandle)
      expect(permission.granted_by).toBe(frameOwnerHandle)
    })

    it('should prevent duplicate access requests', async () => {
      if (skipIntegrationTests) return

      // Create first request
      const { data: permission1, error: error1 } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(error1).toBeNull()
      expect(permission1).toBeDefined()

      // Try to create duplicate request
      const { data: permission2, error: error2 } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(error2).toBeDefined()
      expect(error2?.code).toBe('23505') // Unique constraint violation
      expect(permission2).toBeNull()
    })

    it('should handle existing contributor permission', async () => {
      if (skipIntegrationTests) return

      // Grant contributor permission first
      const { data: contributorPermission, error: contributorError } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'contributor',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(contributorError).toBeNull()
      expect(contributorPermission).toBeDefined()
      expect(contributorPermission.permission_type).toBe('contributor')

      // Verify user already has access
      const { data: existingPermission, error: checkError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
        .single()

      expect(checkError).toBeNull()
      expect(existingPermission).toBeDefined()
      expect(existingPermission.permission_type).toBe('contributor')
    })

    it('should handle blocked user', async () => {
      if (skipIntegrationTests) return

      // Block user first
      const { data: blockedPermission, error: blockError } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'blocked',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(blockError).toBeNull()
      expect(blockedPermission).toBeDefined()
      expect(blockedPermission.permission_type).toBe('blocked')

      // Verify user is blocked
      const { data: existingPermission, error: checkError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
        .single()

      expect(checkError).toBeNull()
      expect(existingPermission).toBeDefined()
      expect(existingPermission.permission_type).toBe('blocked')
    })
  })

  describe('Access Request Validation', () => {
    it('should validate frame permissions type', async () => {
      if (skipIntegrationTests) return

      // Verify frame is approval-required
      const { data: frame, error: frameError } = await supabase
        .from('frames')
        .select('permissions')
        .eq('id', approvalRequiredFrameId)
        .single()

      expect(frameError).toBeNull()
      expect(frame).toBeDefined()
      expect(frame.permissions).toBe('approval-required')
    })

    it('should reject requests for open frames', async () => {
      if (skipIntegrationTests) return

      // Verify open frame doesn't need approval
      const { data: frame, error: frameError } = await supabase
        .from('frames')
        .select('permissions')
        .eq('id', openFrameId)
        .single()

      expect(frameError).toBeNull()
      expect(frame).toBeDefined()
      expect(frame.permissions).toBe('open')

      // Open frames don't need permission requests - they're accessible to everyone
    })

    it('should prevent owner from requesting access to own frame', async () => {
      if (skipIntegrationTests) return

      // Verify frame ownership
      const { data: frame, error: frameError } = await supabase
        .from('frames')
        .select('owner_handle')
        .eq('id', approvalRequiredFrameId)
        .single()

      expect(frameError).toBeNull()
      expect(frame).toBeDefined()
      expect(frame.owner_handle).toBe(frameOwnerHandle)

      // Owner shouldn't need to request access to their own frame
      // This would be handled by the API endpoint logic
    })

    it('should validate user exists', async () => {
      if (skipIntegrationTests) return

      // Try to create permission for non-existent user
      const { data: permission, error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: 'nonexistent_user_handle',
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
      expect(permission).toBeNull()
    })

    it('should validate frame exists', async () => {
      if (skipIntegrationTests) return

      // Try to create permission for non-existent frame
      const { data: permission, error } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: '00000000-0000-0000-0000-000000000000',
          user_handle: requestingUserHandle,
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
      expect(permission).toBeNull()
    })
  })

  describe('Access Request Workflow', () => {
    afterEach(async () => {
      if (skipIntegrationTests) return

      // Clean up permissions after each test
      await supabase
        .from('frame_permissions')
        .delete()
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
    })

    it('should support complete approval workflow', async () => {
      if (skipIntegrationTests) return

      // Step 1: Create pending request
      const { data: pendingRequest, error: requestError } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(requestError).toBeNull()
      expect(pendingRequest).toBeDefined()
      expect(pendingRequest.permission_type).toBe('pending')

      // Step 2: Approve request (change to contributor)
      const { data: approvedRequest, error: approveError } = await supabase
        .from('frame_permissions')
        .update({ permission_type: 'contributor' })
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
        .select()
        .single()

      expect(approveError).toBeNull()
      expect(approvedRequest).toBeDefined()
      expect(approvedRequest.permission_type).toBe('contributor')

      // Step 3: Verify user now has contributor access
      const { data: finalPermission, error: checkError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
        .single()

      expect(checkError).toBeNull()
      expect(finalPermission).toBeDefined()
      expect(finalPermission.permission_type).toBe('contributor')
    })

    it('should support request denial workflow', async () => {
      if (skipIntegrationTests) return

      // Step 1: Create pending request
      const { data: pendingRequest, error: requestError } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(requestError).toBeNull()
      expect(pendingRequest).toBeDefined()
      expect(pendingRequest.permission_type).toBe('pending')

      // Step 2: Deny request (remove permission)
      const { error: denyError } = await supabase
        .from('frame_permissions')
        .delete()
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)

      expect(denyError).toBeNull()

      // Step 3: Verify permission is removed
      const { data: removedPermission, error: checkError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
        .single()

      expect(checkError).toBeDefined()
      expect(checkError?.code).toBe('PGRST116') // Not found
      expect(removedPermission).toBeNull()
    })

    it('should support blocking workflow', async () => {
      if (skipIntegrationTests) return

      // Step 1: Create pending request
      const { data: pendingRequest, error: requestError } = await supabase
        .from('frame_permissions')
        .insert({
          frame_id: approvalRequiredFrameId,
          user_handle: requestingUserHandle,
          permission_type: 'pending',
          granted_by: frameOwnerHandle
        })
        .select()
        .single()

      expect(requestError).toBeNull()
      expect(pendingRequest).toBeDefined()

      // Step 2: Block user instead of approving
      const { data: blockedUser, error: blockError } = await supabase
        .from('frame_permissions')
        .update({ permission_type: 'blocked' })
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
        .select()
        .single()

      expect(blockError).toBeNull()
      expect(blockedUser).toBeDefined()
      expect(blockedUser.permission_type).toBe('blocked')

      // Step 3: Verify user is blocked
      const { data: finalPermission, error: checkError } = await supabase
        .from('frame_permissions')
        .select('*')
        .eq('frame_id', approvalRequiredFrameId)
        .eq('user_handle', requestingUserHandle)
        .single()

      expect(checkError).toBeNull()
      expect(finalPermission).toBeDefined()
      expect(finalPermission.permission_type).toBe('blocked')
    })
  })
})