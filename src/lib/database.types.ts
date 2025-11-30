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
          steam_id: string
          steam_nickname: string
          discord_id: string | null
          discord_username: string | null
          rules_passed: boolean
          is_banned: boolean
          banned_at: string | null
          ban_reason: string | null
          created_at: string
          last_login: string
        }
        Insert: {
          id?: string
          steam_id: string
          steam_nickname: string
          discord_id?: string | null
          discord_username?: string | null
          rules_passed?: boolean
          is_banned?: boolean
          banned_at?: string | null
          ban_reason?: string | null
          created_at?: string
          last_login?: string
        }
        Update: {
          id?: string
          steam_id?: string
          steam_nickname?: string
          discord_id?: string | null
          discord_username?: string | null
          rules_passed?: boolean
          is_banned?: boolean
          banned_at?: string | null
          ban_reason?: string | null
          created_at?: string
          last_login?: string
        }
      }
      characters: {
        Row: {
          id: string
          user_id: string
          steam_id: string
          status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'archived'
          name: string
          surname: string
          nickname: string | null
          age: number
          gender: 'male' | 'female'
          origin_country: string
          citizenship: string
          faction: string
          biography: string
          appearance: string
          psychological_portrait: string
          skills: Json
          inventory: Json
          rejection_reason: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
          submitted_at: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          steam_id: string
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'archived'
          name: string
          surname: string
          nickname?: string | null
          age: number
          gender: 'male' | 'female'
          origin_country: string
          citizenship: string
          faction: string
          biography: string
          appearance: string
          psychological_portrait: string
          skills?: Json
          inventory?: Json
          rejection_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'archived'
          name?: string
          surname?: string
          nickname?: string | null
          age?: number
          gender?: 'male' | 'female'
          origin_country?: string
          citizenship?: string
          faction?: string
          biography?: string
          appearance?: string
          psychological_portrait?: string
          skills?: Json
          inventory?: Json
          rejection_reason?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
        }
      }
      admins: {
        Row: {
          id: string
          user_id: string | null
          username: string
          password_hash: string
          role: 'super_admin' | 'moderator' | 'content_manager'
          permissions: Json
          is_active: boolean
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          username: string
          password_hash: string
          role?: 'super_admin' | 'moderator' | 'content_manager'
          permissions?: Json
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          username?: string
          password_hash?: string
          role?: 'super_admin' | 'moderator' | 'content_manager'
          permissions?: Json
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
      }
      rules_questions: {
        Row: {
          id: string
          question_text: string
          correct_answer: string
          incorrect_answers: Json
          category: string
          difficulty: 'easy' | 'medium' | 'hard'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_text: string
          correct_answer: string
          incorrect_answers?: Json
          category: string
          difficulty?: 'easy' | 'medium' | 'hard'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_text?: string
          correct_answer?: string
          incorrect_answers?: Json
          category?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rules_test_attempts: {
        Row: {
          id: string
          user_id: string
          score: number
          total_questions: number
          correct_answers: number
          passed: boolean
          answers: Json
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          total_questions: number
          correct_answers: number
          passed?: boolean
          answers?: Json
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          total_questions?: number
          correct_answers?: number
          passed?: boolean
          answers?: Json
          started_at?: string
          completed_at?: string | null
        }
      }
      server_info: {
        Row: {
          id: string
          section: string
          title: string
          content: string | null
          order_index: number
          is_published: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          section: string
          title: string
          content?: string | null
          order_index?: number
          is_published?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          section?: string
          title?: string
          content?: string | null
          order_index?: number
          is_published?: boolean
          updated_at?: string
          updated_by?: string | null
        }
      }
      character_comments: {
        Row: {
          id: string
          character_id: string
          admin_id: string | null
          comment_text: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          admin_id?: string | null
          comment_text: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          admin_id?: string | null
          comment_text?: string
          is_internal?: boolean
          created_at?: string
        }
      }
    }
  }
}
