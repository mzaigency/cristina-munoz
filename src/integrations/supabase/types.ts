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
      admin_seen_state: {
        Row: {
          key: string
          last_seen_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          key: string
          last_seen_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          key?: string
          last_seen_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string | null
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      b2b_leads: {
        Row: {
          business_name: string
          city: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string
          services: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          business_name: string
          city?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phone: string
          services?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_name?: string
          city?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string
          services?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          calendar_id: string | null
          canal: string | null
          color: string | null
          compound_part: string | null
          created_at: string | null
          customer_name: string
          customer_name_encrypted: string | null
          end_time: string | null
          Fecha: string
          google_calendar_event_id: string | null
          Hora: string
          id: string
          is_part_of_compound: boolean | null
          notes: string | null
          recurrence_group_id: string | null
          recurrence_pattern: Json | null
          related_booking_id: string | null
          reminder_2h_sent: string | null
          reminder_sent: string | null
          review_request_sent: string | null
          services: Json
          skip_availability_check: boolean
          status: string
          stylist: string
          Telefono: string
          telefono_encrypted: string | null
          tenant_id: string | null
          title: string | null
          total_duration: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calendar_id?: string | null
          canal?: string | null
          color?: string | null
          compound_part?: string | null
          created_at?: string | null
          customer_name: string
          customer_name_encrypted?: string | null
          end_time?: string | null
          Fecha: string
          google_calendar_event_id?: string | null
          Hora: string
          id?: string
          is_part_of_compound?: boolean | null
          notes?: string | null
          recurrence_group_id?: string | null
          recurrence_pattern?: Json | null
          related_booking_id?: string | null
          reminder_2h_sent?: string | null
          reminder_sent?: string | null
          review_request_sent?: string | null
          services: Json
          skip_availability_check?: boolean
          status?: string
          stylist: string
          Telefono: string
          telefono_encrypted?: string | null
          tenant_id?: string | null
          title?: string | null
          total_duration: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calendar_id?: string | null
          canal?: string | null
          color?: string | null
          compound_part?: string | null
          created_at?: string | null
          customer_name?: string
          customer_name_encrypted?: string | null
          end_time?: string | null
          Fecha?: string
          google_calendar_event_id?: string | null
          Hora?: string
          id?: string
          is_part_of_compound?: boolean | null
          notes?: string | null
          recurrence_group_id?: string | null
          recurrence_pattern?: Json | null
          related_booking_id?: string | null
          reminder_2h_sent?: string | null
          reminder_sent?: string | null
          review_request_sent?: string | null
          services?: Json
          skip_availability_check?: boolean
          status?: string
          stylist?: string
          Telefono?: string
          telefono_encrypted?: string | null
          tenant_id?: string | null
          title?: string | null
          total_duration?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          date: string
          id: string
          notes: string | null
          opening_balance: number | null
          tenant_id: string | null
          total_sales: number | null
          transaction_count: number | null
        }
        Insert: {
          card_total?: number | null
          cash_total?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          opening_balance?: number | null
          tenant_id?: string | null
          total_sales?: number | null
          transaction_count?: number | null
        }
        Update: {
          card_total?: number | null
          cash_total?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          opening_balance?: number | null
          tenant_id?: string | null
          total_sales?: number | null
          transaction_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          birthday: string | null
          created_at: string
          email: string | null
          favorite_stylist_id: string | null
          id: string
          is_blocked: boolean | null
          last_visit_at: string | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          preferred_services: string[] | null
          tags: string[] | null
          tenant_id: string
          total_spent: number | null
          total_visits: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          favorite_stylist_id?: string | null
          id?: string
          is_blocked?: boolean | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_services?: string[] | null
          tags?: string[] | null
          tenant_id: string
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          favorite_stylist_id?: string | null
          id?: string
          is_blocked?: boolean | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_services?: string[] | null
          tags?: string[] | null
          tenant_id?: string
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_favorite_stylist_id_fkey"
            columns: ["favorite_stylist_id"]
            isOneToOne: false
            referencedRelation: "tenant_stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          tenant_id: string
          unread_count_salon: number
          unread_count_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          tenant_id: string
          unread_count_salon?: number
          unread_count_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          tenant_id?: string
          unread_count_salon?: number
          unread_count_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          component_stack: string | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string | null
          id: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          position: number | null
          score: number | null
          section_id: string
          session_id: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          position?: number | null
          score?: number | null
          section_id: string
          session_id: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          position?: number | null
          score?: number | null
          section_id?: string
          session_id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          bookings_goal: number | null
          created_at: string | null
          id: string
          month: number
          new_clients_goal: number | null
          revenue_goal: number | null
          tenant_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          bookings_goal?: number | null
          created_at?: string | null
          id?: string
          month: number
          new_clients_goal?: number | null
          revenue_goal?: number | null
          tenant_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          bookings_goal?: number | null
          created_at?: string | null
          id?: string
          month?: number
          new_clients_goal?: number | null
          revenue_goal?: number | null
          tenant_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_cancelled: boolean | null
          booking_reminder_1h: boolean | null
          booking_reminder_24h: boolean | null
          created_at: string
          daily_summary: boolean | null
          daily_summary_time: string | null
          email_enabled: boolean | null
          id: string
          new_booking: boolean | null
          new_message: boolean | null
          new_review: boolean | null
          push_enabled: boolean | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_cancelled?: boolean | null
          booking_reminder_1h?: boolean | null
          booking_reminder_24h?: boolean | null
          created_at?: string
          daily_summary?: boolean | null
          daily_summary_time?: string | null
          email_enabled?: boolean | null
          id?: string
          new_booking?: boolean | null
          new_message?: boolean | null
          new_review?: boolean | null
          push_enabled?: boolean | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_cancelled?: boolean | null
          booking_reminder_1h?: boolean | null
          booking_reminder_24h?: boolean | null
          created_at?: string
          daily_summary?: boolean | null
          daily_summary_time?: string | null
          email_enabled?: boolean | null
          id?: string
          new_booking?: boolean | null
          new_message?: boolean | null
          new_review?: boolean | null
          push_enabled?: boolean | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          category: string | null
          comments_count: number | null
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean | null
          likes_count: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          comments_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          likes_count?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          comments_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          likes_count?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_orders: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          pickup_type: string
          status: string
          tenant_id: string
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          pickup_type?: string
          status?: string
          tenant_id: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          pickup_type?: string
          status?: string
          tenant_id?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean
          min_stock: number | null
          name: string
          price: number
          short_description: string | null
          stock: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          min_stock?: number | null
          name: string
          price?: number
          short_description?: string | null
          stock?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          min_stock?: number | null
          name?: string
          price?: number
          short_description?: string | null
          stock?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          province: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          province?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          province?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applies_to: string | null
          code: string | null
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          loyalty_points_required: number | null
          max_uses: number | null
          min_purchase: number | null
          name: string
          tenant_id: string
          updated_at: string | null
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: string | null
          code?: string | null
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          loyalty_points_required?: number | null
          max_uses?: number | null
          min_purchase?: number | null
          name: string
          tenant_id: string
          updated_at?: string | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: string | null
          code?: string | null
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          loyalty_points_required?: number | null
          max_uses?: number | null
          min_purchase?: number | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
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
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_stories: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          image_url: string
          is_active: boolean | null
          story_type: string
          tenant_id: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          story_type?: string
          tenant_id: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          story_type?: string
          tenant_id?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_stories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_reminders: {
        Row: {
          booking_id: string
          id: string
          reminder_type: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          reminder_type: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_decrypted"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          original_total: number
          package_price: number
          services: Json
          tenant_id: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          original_total?: number
          package_price?: number
          services?: Json
          tenant_id: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          original_total?: number
          package_price?: number
          services?: Json
          tenant_id?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          sort_order: number | null
          tenant_id: string | null
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
          sort_order?: number | null
          tenant_id?: string | null
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
          sort_order?: number | null
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "salon_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_widget_responses: {
        Row: {
          created_at: string
          id: string
          response: Json
          user_id: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response: Json
          user_id: string
          widget_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response?: Json
          user_id?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_widget_responses_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "story_widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      story_widgets: {
        Row: {
          config: Json
          created_at: string
          id: string
          position_x: number
          position_y: number
          story_id: string
          widget_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          position_x?: number
          position_y?: number
          story_id: string
          widget_type: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          position_x?: number
          position_y?: number
          story_id?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_widgets_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "salon_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_business_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string | null
          day_of_week: number
          end_time: string | null
          id: string
          is_working: boolean | null
          start_time: string | null
          stylist_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          day_of_week: number
          end_time?: string | null
          id?: string
          is_working?: boolean | null
          start_time?: string | null
          stylist_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string | null
          id?: string
          is_working?: boolean | null
          start_time?: string | null
          stylist_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_business_hours_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "tenant_stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_business_hours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_commissions: {
        Row: {
          commission_fixed: number | null
          commission_percentage: number | null
          commission_type: string | null
          created_at: string | null
          effective_from: string | null
          id: string
          stylist_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          commission_fixed?: number | null
          commission_percentage?: number | null
          commission_type?: string | null
          created_at?: string | null
          effective_from?: string | null
          id?: string
          stylist_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_fixed?: number | null
          commission_percentage?: number | null
          commission_type?: string | null
          created_at?: string | null
          effective_from?: string | null
          id?: string
          stylist_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_commissions_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "tenant_stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylist_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number | null
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_services: number | null
          max_stylists: number | null
          monthly_price: number
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          annual_price?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_services?: number | null
          max_stylists?: number | null
          monthly_price?: number
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_price?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_services?: number | null
          max_stylists?: number | null
          monthly_price?: number
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenant_admins: {
        Row: {
          created_at: string | null
          id: string
          is_owner: boolean | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_admins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_ai_generations: {
        Row: {
          created_at: string
          created_by: string | null
          generation_type: string
          id: string
          is_active: boolean | null
          model: string
          output: Json
          prompt: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          generation_type: string
          id?: string
          is_active?: boolean | null
          model?: string
          output: Json
          prompt: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          generation_type?: string
          id?: string
          is_active?: boolean | null
          model?: string
          output?: Json
          prompt?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_ai_generations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_business_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          close_time: string | null
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string | null
          tenant_id: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          tenant_id: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_business_hours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_category_images: {
        Row: {
          category: string
          created_at: string | null
          id: string
          image_url: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_category_images_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_encryption_keys: {
        Row: {
          created_at: string | null
          id: string
          key_encrypted: string
          key_version: number | null
          rotated_at: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_encrypted: string
          key_version?: number | null
          rotated_at?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_encrypted?: string
          key_version?: number | null
          rotated_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_encryption_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_integrations: {
        Row: {
          created_at: string | null
          credentials_encrypted: string | null
          id: string
          integration_type: string
          is_enabled: boolean | null
          last_sync_at: string | null
          settings: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          integration_type: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          settings?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          integration_type?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          settings?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_onboarding_progress: {
        Row: {
          created_at: string | null
          dismissed: boolean | null
          id: string
          steps_completed: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          steps_completed?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dismissed?: boolean | null
          id?: string
          steps_completed?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_onboarding_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_stylists: {
        Row: {
          avatar_url: string | null
          color: string | null
          created_at: string | null
          google_calendar_id: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          google_calendar_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          color?: string | null
          created_at?: string | null
          google_calendar_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_stylists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          average_price: number | null
          button_style: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          email: string | null
          facebook_url: string | null
          features: Json | null
          font_body: string | null
          font_heading: string | null
          google_maps_url: string | null
          heading_size: string | null
          hero_image_url: string | null
          hero_images: Json | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          logo_url: string | null
          max_services: number | null
          max_stylists: number | null
          name: string
          name_size: string | null
          phone: string | null
          postal_code: string | null
          preview_expires_at: string | null
          preview_token: string | null
          primary_color: string | null
          secondary_color: string | null
          show_logo_on_landing: boolean | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          tagline: string | null
          theme_id: string | null
          tiktok_url: string | null
          timezone: string | null
          updated_at: string | null
          whatsapp_number: string | null
          whatsapp_sender_id: string | null
        }
        Insert: {
          address?: string | null
          average_price?: number | null
          button_style?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          features?: Json | null
          font_body?: string | null
          font_heading?: string | null
          google_maps_url?: string | null
          heading_size?: string | null
          hero_image_url?: string | null
          hero_images?: Json | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          max_services?: number | null
          max_stylists?: number | null
          name: string
          name_size?: string | null
          phone?: string | null
          postal_code?: string | null
          preview_expires_at?: string | null
          preview_token?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_logo_on_landing?: boolean | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          tagline?: string | null
          theme_id?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          whatsapp_sender_id?: string | null
        }
        Update: {
          address?: string | null
          average_price?: number | null
          button_style?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          features?: Json | null
          font_body?: string | null
          font_heading?: string | null
          google_maps_url?: string | null
          heading_size?: string | null
          hero_image_url?: string | null
          hero_images?: Json | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          max_services?: number | null
          max_stylists?: number | null
          name?: string
          name_size?: string | null
          phone?: string | null
          postal_code?: string | null
          preview_expires_at?: string | null
          preview_token?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_logo_on_landing?: boolean | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          tagline?: string | null
          theme_id?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          whatsapp_sender_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string
          customer_name: string
          customer_name_encrypted: string | null
          discount: number | null
          discount_reason: string | null
          discount_type: string | null
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string
          products: Json | null
          services: Json
          stylist: string
          stylist_id: string | null
          subtotal: number
          tenant_id: string | null
          tip_amount: number | null
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
          customer_name_encrypted?: string | null
          discount?: number | null
          discount_reason?: string | null
          discount_type?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method: string
          products?: Json | null
          services: Json
          stylist: string
          stylist_id?: string | null
          subtotal: number
          tenant_id?: string | null
          tip_amount?: number | null
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
          customer_name_encrypted?: string | null
          discount?: number | null
          discount_reason?: string | null
          discount_type?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string
          products?: Json | null
          services?: Json
          stylist?: string
          stylist_id?: string | null
          subtotal?: number
          tenant_id?: string | null
          tip_amount?: number | null
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
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_decrypted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "tenant_stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          booking_cancelled: boolean | null
          booking_confirmed: boolean | null
          client_cancellation: boolean | null
          client_messages: boolean | null
          created_at: string | null
          id: string
          messages: boolean | null
          new_booking: boolean | null
          new_review: boolean | null
          promotions: boolean | null
          reminder_24h: boolean | null
          reminder_2h: boolean | null
          review_request: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_cancelled?: boolean | null
          booking_confirmed?: boolean | null
          client_cancellation?: boolean | null
          client_messages?: boolean | null
          created_at?: string | null
          id?: string
          messages?: boolean | null
          new_booking?: boolean | null
          new_review?: boolean | null
          promotions?: boolean | null
          reminder_24h?: boolean | null
          reminder_2h?: boolean | null
          review_request?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_cancelled?: boolean | null
          booking_confirmed?: boolean | null
          client_cancellation?: boolean | null
          client_messages?: boolean | null
          created_at?: string | null
          id?: string
          messages?: boolean | null
          new_booking?: boolean | null
          new_review?: boolean | null
          promotions?: boolean | null
          reminder_24h?: boolean | null
          reminder_2h?: boolean | null
          review_request?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          preferred_date: string | null
          preferred_stylist_id: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          priority: number | null
          proposed_at: string | null
          proposed_date: string | null
          proposed_expires_at: string | null
          proposed_stylist_id: string | null
          proposed_time: string | null
          services: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          preferred_date?: string | null
          preferred_stylist_id?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number | null
          proposed_at?: string | null
          proposed_date?: string | null
          proposed_expires_at?: string | null
          proposed_stylist_id?: string | null
          proposed_time?: string | null
          services?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          preferred_date?: string | null
          preferred_stylist_id?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number | null
          proposed_at?: string | null
          proposed_date?: string | null
          proposed_expires_at?: string | null
          proposed_stylist_id?: string | null
          proposed_time?: string | null
          services?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_preferred_stylist_id_fkey"
            columns: ["preferred_stylist_id"]
            isOneToOne: false
            referencedRelation: "tenant_stylists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bookings_decrypted: {
        Row: {
          calendar_id: string | null
          compound_part: string | null
          created_at: string | null
          customer_name: string | null
          end_time: string | null
          Fecha: string | null
          google_calendar_event_id: string | null
          Hora: string | null
          id: string | null
          is_part_of_compound: boolean | null
          related_booking_id: string | null
          services: Json | null
          skip_availability_check: boolean | null
          status: string | null
          stylist: string | null
          Telefono: string | null
          tenant_id: string | null
          total_duration: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calendar_id?: string | null
          compound_part?: string | null
          created_at?: string | null
          customer_name?: never
          end_time?: string | null
          Fecha?: string | null
          google_calendar_event_id?: string | null
          Hora?: string | null
          id?: string | null
          is_part_of_compound?: boolean | null
          related_booking_id?: string | null
          services?: Json | null
          skip_availability_check?: boolean | null
          status?: string | null
          stylist?: string | null
          Telefono?: never
          tenant_id?: string | null
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calendar_id?: string | null
          compound_part?: string | null
          created_at?: string | null
          customer_name?: never
          end_time?: string | null
          Fecha?: string | null
          google_calendar_event_id?: string | null
          Hora?: string | null
          id?: string | null
          is_part_of_compound?: boolean | null
          related_booking_id?: string | null
          services?: Json | null
          skip_availability_check?: boolean | null
          status?: string | null
          stylist?: string | null
          Telefono?: never
          tenant_id?: string | null
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_public: {
        Row: {
          approved: boolean | null
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          tenant_id: string | null
        }
        Insert: {
          approved?: boolean | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          tenant_id?: string | null
        }
        Update: {
          approved?: boolean | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_decrypted: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          discount: number | null
          id: string | null
          notes: string | null
          payment_method: string | null
          services: Json | null
          stylist: string | null
          subtotal: number | null
          tenant_id: string | null
          total: number | null
          voided: boolean | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: never
          discount?: number | null
          id?: string | null
          notes?: string | null
          payment_method?: string | null
          services?: Json | null
          stylist?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          total?: number | null
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: never
          discount?: number | null
          id?: string | null
          notes?: string | null
          payment_method?: string | null
          services?: Json | null
          stylist?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          total?: number | null
          voided?: boolean | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_create_review: { Args: never; Returns: boolean }
      check_availability: {
        Args: { p_email?: string; p_username?: string }
        Returns: Json
      }
      check_password_reset_rate_limit: {
        Args: { user_email: string }
        Returns: boolean
      }
      check_superadmin_email: { Args: { _email: string }; Returns: boolean }
      cleanup_expired_email_verification_tokens: {
        Args: never
        Returns: undefined
      }
      cleanup_expired_notifications: { Args: never; Returns: undefined }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: undefined }
      cleanup_old_error_logs: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          _action_url?: string
          _expires_at?: string
          _message: string
          _metadata?: Json
          _tenant_id?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { _ciphertext: string; _tenant_id: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { _plaintext: string; _tenant_id: string }
        Returns: string
      }
      expire_old_waitlist_entries: { Args: never; Returns: undefined }
      get_follower_count: { Args: { _tenant_id: string }; Returns: number }
      get_following_posts: {
        Args: { _limit?: number; _offset?: number; _user_id: string }
        Returns: {
          caption: string
          category: string
          comments_count: number
          created_at: string
          id: string
          image_url: string
          is_liked: boolean
          likes_count: number
          tenant_id: string
          tenant_logo: string
          tenant_name: string
          tenant_slug: string
        }[]
      }
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
          tenant_address: string
          tenant_id: string
          tenant_logo_url: string
          tenant_name: string
          tenant_phone: string
          tenant_slug: string
          total_duration: number
        }[]
      }
      get_notification_preferences: {
        Args: { p_user_id: string }
        Returns: {
          booking_cancelled: boolean | null
          booking_confirmed: boolean | null
          client_cancellation: boolean | null
          client_messages: boolean | null
          created_at: string | null
          id: string
          messages: boolean | null
          new_booking: boolean | null
          new_review: boolean | null
          promotions: boolean | null
          reminder_24h: boolean | null
          reminder_2h: boolean | null
          review_request: boolean | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_public_tenant_by_id: {
        Args: { _id: string }
        Returns: {
          id: string
          logo_url: string
          name: string
          primary_color: string
          slug: string
        }[]
      }
      get_public_tenant_by_slug: {
        Args: { _slug: string }
        Returns: {
          address: string
          average_price: number
          button_style: string
          city: string
          country: string
          description: string
          email: string
          facebook_url: string
          features: Json
          font_body: string
          font_heading: string
          google_maps_url: string
          heading_size: string
          hero_image_url: string
          hero_images: Json
          id: string
          instagram_url: string
          logo_url: string
          name: string
          phone: string
          postal_code: string
          primary_color: string
          secondary_color: string
          show_logo_on_landing: boolean
          slug: string
          tagline: string
          theme_id: string
          whatsapp_number: string
        }[]
      }
      get_public_tenants: {
        Args: never
        Returns: {
          address: string
          average_price: number
          city: string
          description: string
          features: Json
          hero_image_url: string
          hero_images: Json
          id: string
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          tagline: string
        }[]
      }
      get_tenant_by_slug: { Args: { _slug: string }; Returns: string }
      get_tenant_reviews: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewer_avatar: string
          reviewer_name: string
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _tenant_id?: string
              _user_id: string
            }
            Returns: boolean
          }
      invoke_booking_notifications: { Args: never; Returns: undefined }
      is_superadmin: { Args: never; Returns: boolean }
      is_tenant_active: { Args: { _tenant_id: string }; Returns: boolean }
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
      send_booking_reminders: { Args: never; Returns: undefined }
      user_belongs_to_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "stylist" | "superadmin"
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
      app_role: ["admin", "stylist", "superadmin"],
    },
  },
} as const
