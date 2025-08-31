/**
 * Database types generated from Supabase schema
 * This file will be updated when we run supabase gen types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          handle: string
          email: string | null
          avatar_url: string | null
          pixels_available: number
          last_refill: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          handle: string
          email?: string | null
          avatar_url?: string | null
          pixels_available?: number
          last_refill?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handle?: string
          email?: string | null
          avatar_url?: string | null
          pixels_available?: number
          last_refill?: string
          created_at?: string
          updated_at?: string
        }
      }
      frames: {
        Row: {
          id: string
          handle: string
          title: string
          description: string | null
          keywords: string[] | null
          owner_handle: string
          width: number
          height: number
          permissions: string
          is_frozen: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          handle: string
          title: string
          description?: string | null
          keywords?: string[] | null
          owner_handle: string
          width: number
          height: number
          permissions?: string
          is_frozen?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handle?: string
          title?: string
          description?: string | null
          keywords?: string[] | null
          owner_handle?: string
          width?: number
          height?: number
          permissions?: string
          is_frozen?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pixels: {
        Row: {
          id: string
          frame_id: string
          x: number
          y: number
          color: number
          contributor_handle: string
          placed_at: string
        }
        Insert: {
          id?: string
          frame_id: string
          x: number
          y: number
          color: number
          contributor_handle: string
          placed_at?: string
        }
        Update: {
          id?: string
          frame_id?: string
          x?: number
          y?: number
          color?: number
          contributor_handle?: string
          placed_at?: string
        }
      }
      frame_permissions: {
        Row: {
          id: string
          frame_id: string
          user_handle: string
          permission_type: string
          granted_by: string
          created_at: string
        }
        Insert: {
          id?: string
          frame_id: string
          user_handle: string
          permission_type: string
          granted_by: string
          created_at?: string
        }
        Update: {
          id?: string
          frame_id?: string
          user_handle?: string
          permission_type?: string
          granted_by?: string
          created_at?: string
        }
      }
      frame_stats: {
        Row: {
          frame_id: string
          contributors_count: number
          total_pixels: number
          likes_count: number
          last_activity: string
          updated_at: string
        }
        Insert: {
          frame_id: string
          contributors_count?: number
          total_pixels?: number
          likes_count?: number
          last_activity?: string
          updated_at?: string
        }
        Update: {
          frame_id?: string
          contributors_count?: number
          total_pixels?: number
          likes_count?: number
          last_activity?: string
          updated_at?: string
        }
      }
      frame_likes: {
        Row: {
          id: string
          frame_id: string
          user_handle: string
          created_at: string
        }
        Insert: {
          id?: string
          frame_id: string
          user_handle: string
          created_at?: string
        }
        Update: {
          id?: string
          frame_id?: string
          user_handle?: string
          created_at?: string
        }
      }
      frame_snapshots: {
        Row: {
          id: string
          frame_id: string
          snapshot_data: string
          pixel_count: number
          created_at: string
        }
        Insert: {
          id?: string
          frame_id: string
          snapshot_data: string
          pixel_count: number
          created_at?: string
        }
        Update: {
          id?: string
          frame_id?: string
          snapshot_data?: string
          pixel_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}