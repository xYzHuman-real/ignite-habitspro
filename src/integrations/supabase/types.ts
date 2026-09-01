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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accountability_partners: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          requester_id: string
          shared_streak: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          requester_id: string
          shared_streak?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          requester_id?: string
          shared_streak?: number
          status?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          activity_date: string
          activity_type: string
          count: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          count?: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          count?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points: number
          requirement_type: string
          requirement_value: number
          tier: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points?: number
          requirement_type: string
          requirement_value?: number
          tier?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          requirement_type?: string
          requirement_value?: number
          tier?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          badge_reward: string | null
          created_at: string
          description: string
          duration_days: number
          end_date: string | null
          icon: string
          id: string
          min_points_required: number
          name: string
          points_reward: number
          start_date: string | null
        }
        Insert: {
          badge_reward?: string | null
          created_at?: string
          description: string
          duration_days?: number
          end_date?: string | null
          icon?: string
          id?: string
          min_points_required?: number
          name: string
          points_reward?: number
          start_date?: string | null
        }
        Update: {
          badge_reward?: string | null
          created_at?: string
          description?: string
          duration_days?: number
          end_date?: string | null
          icon?: string
          id?: string
          min_points_required?: number
          name?: string
          points_reward?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_badge_reward_fkey"
            columns: ["badge_reward"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          member_count: number
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          member_count?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          member_count?: number
          name?: string
        }
        Relationships: []
      }
      community_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logins: {
        Row: {
          created_at: string
          id: string
          login_date: string
          points_earned: number
          streak: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          points_earned?: number
          streak?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          points_earned?: number
          streak?: number
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          type: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          type?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          type?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      focus_room_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "focus_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_room_participants: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "focus_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_rooms: {
        Row: {
          break_duration_minutes: number
          created_at: string
          creator_id: string
          id: string
          invite_code: string | null
          is_private: boolean
          name: string
          session_duration_minutes: number
          started_at: string | null
          status: string
        }
        Insert: {
          break_duration_minutes?: number
          created_at?: string
          creator_id: string
          id?: string
          invite_code?: string | null
          is_private?: boolean
          name: string
          session_duration_minutes?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          break_duration_minutes?: number
          created_at?: string
          creator_id?: string
          id?: string
          invite_code?: string | null
          is_private?: boolean
          name?: string
          session_duration_minutes?: number
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          goal_id: string
          id: string
          sort_order: number
          target_value: number
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_id: string
          id?: string
          sort_order?: number
          target_value?: number
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          sort_order?: number
          target_value?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          current_value: number
          deadline: string | null
          description: string | null
          id: string
          target_value: number
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          id?: string
          target_value?: number
          title: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          id?: string
          target_value?: number
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          completed_today: boolean
          created_at: string
          current: number
          difficulty: string
          icon: string
          id: string
          longest_streak: number
          name: string
          priority: string
          reminder_days: string[]
          reminder_enabled: boolean
          reminder_time: string | null
          sort_order: number
          streak: number
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_today?: boolean
          created_at?: string
          current?: number
          difficulty?: string
          icon?: string
          id?: string
          longest_streak?: number
          name: string
          priority?: string
          reminder_days?: string[]
          reminder_enabled?: boolean
          reminder_time?: string | null
          sort_order?: number
          streak?: number
          target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_today?: boolean
          created_at?: string
          current?: number
          difficulty?: string
          icon?: string
          id?: string
          longest_streak?: number
          name?: string
          priority?: string
          reminder_days?: string[]
          reminder_enabled?: boolean
          reminder_time?: string | null
          sort_order?: number
          streak?: number
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          entry_date: string
          gratitude: string | null
          habit_id: string | null
          id: string
          improvements: string | null
          mood: string
          reflection: string
          updated_at: string
          user_id: string
          wins: string | null
        }
        Insert: {
          created_at?: string
          entry_date?: string
          gratitude?: string | null
          habit_id?: string | null
          id?: string
          improvements?: string | null
          mood?: string
          reflection?: string
          updated_at?: string
          user_id: string
          wins?: string | null
        }
        Update: {
          created_at?: string
          entry_date?: string
          gratitude?: string | null
          habit_id?: string | null
          id?: string
          improvements?: string | null
          mood?: string
          reflection?: string
          updated_at?: string
          user_id?: string
          wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          icon: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          icon?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          icon?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_minutes: number
          id: string
          linked_subject: string | null
          linked_task: string | null
          session_type: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_minutes: number
          id?: string
          linked_subject?: string | null
          linked_task?: string | null
          session_type?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          id?: string
          linked_subject?: string | null
          linked_task?: string | null
          session_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coins: number
          created_at: string
          display_name: string
          habits_completed: number
          id: string
          leaderboard_points: number
          lifetime_xp: number
          pomodoro_sessions_count: number
          premium_until: string | null
          referral_code: string | null
          referred_by_code: string | null
          show_avatar: boolean
          show_profile: boolean
          show_stats: boolean
          streak_freezes: number
          subscription_plan: string | null
          subscription_tier: string
          title: string
          total_streak: number
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          username: string | null
          xp_level: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          habits_completed?: number
          id?: string
          leaderboard_points?: number
          lifetime_xp?: number
          pomodoro_sessions_count?: number
          premium_until?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          show_avatar?: boolean
          show_profile?: boolean
          show_stats?: boolean
          streak_freezes?: number
          subscription_plan?: string | null
          subscription_tier?: string
          title?: string
          total_streak?: number
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          xp_level?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          habits_completed?: number
          id?: string
          leaderboard_points?: number
          lifetime_xp?: number
          pomodoro_sessions_count?: number
          premium_until?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          show_avatar?: boolean
          show_profile?: boolean
          show_stats?: boolean
          streak_freezes?: number
          subscription_plan?: string | null
          subscription_tier?: string
          title?: string
          total_streak?: number
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          xp_level?: number
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          item_type: string
          item_value: string
          name: string
          price: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          item_type?: string
          item_value?: string
          name: string
          price?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          item_type?: string
          item_value?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      shop_purchases: {
        Row: {
          id: string
          item_id: string
          price_paid: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          price_paid: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          price_paid?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount_inr: number
          created_at: string
          failure_reason: string | null
          id: string
          plan: string
          provider: string
          receipt_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount_inr?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          plan: string
          provider?: string
          receipt_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          plan?: string
          provider?: string
          receipt_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          sort_order: number
          text: string
          todo_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          text: string
          todo_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          text?: string
          todo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          attachments: Json | null
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          priority: string
          recurring: string | null
          sort_order: number | null
          tags: string[] | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          recurring?: string | null
          sort_order?: number | null
          tags?: string[] | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          recurring?: string | null
          sort_order?: number | null
          tags?: string[] | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          id: string
          joined_at: string
          last_checkin_date: string | null
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          last_checkin_date?: string | null
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          joined_at?: string
          last_checkin_date?: string | null
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_referral: { Args: { code: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_shared_streak: {
        Args: { user_a: string; user_b: string }
        Returns: number
      }
      suggest_usernames: { Args: { base: string }; Returns: string[] }
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
