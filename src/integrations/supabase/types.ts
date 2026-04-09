export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ambassador_profiles: {
        Row: {
          admin_viewed_at: string | null
          balance_usd: number
          created_at: string
          id: string
          is_active: boolean
          referral_link: string | null
          referrals_channel: number
          referrals_club: number
          referrals_orders: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_viewed_at?: string | null
          balance_usd?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referral_link?: string | null
          referrals_channel?: number
          referrals_club?: number
          referrals_orders?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_viewed_at?: string | null
          balance_usd?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referral_link?: string | null
          referrals_channel?: number
          referrals_club?: number
          referrals_orders?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          admin_viewed_at: string | null
          created_at: string
          delivery_address: string | null
          id: string
          is_redirect: boolean
          packaging_price: number | null
          packaging_type: string | null
          product_name: string
          recipient_name: string
          recipient_phone: string
          status: string
          tracking_number: string | null
          transport_company: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_viewed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          is_redirect?: boolean
          packaging_price?: number | null
          packaging_type?: string | null
          product_name: string
          recipient_name: string
          recipient_phone: string
          status?: string
          tracking_number?: string | null
          transport_company?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_viewed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          is_redirect?: boolean
          packaging_price?: number | null
          packaging_type?: string | null
          product_name?: string
          recipient_name?: string
          recipient_phone?: string
          status?: string
          tracking_number?: string | null
          transport_company?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          lesson_id: string | null
          order_index: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          lesson_id?: string | null
          order_index?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          lesson_id?: string | null
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_images_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          duration: string | null
          id: string
          order_index: number | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          order_index?: number | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          order_index?: number | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_requests: {
        Row: {
          admin_viewed_at: string | null
          created_at: string
          delivery_address: string | null
          delivery_type: string
          id: string
          info_image_url: string | null
          packaging_price: number | null
          packaging_type: string | null
          price_cny: number | null
          product_link: string | null
          product_name: string
          qr_image_url: string | null
          recipient_name: string
          recipient_phone: string
          status: string
          transport_company: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_viewed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          info_image_url?: string | null
          packaging_price?: number | null
          packaging_type?: string | null
          price_cny?: number | null
          product_link?: string | null
          product_name: string
          qr_image_url?: string | null
          recipient_name?: string
          recipient_phone?: string
          status?: string
          transport_company?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_viewed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          info_image_url?: string | null
          packaging_price?: number | null
          packaging_type?: string | null
          price_cny?: number | null
          product_link?: string | null
          product_name?: string
          qr_image_url?: string | null
          recipient_name?: string
          recipient_phone?: string
          status?: string
          transport_company?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pick_requests: {
        Row: {
          admin_viewed_at: string | null
          batch_id: string | null
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          price_rub: number | null
          product_link: string
          quantity: number
          size: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_viewed_at?: string | null
          batch_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price_rub?: number | null
          product_link?: string
          quantity?: number
          size?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_viewed_at?: string | null
          batch_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price_rub?: number | null
          product_link?: string
          quantity?: number
          size?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_profiles: {
        Row: {
          created_at: string
          delivery_address: string | null
          delivery_type: string
          id: string
          packaging_price: number | null
          packaging_type: string | null
          recipient_name: string
          recipient_phone: string
          transport_company: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          packaging_price?: number | null
          packaging_type?: string | null
          recipient_name?: string
          recipient_phone?: string
          transport_company?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          packaging_price?: number | null
          packaging_type?: string | null
          recipient_name?: string
          recipient_phone?: string
          transport_company?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          collections: Json | null
          created_at: string | null
          display_name: string | null
          id: string
          is_active: boolean
          registered_at: string | null
          unique_code: string | null
          updated_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          collections?: Json | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          registered_at?: string | null
          unique_code?: string | null
          updated_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          collections?: Json | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          registered_at?: string | null
          unique_code?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_active: { Args: { p_username: string }; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
