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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read: boolean
          request_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          request_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          request_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_scores: {
        Row: {
          ai_concerns: string[]
          ai_strengths: string[]
          ai_summary: string
          candidate_id: string
          created_at: string
          cv_breakdown: Json
          cv_score: number | null
          flag: string | null
          global_score: number | null
          id: string
          interview_breakdown: Json
          interview_score: number | null
          scored_at: string | null
          updated_at: string
        }
        Insert: {
          ai_concerns?: string[]
          ai_strengths?: string[]
          ai_summary?: string
          candidate_id: string
          created_at?: string
          cv_breakdown?: Json
          cv_score?: number | null
          flag?: string | null
          global_score?: number | null
          id?: string
          interview_breakdown?: Json
          interview_score?: number | null
          scored_at?: string | null
          updated_at?: string
        }
        Update: {
          ai_concerns?: string[]
          ai_strengths?: string[]
          ai_summary?: string
          candidate_id?: string
          created_at?: string
          cv_breakdown?: Json
          cv_score?: number | null
          flag?: string | null
          global_score?: number | null
          id?: string
          interview_breakdown?: Json
          interview_score?: number | null
          scored_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          created_at: string
          cv_storage_path: string
          cv_text: string
          email: string
          first_name: string
          id: string
          last_name: string
          linkedin_url: string
          notes: string
          phone: string
          request_id: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cv_storage_path?: string
          cv_text?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string
          notes?: string
          phone?: string
          request_id: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cv_storage_path?: string
          cv_text?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string
          notes?: string
          phone?: string
          request_id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      interview_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      interview_requests: {
        Row: {
          confirmed_slot: Json | null
          created_at: string
          id: string
          mode: string
          onsite_address: string
          proposed_profile_id: string
          proposed_slots: Json
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          confirmed_slot?: Json | null
          created_at?: string
          id?: string
          mode: string
          onsite_address?: string
          proposed_profile_id: string
          proposed_slots?: Json
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          confirmed_slot?: Json | null
          created_at?: string
          id?: string
          mode?: string
          onsite_address?: string
          proposed_profile_id?: string
          proposed_slots?: Json
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_requests_proposed_profile_id_fkey"
            columns: ["proposed_profile_id"]
            isOneToOne: false
            referencedRelation: "proposed_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_requests_proposed_profile_id_fkey"
            columns: ["proposed_profile_id"]
            isOneToOne: false
            referencedRelation: "proposed_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_requests_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          candidate_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          started_at: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string
          company_name: string
          company_role: string
          country: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string
          postal_code: string
          street_address: string
          updated_at: string
          user_id: string
          vat_number: string
        }
        Insert: {
          city?: string
          company_name?: string
          company_role?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          postal_code?: string
          street_address?: string
          updated_at?: string
          user_id: string
          vat_number?: string
        }
        Update: {
          city?: string
          company_name?: string
          company_role?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          postal_code?: string
          street_address?: string
          updated_at?: string
          user_id?: string
          vat_number?: string
        }
        Relationships: []
      }
      proposed_profiles: {
        Row: {
          alias: string
          availability: string
          availability_regime: string
          bio: string
          created_at: string
          diploma: string
          email: string
          experience_years: number
          experiences: Json
          first_name: string
          full_name: string
          hard_skills_detail: Json
          headline: string
          id: string
          languages: Json
          last_initial: string
          linkedin_url: string
          location_area: string
          looking_for: Json
          phone: string
          rejection_other: string
          rejection_reasons: string[]
          request_id: string
          school: string
          skills: string[]
          soft_skills_detail: Json
          status: string
          study_field: string
          study_year: string
          summary: string
          updated_at: string
          validated_by_onbord: boolean
        }
        Insert: {
          alias?: string
          availability?: string
          availability_regime?: string
          bio?: string
          created_at?: string
          diploma?: string
          email?: string
          experience_years?: number
          experiences?: Json
          first_name?: string
          full_name?: string
          hard_skills_detail?: Json
          headline?: string
          id?: string
          languages?: Json
          last_initial?: string
          linkedin_url?: string
          location_area?: string
          looking_for?: Json
          phone?: string
          rejection_other?: string
          rejection_reasons?: string[]
          request_id: string
          school?: string
          skills?: string[]
          soft_skills_detail?: Json
          status?: string
          study_field?: string
          study_year?: string
          summary?: string
          updated_at?: string
          validated_by_onbord?: boolean
        }
        Update: {
          alias?: string
          availability?: string
          availability_regime?: string
          bio?: string
          created_at?: string
          diploma?: string
          email?: string
          experience_years?: number
          experiences?: Json
          first_name?: string
          full_name?: string
          hard_skills_detail?: Json
          headline?: string
          id?: string
          languages?: Json
          last_initial?: string
          linkedin_url?: string
          location_area?: string
          looking_for?: Json
          phone?: string
          rejection_other?: string
          rejection_reasons?: string[]
          request_id?: string
          school?: string
          skills?: string[]
          soft_skills_detail?: Json
          status?: string
          study_field?: string
          study_year?: string
          summary?: string
          updated_at?: string
          validated_by_onbord?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "proposed_profiles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_scoring_config: {
        Row: {
          created_at: string
          cv_criteria: Json
          cv_weight: number
          green_threshold: number
          id: string
          interview_max_turns: number
          interview_questions: Json
          interview_weight: number
          request_id: string
          updated_at: string
          use_ai_generated_questions: boolean
          yellow_threshold: number
        }
        Insert: {
          created_at?: string
          cv_criteria?: Json
          cv_weight?: number
          green_threshold?: number
          id?: string
          interview_max_turns?: number
          interview_questions?: Json
          interview_weight?: number
          request_id: string
          updated_at?: string
          use_ai_generated_questions?: boolean
          yellow_threshold?: number
        }
        Update: {
          created_at?: string
          cv_criteria?: Json
          cv_weight?: number
          green_threshold?: number
          id?: string
          interview_max_turns?: number
          interview_questions?: Json
          interview_weight?: number
          request_id?: string
          updated_at?: string
          use_ai_generated_questions?: boolean
          yellow_threshold?: number
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string
          custom_skills: string[] | null
          days_per_week: number
          description: string | null
          diploma: string | null
          domain: string
          employment_type: string | null
          id: string
          languages: Json | null
          natural_language_query: string | null
          nice_to_have_skills: string[] | null
          nice_to_have_soft_skills: string[] | null
          schedule_details: Json | null
          schedule_type: string
          skills: string[] | null
          soft_skills: string[] | null
          status: string
          talent_type: string
          talents_number: number
          title: string
          user_id: string
          work_location: string
          work_mode: string
        }
        Insert: {
          created_at?: string
          custom_skills?: string[] | null
          days_per_week?: number
          description?: string | null
          diploma?: string | null
          domain: string
          employment_type?: string | null
          id?: string
          languages?: Json | null
          natural_language_query?: string | null
          nice_to_have_skills?: string[] | null
          nice_to_have_soft_skills?: string[] | null
          schedule_details?: Json | null
          schedule_type?: string
          skills?: string[] | null
          soft_skills?: string[] | null
          status?: string
          talent_type?: string
          talents_number?: number
          title: string
          user_id: string
          work_location?: string
          work_mode?: string
        }
        Update: {
          created_at?: string
          custom_skills?: string[] | null
          days_per_week?: number
          description?: string | null
          diploma?: string | null
          domain?: string
          employment_type?: string | null
          id?: string
          languages?: Json | null
          natural_language_query?: string | null
          nice_to_have_skills?: string[] | null
          nice_to_have_soft_skills?: string[] | null
          schedule_details?: Json | null
          schedule_type?: string
          skills?: string[] | null
          soft_skills?: string[] | null
          status?: string
          talent_type?: string
          talents_number?: number
          title?: string
          user_id?: string
          work_location?: string
          work_mode?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      proposed_profiles_public: {
        Row: {
          alias: string | null
          availability: string | null
          availability_regime: string | null
          bio: string | null
          created_at: string | null
          diploma: string | null
          email: string | null
          experience_years: number | null
          experiences: Json | null
          first_name: string | null
          full_name: string | null
          hard_skills_detail: Json | null
          headline: string | null
          id: string | null
          languages: Json | null
          last_initial: string | null
          linkedin_url: string | null
          location_area: string | null
          looking_for: Json | null
          phone: string | null
          rejection_other: string | null
          rejection_reasons: string[] | null
          request_id: string | null
          school: string | null
          skills: string[] | null
          soft_skills_detail: Json | null
          status: string | null
          study_field: string | null
          study_year: string | null
          summary: string | null
          updated_at: string | null
          validated_by_onbord: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "proposed_profiles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
