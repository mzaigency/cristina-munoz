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
            foreignKeyName: "bookings_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_decrypted"
            referencedColumns: ["id"]
          },
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
      customer_fiscal_data: {
        Row: {
          created_at: string
          customer_name: string
          email: string | null
          fiscal_address: string | null
          fiscal_name: string | null
          id: string
          nif: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          email?: string | null
          fiscal_address?: string | null
          fiscal_name?: string | null
          id?: string
          nif?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          email?: string | null
          fiscal_address?: string | null
          fiscal_name?: string | null
          id?: string
          nif?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_fiscal_data_tenant_id_fkey"
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
      invoices: {
        Row: {
          created_at: string
          created_by: string
          customer_name: string
          discount: number | null
          fiscal_address: string | null
          fiscal_name: string | null
          id: string
          invoice_number: string
          items: Json
          nif: string | null
          payment_method: string
          stylist_name: string | null
          subtotal: number
          tenant_id: string
          tip_amount: number | null
          total: number
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_name: string
          discount?: number | null
          fiscal_address?: string | null
          fiscal_name?: string | null
          id?: string
          invoice_number: string
          items: Json
          nif?: string | null
          payment_method: string
          stylist_name?: string | null
          subtotal: number
          tenant_id: string
          tip_amount?: number | null
          total: number
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_name?: string
          discount?: number | null
          fiscal_address?: string | null
          fiscal_name?: string | null
          id?: string
          invoice_number?: string
          items?: Json
          nif?: string | null
          payment_method?: string
          stylist_name?: string | null
          subtotal?: number
          tenant_id?: string
          tip_amount?: number | null
          total?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions_decrypted"
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
      products: {
        Row: {
          barcode: string | null
          category: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_stock: number | null
          name: string
          price: number
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
          is_active?: boolean | null
          min_stock?: number | null
          name: string
          price?: number
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
          is_active?: boolean | null
          min_stock?: number | null
          name?: string
          price?: number
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
          commission_percentage: number | null
          created_at: string | null
          effective_from: string | null
          id: string
          stylist_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          commission_percentage?: number | null
          created_at?: string | null
          effective_from?: string | null
          id?: string
          stylist_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_percentage?: number | null
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
          phone: string | null
          postal_code: string | null
          preview_expires_at: string | null
          preview_token: string | null
          primary_color: string | null
          secondary_color: string | null
          show_logo_on_landing: boolean | null
          slug: string
          subscription_expires_at: string | null
          subscription_plan: string | null
          tagline: string | null
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
          phone?: string | null
          postal_code?: string | null
          preview_expires_at?: string | null
          preview_token?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_logo_on_landing?: boolean | null
          slug: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          tagline?: string | null
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
          phone?: string | null
          postal_code?: string | null
          preview_expires_at?: string | null
          preview_token?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_logo_on_landing?: boolean | null
          slug?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          tagline?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          whatsapp_sender_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
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
          name_encrypted: string | null
          phone_number: string
          phone_number_encrypted: string | null
          tenant_id: string | null
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
          name_encrypted?: string | null
          phone_number: string
          phone_number_encrypted?: string | null
          tenant_id?: string | null
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
          name_encrypted?: string | null
          phone_number?: string
          phone_number_encrypted?: string | null
          tenant_id?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          contact_id: string
          content: string
          content_encrypted: string | null
          created_at: string
          id: string
          message_type: string
          tenant_id: string | null
        }
        Insert: {
          contact_id: string
          content: string
          content_encrypted?: string | null
          created_at?: string
          id?: string
          message_type: string
          tenant_id?: string | null
        }
        Update: {
          contact_id?: string
          content?: string
          content_encrypted?: string | null
          created_at?: string
          id?: string
          message_type?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts_decrypted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
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
            foreignKeyName: "bookings_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_decrypted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
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
      whatsapp_contacts_decrypted: {
        Row: {
          ai_agent_enabled: boolean | null
          blocked: boolean | null
          created_at: string | null
          id: string | null
          last_message_at: string | null
          name: string | null
          phone_number: string | null
          tenant_id: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          ai_agent_enabled?: boolean | null
          blocked?: boolean | null
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          name?: never
          phone_number?: never
          tenant_id?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_agent_enabled?: boolean | null
          blocked?: boolean | null
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          name?: never
          phone_number?: never
          tenant_id?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages_decrypted: {
        Row: {
          contact_id: string | null
          content: string | null
          created_at: string | null
          id: string | null
          message_type: string | null
          tenant_id: string | null
        }
        Insert: {
          contact_id?: string | null
          content?: never
          created_at?: string | null
          id?: string | null
          message_type?: string | null
          tenant_id?: string | null
        }
        Update: {
          contact_id?: string | null
          content?: never
          created_at?: string | null
          id?: string | null
          message_type?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts_decrypted"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
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
      check_password_reset_rate_limit: {
        Args: { user_email: string }
        Returns: boolean
      }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: undefined }
      decrypt_sensitive_data: {
        Args: { _ciphertext: string; _tenant_id: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { _plaintext: string; _tenant_id: string }
        Returns: string
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
          total_duration: number
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
      get_user_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
