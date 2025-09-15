/**
 * User Settings Page
 * Allows users to manage their profile and preferences
 * Route: /settings
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/serverClient'
import { UserSettings } from '@/components/user/user-settings'

export const metadata: Metadata = {
  title: 'Settings - Gen Art Pixels',
  description: 'Manage your profile and preferences on Gen Art Pixels.',
}

async function getCurrentUser() {
  const supabase = await createServerClient()

  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  
  if (!supabaseUser) {
    return null
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', supabaseUser.id)
    .single()

  return user
}

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your profile and preferences
          </p>
        </div>

        <UserSettings user={user} />
      </div>
    </div>
  )
}