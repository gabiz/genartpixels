export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      frame_likes: {
        Row: {
          created_at: string | null
          frame_id: string
          id: string
          user_handle: string
        }
        Insert: {
          created_at?: string | null
          frame_id: string
          id?: string
          user_handle: string
        }
        Update: {
          created_at?: string | null
          frame_id?: string
          id?: string
          user_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "frame_likes_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frame_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_likes_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_likes_user_handle_fkey"
            columns: ["user_handle"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "frame_likes_user_handle_fkey"
            columns: ["user_handle"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["handle"]
          },
        ]
      }
      frame_permissions: {
        Row: {
          created_at: string | null
          frame_id: string
          granted_by: string
          id: string
          permission_type: string
          user_handle: string
        }
        Insert: {
          created_at?: string | null
          frame_id: string
          granted_by: string
          id?: string
          permission_type: string
          user_handle: string
        }
        Update: {
          created_at?: string | null
          frame_id?: string
          granted_by?: string
          id?: string
          permission_type?: string
          user_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "frame_permissions_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frame_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_permissions_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "frame_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "frame_permissions_user_handle_fkey"
            columns: ["user_handle"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "frame_permissions_user_handle_fkey"
            columns: ["user_handle"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["handle"]
          },
        ]
      }
      frame_snapshots: {
        Row: {
          created_at: string | null
          frame_id: string
          id: string
          pixel_count: number
          snapshot_data: string
        }
        Insert: {
          created_at?: string | null
          frame_id: string
          id?: string
          pixel_count: number
          snapshot_data: string
        }
        Update: {
          created_at?: string | null
          frame_id?: string
          id?: string
          pixel_count?: number
          snapshot_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "frame_snapshots_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frame_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_snapshots_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frames"
            referencedColumns: ["id"]
          },
        ]
      }
      frame_stats: {
        Row: {
          contributors_count: number | null
          frame_id: string
          last_activity: string | null
          likes_count: number | null
          total_pixels: number | null
          updated_at: string | null
        }
        Insert: {
          contributors_count?: number | null
          frame_id: string
          last_activity?: string | null
          likes_count?: number | null
          total_pixels?: number | null
          updated_at?: string | null
        }
        Update: {
          contributors_count?: number | null
          frame_id?: string
          last_activity?: string | null
          likes_count?: number | null
          total_pixels?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frame_stats_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: true
            referencedRelation: "frame_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_stats_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: true
            referencedRelation: "frames"
            referencedColumns: ["id"]
          },
        ]
      }
      frames: {
        Row: {
          created_at: string | null
          description: string | null
          handle: string
          height: number
          id: string
          is_frozen: boolean | null
          keywords: string[] | null
          owner_handle: string
          permissions: string | null
          title: string
          updated_at: string | null
          width: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          handle: string
          height: number
          id?: string
          is_frozen?: boolean | null
          keywords?: string[] | null
          owner_handle: string
          permissions?: string | null
          title: string
          updated_at?: string | null
          width: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          handle?: string
          height?: number
          id?: string
          is_frozen?: boolean | null
          keywords?: string[] | null
          owner_handle?: string
          permissions?: string | null
          title?: string
          updated_at?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "frames_owner_handle_fkey"
            columns: ["owner_handle"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "frames_owner_handle_fkey"
            columns: ["owner_handle"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["handle"]
          },
        ]
      }
      pixels: {
        Row: {
          color: number
          contributor_handle: string
          frame_id: string
          id: string
          placed_at: string | null
          x: number
          y: number
        }
        Insert: {
          color: number
          contributor_handle: string
          frame_id: string
          id?: string
          placed_at?: string | null
          x: number
          y: number
        }
        Update: {
          color?: number
          contributor_handle?: string
          frame_id?: string
          id?: string
          placed_at?: string | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "pixels_contributor_handle_fkey"
            columns: ["contributor_handle"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "pixels_contributor_handle_fkey"
            columns: ["contributor_handle"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "pixels_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frame_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixels_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "frames"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          handle: string
          id: string
          last_refill: string | null
          pixels_available: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          handle: string
          id?: string
          last_refill?: string | null
          pixels_available?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string
          id?: string
          last_refill?: string | null
          pixels_available?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      frame_details: {
        Row: {
          contributors_count: number | null
          created_at: string | null
          description: string | null
          handle: string | null
          height: number | null
          id: string | null
          is_frozen: boolean | null
          keywords: string[] | null
          last_activity: string | null
          likes_count: number | null
          owner_handle: string | null
          permissions: string | null
          title: string | null
          total_pixels: number | null
          updated_at: string | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "frames_owner_handle_fkey"
            columns: ["owner_handle"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["handle"]
          },
          {
            foreignKeyName: "frames_owner_handle_fkey"
            columns: ["owner_handle"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["handle"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string | null
          frames_contributed_to: number | null
          frames_created: number | null
          frames_liked: number | null
          handle: string | null
          total_pixels_placed: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

