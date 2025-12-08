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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          calendar_id: string | null
          compound_part: string | null
          created_at: string | null
          customer_name: string
          end_time: string | null
          Fecha: string
          google_calendar_event_id: string | null
          Hora: string
          id: string
          is_part_of_compound: boolean | null
          related_booking_id: string | null
          services: Json
          status: string
          stylist: string
          Telefono: string
          total_duration: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calendar_id?: string | null
          compound_part?: string | null
          created_at?: string | null
          customer_name: string
          end_time?: string | null
          Fecha: string
          google_calendar_event_id?: string | null
          Hora: string
          id?: string
          is_part_of_compound?: boolean | null
          related_booking_id?: string | null
          services: Json
          status?: string
          stylist: string
          Telefono: string
          total_duration: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calendar_id?: string | null
          compound_part?: string | null
          created_at?: string | null
          customer_name?: string
          end_time?: string | null
          Fecha?: string
          google_calendar_event_id?: string | null
          Hora?: string
          id?: string
          is_part_of_compound?: boolean | null
          related_booking_id?: string | null
          services?: Json
          status?: string
          stylist?: string
          Telefono?: string
          total_duration?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register: {
        Row: {
          card_total: number | null
          cash_total: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          cris_total: number | null
          date: string
          desi_total: number | null
          id: string
          notes: string | null
          opening_balance: number | null
          total_sales: number | null
          transaction_count: number | null
        }
        Insert: {
          card_total?: number | null
          cash_total?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          cris_total?: number | null
          date: string
          desi_total?: number | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          total_sales?: number | null
          transaction_count?: number | null
        }
        Update: {
          card_total?: number | null
          cash_total?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          cris_total?: number | null
          date?: string
          desi_total?: number | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          total_sales?: number | null
          transaction_count?: number | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          duration_exposure_pause: number
          duration_part1_active: number
          duration_part2_active: number
          id: string
          name: string
          price: number | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          duration_exposure_pause?: number
          duration_part1_active: number
          duration_part2_active?: number
          id?: string
          name: string
          price?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          duration_exposure_pause?: number
          duration_part1_active?: number
          duration_part2_active?: number
          id?: string
          name?: string
          price?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string
          customer_name: string
          discount: number | null
          id: string
          notes: string | null
          payment_method: string
          services: Json
          stylist: string
          subtotal: number
          total: number
          voided: boolean | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          created_by: string
          customer_name: string
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method: string
          services: Json
          stylist: string
          subtotal: number
          total: number
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          created_by?: string
          customer_name?: string
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          services?: Json
          stylist?: string
          subtotal?: number
          total?: number
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          ai_agent_enabled: boolean
          blocked: boolean
          created_at: string
          id: string
          last_message_at: string
          name: string | null
          phone_number: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          ai_agent_enabled?: boolean
          blocked?: boolean
          created_at?: string
          id?: string
          last_message_at?: string
          name?: string | null
          phone_number: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          ai_agent_enabled?: boolean
          blocked?: boolean
          created_at?: string
          id?: string
          last_message_at?: string
          name?: string | null
          phone_number?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          contact_id: string
          content: string
          created_at: string
          id: string
          message_type: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string
          id?: string
          message_type: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_review: { Args: never; Returns: boolean }
      check_password_reset_rate_limit: {
        Args: { user_email: string }
        Returns: boolean
      }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: undefined }
      get_my_bookings: {
        Args: never
        Returns: {
          calendar_id: string
          compound_part: string
          customer_name: string
          end_time: string
          Fecha: string
          google_calendar_event_id: string
          Hora: string
          id: string
          is_part_of_compound: boolean
          related_booking_id: string
          services: Json
          status: string
          stylist: string
          Telefono: string
          total_duration: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_my_bookings: {
        Args: { phone_number: string }
        Returns: {
          calendar_id: string
          compound_part: string
          customer_name: string
          Fecha: string
          google_calendar_event_id: string
          Hora: string
          id: string
          is_part_of_compound: boolean
          related_booking_id: string
          services: Json
          status: string
          stylist: string
          Telefono: string
          total_duration: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "stylist"
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
    Enums: {
      app_role: ["admin", "stylist"],
    },
  },
} as const
