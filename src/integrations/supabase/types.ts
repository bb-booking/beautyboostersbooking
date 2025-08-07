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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      booster_profiles: {
        Row: {
          bio: string | null
          created_at: string
          hourly_rate: number
          id: string
          is_available: boolean | null
          location: string
          name: string
          portfolio_image_url: string | null
          rating: number | null
          review_count: number | null
          specialties: string[]
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          hourly_rate: number
          id?: string
          is_available?: boolean | null
          location: string
          name: string
          portfolio_image_url?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[]
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          hourly_rate?: number
          id?: string
          is_available?: boolean | null
          location?: string
          name?: string
          portfolio_image_url?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[]
          updated_at?: string
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
          location?: string
          required_skills?: string[] | null
          service_type?: string
          status?: string
          time_needed?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
