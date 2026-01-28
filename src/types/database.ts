// src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
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
      hobbies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          tracking_type: 'time' | 'quantity'
          goal_total: number | null
          goal_unit: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string | null
          tracking_type: 'time' | 'quantity'
          goal_total?: number | null
          goal_unit?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string | null
          tracking_type?: 'time' | 'quantity'
          goal_total?: number | null
          goal_unit?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'hobbies_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      hobby_logs: {
        Row: {
          id: string
          hobby_id: string
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
          hobby_id: string
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
          hobby_id?: string
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
            foreignKeyName: 'hobby_logs_hobby_id_fkey'
            columns: ['hobby_id']
            isOneToOne: false
            referencedRelation: 'hobbies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hobby_logs_user_id_fkey'
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
