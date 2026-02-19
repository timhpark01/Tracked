// src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          bio: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          created_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activities_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      projects: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_activity_id_fkey'
            columns: ['activity_id']
            isOneToOne: false
            referencedRelation: 'activities'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projects_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      activity_logs: {
        Row: {
          id: string
          activity_id: string
          project_id: string
          user_id: string
          value: number
          note: string | null
          image_urls: string[] | null
          logged_at: string
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          activity_id: string
          project_id: string
          user_id: string
          value: number
          note?: string | null
          image_urls?: string[] | null
          logged_at?: string
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          activity_id?: string
          project_id?: string
          user_id?: string
          value?: number
          note?: string | null
          image_urls?: string[] | null
          logged_at?: string
          created_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'activity_logs_activity_id_fkey'
            columns: ['activity_id']
            isOneToOne: false
            referencedRelation: 'activities'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_logs_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey'
            columns: ['follower_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follows_following_id_fkey'
            columns: ['following_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      reactions: {
        Row: {
          id: string
          activity_log_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_log_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_log_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reactions_activity_log_id_fkey'
            columns: ['activity_log_id']
            isOneToOne: false
            referencedRelation: 'activity_logs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      comments: {
        Row: {
          id: string
          activity_log_id: string
          user_id: string
          parent_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_log_id: string
          user_id: string
          parent_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_log_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_activity_log_id_fkey'
            columns: ['activity_log_id']
            isOneToOne: false
            referencedRelation: 'activity_logs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          }
        ]
      }
      activity_fields: {
        Row: {
          id: string
          activity_id: string
          name: string
          field_type: 'time' | 'number' | 'distance' | 'text'
          unit: string
          display_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          name: string
          field_type: 'time' | 'number' | 'distance' | 'text'
          unit: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          name?: string
          field_type?: 'time' | 'number' | 'distance' | 'text'
          unit?: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_fields_activity_id_fkey'
            columns: ['activity_id']
            isOneToOne: false
            referencedRelation: 'activities'
            referencedColumns: ['id']
          }
        ]
      }
      activity_templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          category: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          category?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          category?: string | null
          is_system?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_templates_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      template_fields: {
        Row: {
          id: string
          template_id: string
          name: string
          field_type: 'time' | 'number' | 'distance' | 'text'
          unit: string
          display_order: number
          is_primary: boolean
        }
        Insert: {
          id?: string
          template_id: string
          name: string
          field_type: 'time' | 'number' | 'distance' | 'text'
          unit: string
          display_order?: number
          is_primary?: boolean
        }
        Update: {
          id?: string
          template_id?: string
          name?: string
          field_type?: 'time' | 'number' | 'distance' | 'text'
          unit?: string
          display_order?: number
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'template_fields_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'activity_templates'
            referencedColumns: ['id']
          }
        ]
      }
      groups: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string | null
          avatar_url: string | null
          membership_type: 'open' | 'request' | 'invite'
          is_discoverable: boolean
          member_count: number
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          description?: string | null
          avatar_url?: string | null
          membership_type: 'open' | 'request' | 'invite'
          is_discoverable?: boolean
          member_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          membership_type?: 'open' | 'request' | 'invite'
          is_discoverable?: boolean
          member_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'moderator' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'member'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      group_join_requests: {
        Row: {
          id: string
          group_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          message: string | null
          requested_at: string
          responded_at: string | null
          responded_by: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          requested_at?: string
          responded_at?: string | null
          responded_by?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          requested_at?: string
          responded_at?: string | null
          responded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'group_join_requests_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_join_requests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_join_requests_responded_by_fkey'
            columns: ['responded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      group_invites: {
        Row: {
          id: string
          group_id: string
          invited_user_id: string
          invited_by: string
          status: 'pending' | 'accepted' | 'declined'
          invited_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          invited_user_id: string
          invited_by: string
          status?: 'pending' | 'accepted' | 'declined'
          invited_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          invited_user_id?: string
          invited_by?: string
          status?: 'pending' | 'accepted' | 'declined'
          invited_at?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'group_invites_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_invites_invited_user_id_fkey'
            columns: ['invited_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_invites_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_group_with_admin: {
        Args: {
          p_name: string
          p_description?: string | null
          p_avatar_url?: string | null
          p_membership_type?: string
          p_is_discoverable?: boolean
        }
        Returns: string
      }
      join_open_group: {
        Args: {
          p_group_id: string
        }
        Returns: undefined
      }
      leave_group: {
        Args: {
          p_group_id: string
        }
        Returns: undefined
      }
      approve_join_request: {
        Args: {
          p_request_id: string
        }
        Returns: undefined
      }
      reject_join_request: {
        Args: {
          p_request_id: string
        }
        Returns: undefined
      }
      accept_group_invite: {
        Args: {
          p_invite_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
