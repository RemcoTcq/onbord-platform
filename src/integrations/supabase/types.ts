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
      interview_requests: {
        Row: {
          confirmed_slot: Json | null
          created_at: string
          id: string
          mode: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
