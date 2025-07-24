export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_summary: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_value: number | null
          period_end: string
          period_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_value?: number | null
          period_end: string
          period_start: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number | null
          period_end?: string
          period_start?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          business_hours: string | null
          company_name: string
          country: string | null
          created_at: string
          currency_code: string | null
          currency_symbol: string | null
          email: string | null
          highlight_color: string | null
          id: number
          link_color: string | null
          logo_url: string | null
          notification_sender_email: string | null
          notification_sender_name: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          theme_color: string | null
          twitter_handle: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          email?: string | null
          highlight_color?: string | null
          id?: number
          link_color?: string | null
          logo_url?: string | null
          notification_sender_email?: string | null
          notification_sender_name?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          theme_color?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          email?: string | null
          highlight_color?: string | null
          id?: number
          link_color?: string | null
          logo_url?: string | null
          notification_sender_email?: string | null
          notification_sender_name?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          theme_color?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      customer_feedback: {
        Row: {
          comments: string | null
          created_at: string | null
          customer_id: string | null
          delivery_score: number | null
          id: string
          job_id: number | null
          quality_score: number | null
          satisfaction_score: number | null
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_score?: number | null
          id?: string
          job_id?: number | null
          quality_score?: number | null
          satisfaction_score?: number | null
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_score?: number | null
          id?: string
          job_id?: number | null
          quality_score?: number | null
          satisfaction_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          customer_display_id: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_display_id?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_display_id?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          delivery_schedule_id: string
          id: string
          location: string | null
          new_status: string
          notes: string | null
          previous_status: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          delivery_schedule_id: string
          id?: string
          location?: string | null
          new_status: string
          notes?: string | null
          previous_status?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          delivery_schedule_id?: string
          id?: string
          location?: string | null
          new_status?: string
          notes?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_history_delivery_schedule_id_fkey"
            columns: ["delivery_schedule_id"]
            isOneToOne: false
            referencedRelation: "delivery_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_schedules: {
        Row: {
          actual_delivery_time: string | null
          assigned_driver_id: string | null
          created_at: string
          created_by: string | null
          delivery_address: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          delivery_fee: number | null
          delivery_instructions: string | null
          delivery_method: string
          delivery_notes: string | null
          delivery_status: string
          estimated_delivery_time: string | null
          id: string
          job_id: number
          non_system_staff_id: string | null
          scheduled_date: string
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery_time?: string | null
          assigned_driver_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_fee?: number | null
          delivery_instructions?: string | null
          delivery_method: string
          delivery_notes?: string | null
          delivery_status?: string
          estimated_delivery_time?: string | null
          id?: string
          job_id: number
          non_system_staff_id?: string | null
          scheduled_date: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery_time?: string | null
          assigned_driver_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_fee?: number | null
          delivery_instructions?: string | null
          delivery_method?: string
          delivery_notes?: string | null
          delivery_status?: string
          estimated_delivery_time?: string | null
          id?: string
          job_id?: number
          non_system_staff_id?: string | null
          scheduled_date?: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_schedules_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_schedules_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_schedules_non_system_staff_id_fkey"
            columns: ["non_system_staff_id"]
            isOneToOne: false
            referencedRelation: "non_system_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          allowances: number | null
          auth_user_id: string | null
          created_at: string
          created_by: string | null
          deductions: number | null
          email: string | null
          employee_number: string
          hire_date: string | null
          id: string
          internal_user_id: string | null
          is_active: boolean | null
          name: string
          non_system_staff_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["employee_role"]
          salary: number | null
          updated_at: string
        }
        Insert: {
          allowances?: number | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          email?: string | null
          employee_number: string
          hire_date?: string | null
          id?: string
          internal_user_id?: string | null
          is_active?: boolean | null
          name: string
          non_system_staff_id?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["employee_role"]
          salary?: number | null
          updated_at?: string
        }
        Update: {
          allowances?: number | null
          auth_user_id?: string | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          email?: string | null
          employee_number?: string
          hire_date?: string | null
          id?: string
          internal_user_id?: string | null
          is_active?: boolean | null
          name?: string
          non_system_staff_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["employee_role"]
          salary?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_internal_user_id_fkey"
            columns: ["internal_user_id"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_non_system_staff_id_fkey"
            columns: ["non_system_staff_id"]
            isOneToOne: false
            referencedRelation: "non_system_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      finishing_options: {
        Row: {
          category: string
          description: string | null
          id: number
          name: string
          price_adjustment: number | null
        }
        Insert: {
          category: string
          description?: string | null
          id?: number
          name: string
          price_adjustment?: number | null
        }
        Update: {
          category?: string
          description?: string | null
          id?: number
          name?: string
          price_adjustment?: number | null
        }
        Relationships: []
      }
      internal_users: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role_id: number
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          role_id: number
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          issued_date: string | null
          job_id: number | null
          notes: string | null
          paid_amount: number | null
          quote_id: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance_due?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_date?: string | null
          job_id?: number | null
          notes?: string | null
          paid_amount?: number | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          balance_due?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_date?: string | null
          job_id?: number | null
          notes?: string | null
          paid_amount?: number | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_files: {
        Row: {
          description: string | null
          file_path: string
          id: number
          job_id: number
          uploaded_at: string | null
        }
        Insert: {
          description?: string | null
          file_path: string
          id?: number
          job_id: number
          uploaded_at?: string | null
        }
        Update: {
          description?: string | null
          file_path?: string
          id?: number
          job_id?: number
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_finishing_options: {
        Row: {
          finishing_option_id: number
          id: number
          job_id: number
        }
        Insert: {
          finishing_option_id: number
          id?: number
          job_id: number
        }
        Update: {
          finishing_option_id?: number
          id?: number
          job_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_finishing_options_finishing_option_id_fkey"
            columns: ["finishing_option_id"]
            isOneToOne: false
            referencedRelation: "finishing_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_finishing_options_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          id: number
          job_id: number
          status_id: number
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          id?: number
          job_id: number
          status_id: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          id?: number
          job_id?: number
          status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_completion: string | null
          created_at: string | null
          created_by: string | null
          created_by_user: string | null
          current_status: number
          customer_id: string | null
          customer_uuid: string
          delivery_address: string | null
          delivery_method: string
          description: string | null
          due_date: string | null
          estimated_completion: string | null
          files: Json | null
          final_price: number | null
          finishing_options: Json | null
          id: number
          length: number | null
          paper_type: string | null
          paper_weight: string | null
          quantity: number | null
          quoted_price: number | null
          service_id: number
          service_subtype: string | null
          status: string | null
          title: string | null
          tracking_code: string | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          actual_completion?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user?: string | null
          current_status: number
          customer_id?: string | null
          customer_uuid: string
          delivery_address?: string | null
          delivery_method: string
          description?: string | null
          due_date?: string | null
          estimated_completion?: string | null
          files?: Json | null
          final_price?: number | null
          finishing_options?: Json | null
          id?: number
          length?: number | null
          paper_type?: string | null
          paper_weight?: string | null
          quantity?: number | null
          quoted_price?: number | null
          service_id: number
          service_subtype?: string | null
          status?: string | null
          title?: string | null
          tracking_code?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          actual_completion?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user?: string | null
          current_status?: number
          customer_id?: string | null
          customer_uuid?: string
          delivery_address?: string | null
          delivery_method?: string
          description?: string | null
          due_date?: string | null
          estimated_completion?: string | null
          files?: Json | null
          final_price?: number | null
          finishing_options?: Json | null
          id?: number
          length?: number | null
          paper_type?: string | null
          paper_weight?: string | null
          quantity?: number | null
          quoted_price?: number | null
          service_id?: number
          service_subtype?: string | null
          status?: string | null
          title?: string | null
          tracking_code?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_user_fkey"
            columns: ["created_by_user"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_uuid_fkey"
            columns: ["customer_uuid"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      non_system_staff: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          customer_id: string
          delivery_updates: boolean | null
          email_notifications: boolean | null
          id: string
          job_status_updates: boolean | null
          promotional_messages: boolean | null
          sms_notifications: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_updates?: boolean | null
          email_notifications?: boolean | null
          id?: string
          job_status_updates?: boolean | null
          promotional_messages?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_updates?: boolean | null
          email_notifications?: boolean | null
          id?: string
          job_status_updates?: boolean | null
          promotional_messages?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          delivery_schedule_id: string | null
          error_message: string | null
          external_id: string | null
          id: string
          job_id: number | null
          message: string
          notification_event: string
          notification_type: string
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_schedule_id?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          job_id?: number | null
          message: string
          notification_event: string
          notification_type: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_schedule_id?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          job_id?: number | null
          message?: string
          notification_event?: string
          notification_type?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_delivery_schedule_id_fkey"
            columns: ["delivery_schedule_id"]
            isOneToOne: false
            referencedRelation: "delivery_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_payments: {
        Row: {
          allowances: number | null
          base_salary: number
          created_at: string
          deductions: number | null
          employee_id: string
          id: string
          net_amount: number | null
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payroll_id: string
        }
        Insert: {
          allowances?: number | null
          base_salary: number
          created_at?: string
          deductions?: number | null
          employee_id: string
          id?: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payroll_id: string
        }
        Update: {
          allowances?: number | null
          base_salary?: number
          created_at?: string
          deductions?: number | null
          employee_id?: string
          id?: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payroll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payments_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payrolls"
            referencedColumns: ["id"]
          },
        ]
      }
      payrolls: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          month: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          month: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          month?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payrolls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payrolls_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          customer_display_id: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_display_id?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          role_id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_display_id?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          finishing_option_id: number | null
          id: string
          quantity: number | null
          quote_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          finishing_option_id?: number | null
          id?: string
          quantity?: number | null
          quote_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          finishing_option_id?: number | null
          id?: string
          quantity?: number | null
          quote_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_finishing_option_id_fkey"
            columns: ["finishing_option_id"]
            isOneToOne: false
            referencedRelation: "finishing_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          converted_to_job_id: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_address: string | null
          delivery_method: string
          description: string | null
          id: string
          length: number | null
          notes: string | null
          quantity: number | null
          quoted_price: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_id: number
          status: Database["public"]["Enums"]["quote_status"] | null
          title: string
          updated_at: string
          valid_until: string | null
          validity_days: number | null
          width: number | null
        }
        Insert: {
          converted_to_job_id?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_address?: string | null
          delivery_method: string
          description?: string | null
          id?: string
          length?: number | null
          notes?: string | null
          quantity?: number | null
          quoted_price?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id: number
          status?: Database["public"]["Enums"]["quote_status"] | null
          title: string
          updated_at?: string
          valid_until?: string | null
          validity_days?: number | null
          width?: number | null
        }
        Update: {
          converted_to_job_id?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_address?: string | null
          delivery_method?: string
          description?: string | null
          id?: string
          length?: number | null
          notes?: string | null
          quantity?: number | null
          quoted_price?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: number
          status?: Database["public"]["Enums"]["quote_status"] | null
          title?: string
          updated_at?: string
          valid_until?: string | null
          validity_days?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_converted_to_job_id_fkey"
            columns: ["converted_to_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          available_finishes: Json | null
          available_paper_types: Json | null
          available_paper_weights: Json | null
          available_subtypes: Json | null
          base_price: number | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean | null
          name: string
          requires_dimensions: boolean | null
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          available_finishes?: Json | null
          available_paper_types?: Json | null
          available_paper_weights?: Json | null
          available_subtypes?: Json | null
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          name: string
          requires_dimensions?: boolean | null
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          available_finishes?: Json | null
          available_paper_types?: Json | null
          available_paper_weights?: Json | null
          available_subtypes?: Json | null
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          requires_dimensions?: boolean | null
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      showcase_slides: {
        Row: {
          file_path: string
          id: number
          title: string | null
          uploaded_at: string | null
          uploaded_by: number | null
        }
        Insert: {
          file_path: string
          id?: number
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: number | null
        }
        Update: {
          file_path?: string
          id?: number
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "showcase_slides_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          name: string
          password_hash: string
          phone: string | null
          role_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          name: string
          password_hash: string
          phone?: string | null
          role_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          name?: string
          password_hash?: string
          phone?: string | null
          role_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_status: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_customer_display_id: {
        Args: { profile_uuid: string }
        Returns: number
      }
      generate_employee_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_job_tracking_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unified_customer_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unified_employee_id: {
        Args: { employee_role: string }
        Returns: string
      }
      get_internal_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_by_auth_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_safe: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_type: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin_only: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_customer_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_internal_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_staff_or_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_system_user: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      employee_role: "Admin" | "SystemUser" | "NonSystemStaff"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "mobile_money"
        | "card"
        | "cheque"
      quote_status:
        | "requested"
        | "reviewed"
        | "sent"
        | "approved"
        | "rejected"
        | "converted"
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
      employee_role: ["Admin", "SystemUser", "NonSystemStaff"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      payment_method: [
        "cash",
        "bank_transfer",
        "mobile_money",
        "card",
        "cheque",
      ],
      quote_status: [
        "requested",
        "reviewed",
        "sent",
        "approved",
        "rejected",
        "converted",
      ],
    },
  },
} as const
