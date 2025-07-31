import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

const hasValidCredentials = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.includes('.supabase.co')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export { hasValidCredentials }

export type Database = {
  public: {
    Tables: {
      types: {
        Row: {
          id: number
          name: string
          category: 'food' | 'place'
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          category: 'food' | 'place'
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: 'food' | 'place'
          created_at?: string
        }
      }
      items: {
        Row: {
          id: number
          nama: string
          type_id: number
          lokasi: string
          link: string | null
          status: boolean
          category: 'food' | 'place'
          created_at: string
        }
        Insert: {
          id?: number
          nama: string
          type_id: number
          lokasi: string
          link?: string | null
          status?: boolean
          category: 'food' | 'place'
          created_at?: string
        }
        Update: {
          id?: number
          nama?: string
          type_id?: number
          lokasi?: string
          link?: string | null
          status?: boolean
          category?: 'food' | 'place'
          created_at?: string
        }
      }
    }
  }
}

export type Item = Database['public']['Tables']['items']['Row']
export type Type = Database['public']['Tables']['types']['Row']
export type ItemInsert = Database['public']['Tables']['items']['Insert']
export type TypeInsert = Database['public']['Tables']['types']['Insert']