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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      address_cache: {
        Row: {
          address: string
          bbr_data: Json | null
          cached_at: string
          city: string | null
          expires_at: string
          id: string
          postal_code: string | null
        }
        Insert: {
          address: string
          bbr_data?: Json | null
          cached_at?: string
          city?: string | null
          expires_at?: string
          id?: string
          postal_code?: string | null
        }
        Update: {
          address?: string
          bbr_data?: Json | null
          cached_at?: string
          city?: string | null
          expires_at?: string
          id?: string
          postal_code?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      agent_profiles: {
        Row: {
          bio: string | null
          company_name: string | null
          created_at: string
          email: string
          id: string
          license_number: string | null
          name: string
          phone: string | null
          profile_image_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          license_number?: string | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          license_number?: string | null
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      booking_reminders: {
        Row: {
          created_at: string
          email: string
          id: string
          payload: Json | null
          scheduled_at: string
          sent_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          payload?: Json | null
          scheduled_at: string
          sent_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          payload?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          type?: string
        }
        Relationships: []
      }
      booking_reviews: {
        Row: {
          booking_id: string
          booster_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          booster_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          booster_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_reviews_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount: number
          assignment_attempts: number | null
          booking_date: string
          booking_time: string
          booster_id: string | null
          booster_name: string | null
          booster_status: string | null
          cancellation_policy_accepted: boolean | null
          created_at: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          discount_code: string | null
          duration_hours: number | null
          id: string
          last_assignment_attempt: string | null
          location: string | null
          payment_captured_at: string | null
          payment_intent_id: string | null
          service_name: string
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          assignment_attempts?: number | null
          booking_date: string
          booking_time: string
          booster_id?: string | null
          booster_name?: string | null
          booster_status?: string | null
          cancellation_policy_accepted?: boolean | null
          created_at?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_code?: string | null
          duration_hours?: number | null
          id?: string
          last_assignment_attempt?: string | null
          location?: string | null
          payment_captured_at?: string | null
          payment_intent_id?: string | null
          service_name: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assignment_attempts?: number | null
          booking_date?: string
          booking_time?: string
          booster_id?: string | null
          booster_name?: string | null
          booster_status?: string | null
          cancellation_policy_accepted?: boolean | null
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_code?: string | null
          duration_hours?: number | null
          id?: string
          last_assignment_attempt?: string | null
          location?: string | null
          payment_captured_at?: string | null
          payment_intent_id?: string | null
          service_name?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      booster_applications: {
        Row: {
          address: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to_admin_id: string | null
          business_type: string | null
          city: string | null
          cpr_number: string | null
          created_at: string
          cvr_number: string | null
          education: Json | null
          email: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          portfolio_links: string | null
          primary_transport: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[]
          status: string
          updated_at: string
          user_id: string | null
          work_radius: number | null
          years_experience: number | null
        }
        Insert: {
          address?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to_admin_id?: string | null
          business_type?: string | null
          city?: string | null
          cpr_number?: string | null
          created_at?: string
          cvr_number?: string | null
          education?: Json | null
          email: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          portfolio_links?: string | null
          primary_transport?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
          work_radius?: number | null
          years_experience?: number | null
        }
        Update: {
          address?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to_admin_id?: string | null
          business_type?: string | null
          city?: string | null
          cpr_number?: string | null
          created_at?: string
          cvr_number?: string | null
          education?: Json | null
          email?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          portfolio_links?: string | null
          primary_transport?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
          work_radius?: number | null
          years_experience?: number | null
        }
        Relationships: []
      }
      booster_availability: {
        Row: {
          booster_id: string | null
          created_at: string | null
          date: string
          end_time: string
          id: string
          job_id: string | null
          notes: string | null
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          booster_id?: string | null
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          job_id?: string | null
          notes?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          booster_id?: string | null
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booster_availability_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booster_availability_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      booster_booking_requests: {
        Row: {
          booking_id: string | null
          booster_id: string | null
          created_at: string
          expires_at: string
          id: string
          notified_at: string | null
          responded_at: string | null
          response_message: string | null
          status: string
        }
        Insert: {
          booking_id?: string | null
          booster_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          notified_at?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string
        }
        Update: {
          booking_id?: string | null
          booster_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          notified_at?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booster_booking_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booster_booking_requests_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booster_profiles: {
        Row: {
          bio: string | null
          calendar_provider: string | null
          calendar_sync_token: string | null
          cpr_encrypted: string | null
          created_at: string
          default_end_time: string | null
          default_start_time: string | null
          email: string | null
          employment_type: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          location: string
          name: string
          phone: string | null
          portfolio_image_url: string | null
          private_address: string | null
          private_city: string | null
          private_postal_code: string | null
          rating: number | null
          review_count: number | null
          specialties: string[]
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          calendar_provider?: string | null
          calendar_sync_token?: string | null
          cpr_encrypted?: string | null
          created_at?: string
          default_end_time?: string | null
          default_start_time?: string | null
          email?: string | null
          employment_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          location: string
          name: string
          phone?: string | null
          portfolio_image_url?: string | null
          private_address?: string | null
          private_city?: string | null
          private_postal_code?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[]
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          calendar_provider?: string | null
          calendar_sync_token?: string | null
          cpr_encrypted?: string | null
          created_at?: string
          default_end_time?: string | null
          default_start_time?: string | null
          email?: string | null
          employment_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          location?: string
          name?: string
          phone?: string | null
          portfolio_image_url?: string | null
          private_address?: string | null
          private_city?: string | null
          private_postal_code?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[]
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      competence_tags: {
        Row: {
          category: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          booster_id: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          email: string | null
          id: string
          message: string | null
          read_at: string | null
          sender: string
        }
        Insert: {
          booster_id?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          sender: string
        }
        Update: {
          booster_id?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived: boolean | null
          created_at: string
          email: string | null
          group_name: string | null
          id: string
          last_message_at: string | null
          name: string | null
          participants: Json | null
          phone: string | null
          priority: string | null
          status: string
          tags: string[] | null
          type: string
          unread_admin_count: number
          unread_user_count: number
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          participants?: Json | null
          phone?: string | null
          priority?: string | null
          status?: string
          tags?: string[] | null
          type?: string
          unread_admin_count?: number
          unread_user_count?: number
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          participants?: Json | null
          phone?: string | null
          priority?: string | null
          status?: string
          tags?: string[] | null
          type?: string
          unread_admin_count?: number
          unread_user_count?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          postal_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label: string
          postal_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          postal_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_favorites: {
        Row: {
          booster_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          booster_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          booster_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          max_redemptions: number | null
          min_amount: number
          per_user_limit: number | null
          salon_id: string | null
          type: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          amount: number
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          max_redemptions?: number | null
          min_amount?: number
          per_user_limit?: number | null
          salon_id?: string | null
          type: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          max_redemptions?: number | null
          min_amount?: number
          per_user_limit?: number | null
          salon_id?: string | null
          type?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          antal_personer: number | null
          beskrivelse: string
          budget: string | null
          created_at: string
          email: string
          id: string
          lokation: string | null
          navn: string
          projekt_type: string | null
          service_id: string | null
          slut_dato: string | null
          specielle_krav: string | null
          start_dato: string | null
          status: string | null
          telefon: string
          updated_at: string
          virksomhed: string | null
        }
        Insert: {
          antal_personer?: number | null
          beskrivelse: string
          budget?: string | null
          created_at?: string
          email: string
          id?: string
          lokation?: string | null
          navn: string
          projekt_type?: string | null
          service_id?: string | null
          slut_dato?: string | null
          specielle_krav?: string | null
          start_dato?: string | null
          status?: string | null
          telefon: string
          updated_at?: string
          virksomhed?: string | null
        }
        Update: {
          antal_personer?: number | null
          beskrivelse?: string
          budget?: string | null
          created_at?: string
          email?: string
          id?: string
          lokation?: string | null
          navn?: string
          projekt_type?: string | null
          service_id?: string | null
          slut_dato?: string | null
          specielle_krav?: string | null
          start_dato?: string | null
          status?: string | null
          telefon?: string
          updated_at?: string
          virksomhed?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string
          due_date: string | null
          economic_invoice_id: number | null
          id: string
          invoice_number: string | null
          job_id: string | null
          sent_at: string | null
          status: string
          total_amount: number
          updated_at: string | null
          vat_amount: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name: string
          due_date?: string | null
          economic_invoice_id?: number | null
          id?: string
          invoice_number?: string | null
          job_id?: string | null
          sent_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
          vat_amount?: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string
          due_date?: string | null
          economic_invoice_id?: number | null
          id?: string
          invoice_number?: string | null
          job_id?: string | null
          sent_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string
          booster_id: string
          id: string
          job_id: string
          message: string | null
          status: string
        }
        Insert: {
          applied_at?: string
          booster_id: string
          id?: string
          job_id: string
          message?: string | null
          status?: string
        }
        Update: {
          applied_at?: string
          booster_id?: string
          id?: string
          job_id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_booster_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          booster_id: string
          id: string
          job_id: string
          notes: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          booster_id: string
          id?: string
          job_id: string
          notes?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          booster_id?: string
          id?: string
          job_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_booster_assignments_booster_id_fkey"
            columns: ["booster_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_booster_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_communications: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          job_id: string | null
          message_text: string | null
          read_at: string | null
          sender_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          job_id?: string | null
          message_text?: string | null
          read_at?: string | null
          sender_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          job_id?: string | null
          message_text?: string | null
          read_at?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_communications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_competence_tags: {
        Row: {
          competence_tag_id: string | null
          created_at: string | null
          id: string
          job_id: string | null
        }
        Insert: {
          competence_tag_id?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
        }
        Update: {
          competence_tag_id?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_competence_tags_competence_tag_id_fkey"
            columns: ["competence_tag_id"]
            isOneToOne: false
            referencedRelation: "competence_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_competence_tags_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_services: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          people_count: number | null
          service_id: string
          service_name: string
          service_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          people_count?: number | null
          service_id: string
          service_name: string
          service_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          people_count?: number | null
          service_id?: string
          service_name?: string
          service_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_services_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_booster_id: string | null
          boosters_needed: number | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_type: string | null
          created_at: string
          created_by: string | null
          date_needed: string
          description: string | null
          duration_hours: number | null
          hourly_rate: number
          id: string
          invoice_id: string | null
          invoice_sent: boolean | null
          location: string
          required_skills: string[] | null
          service_type: string
          status: string
          time_needed: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_booster_id?: string | null
          boosters_needed?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type?: string | null
          created_at?: string
          created_by?: string | null
          date_needed: string
          description?: string | null
          duration_hours?: number | null
          hourly_rate: number
          id?: string
          invoice_id?: string | null
          invoice_sent?: boolean | null
          location: string
          required_skills?: string[] | null
          service_type: string
          status?: string
          time_needed?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_booster_id?: string | null
          boosters_needed?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type?: string | null
          created_at?: string
          created_by?: string | null
          date_needed?: string
          description?: string | null
          duration_hours?: number | null
          hourly_rate?: number
          id?: string
          invoice_id?: string | null
          invoice_sent?: boolean | null
          location?: string
          required_skills?: string[] | null
          service_type?: string
          status?: string
          time_needed?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          message: string
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          message: string
          read_at?: string | null
          recipient_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          message?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "booster_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_estimates: {
        Row: {
          confidence_score: number | null
          created_at: string
          estimated_price: number
          estimation_data: Json | null
          estimation_method: string | null
          id: string
          property_listing_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          estimated_price: number
          estimation_data?: Json | null
          estimation_method?: string | null
          id?: string
          property_listing_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          estimated_price?: number
          estimation_data?: Json | null
          estimation_method?: string | null
          id?: string
          property_listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_estimates_property_listing_id_fkey"
            columns: ["property_listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listings: {
        Row: {
          address: string
          agent_email: string | null
          agent_id: string | null
          agent_name: string | null
          agent_phone: string | null
          asking_price: number | null
          bbr_data: Json | null
          build_year: number | null
          city: string
          created_at: string
          description: string | null
          energy_label: string | null
          estimated_price: number | null
          external_data: Json | null
          floor_area: number | null
          floor_level: number | null
          id: string
          listing_date: string | null
          listing_price: number | null
          monthly_costs: number | null
          plot_area: number | null
          postal_code: string
          price_per_m2: number | null
          property_type: string
          rooms: number | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          address: string
          agent_email?: string | null
          agent_id?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          asking_price?: number | null
          bbr_data?: Json | null
          build_year?: number | null
          city: string
          created_at?: string
          description?: string | null
          energy_label?: string | null
          estimated_price?: number | null
          external_data?: Json | null
          floor_area?: number | null
          floor_level?: number | null
          id?: string
          listing_date?: string | null
          listing_price?: number | null
          monthly_costs?: number | null
          plot_area?: number | null
          postal_code: string
          price_per_m2?: number | null
          property_type: string
          rooms?: number | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          agent_email?: string | null
          agent_id?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          asking_price?: number | null
          bbr_data?: Json | null
          build_year?: number | null
          city?: string
          created_at?: string
          description?: string | null
          energy_label?: string | null
          estimated_price?: number | null
          external_data?: Json | null
          floor_area?: number | null
          floor_level?: number | null
          id?: string
          listing_date?: string | null
          listing_price?: number | null
          monthly_costs?: number | null
          plot_area?: number | null
          postal_code?: string
          price_per_m2?: number | null
          property_type?: string
          rooms?: number | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_url: string
          property_listing_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url: string
          property_listing_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url?: string
          property_listing_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_listing_id_fkey"
            columns: ["property_listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      salon_bookings: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          employee_id: string | null
          end_time: string
          id: string
          notes: string | null
          salon_id: string
          service_id: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          employee_id?: string | null
          end_time: string
          id?: string
          notes?: string | null
          salon_id: string
          service_id?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          employee_id?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          salon_id?: string
          service_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_bookings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "salon_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "salon_services"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_employee_services: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          service_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_employee_services_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "salon_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_employee_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "salon_services"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_employees: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          role: string
          salon_id: string
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string
          salon_id: string
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string
          salon_id?: string
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_employees_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salon_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_profiles: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          created_at: string
          cvr: string | null
          email: string | null
          employee_names: string[]
          employees_count: number | null
          id: string
          industry: string | null
          onboarding_complete: boolean
          opening_hours: Json | null
          owner_user_id: string
          phone: string | null
          services: string[]
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          created_at?: string
          cvr?: string | null
          email?: string | null
          employee_names?: string[]
          employees_count?: number | null
          id?: string
          industry?: string | null
          onboarding_complete?: boolean
          opening_hours?: Json | null
          owner_user_id: string
          phone?: string | null
          services?: string[]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          cvr?: string | null
          email?: string | null
          employee_names?: string[]
          employees_count?: number | null
          id?: string
          industry?: string | null
          onboarding_complete?: boolean
          opening_hours?: Json | null
          owner_user_id?: string
          phone?: string | null
          services?: string[]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      salon_services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          duration_minutes: number
          id: string
          name: string
          price: number
          salon_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name: string
          price: number
          salon_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salon_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_bookings: {
        Row: {
          assigned_booster_id: string | null
          booking_date: string | null
          booking_time: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          financial_status: string
          fulfillment_status: string | null
          id: string
          location: string | null
          order_data: Json
          service_details: Json | null
          service_name: string
          shopify_order_id: number
          shopify_order_number: string
          special_requests: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          assigned_booster_id?: string | null
          booking_date?: string | null
          booking_time?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          financial_status?: string
          fulfillment_status?: string | null
          id?: string
          location?: string | null
          order_data: Json
          service_details?: Json | null
          service_name: string
          shopify_order_id: number
          shopify_order_number: string
          special_requests?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          assigned_booster_id?: string | null
          booking_date?: string | null
          booking_time?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          financial_status?: string
          fulfillment_status?: string | null
          id?: string
          location?: string | null
          order_data?: Json
          service_details?: Json | null
          service_name?: string
          shopify_order_id?: number
          shopify_order_number?: string
          special_requests?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      shopify_products: {
        Row: {
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          last_synced_at: string
          price: number
          product_type: string | null
          shopify_handle: string | null
          shopify_product_id: number
          shopify_url: string | null
          status: string
          sync_status: string
          tags: string[] | null
          title: string
          updated_at: string
          variants: Json | null
          vendor: string | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          last_synced_at?: string
          price: number
          product_type?: string | null
          shopify_handle?: string | null
          shopify_product_id: number
          shopify_url?: string | null
          status?: string
          sync_status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          variants?: Json | null
          vendor?: string | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          last_synced_at?: string
          price?: number
          product_type?: string | null
          shopify_handle?: string | null
          shopify_product_id?: number
          shopify_url?: string | null
          status?: string
          sync_status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          variants?: Json | null
          vendor?: string | null
        }
        Relationships: []
      }
      shopify_webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          processed_successfully: boolean
          shopify_order_id: number | null
          webhook_data: Json
          webhook_topic: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          processed_successfully?: boolean
          shopify_order_id?: number | null
          webhook_data: Json
          webhook_topic: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          processed_successfully?: boolean
          shopify_order_id?: number | null
          webhook_data?: Json
          webhook_topic?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_salon_access: { Args: { _salon_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "booster" | "salon"
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
      app_role: ["admin", "booster", "salon"],
    },
  },
} as const
