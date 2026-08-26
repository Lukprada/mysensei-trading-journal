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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          initial_balance: number
          myfxbook_account_id: string | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          initial_balance?: number
          myfxbook_account_id?: string | null
          name: string
          type?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          initial_balance?: number
          myfxbook_account_id?: string | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          content: string
          cover_image_url: string | null
          created_at: string
          id: string
          published: boolean
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analysis_comments: {
        Row: {
          analysis_id: string
          author_name: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          analysis_id: string
          author_name: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          analysis_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_comments_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_reactions: {
        Row: {
          analysis_id: string
          created_at: string
          emoji: string
          id: string
          reactor_name: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          emoji: string
          id?: string
          reactor_name?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          emoji?: string
          id?: string
          reactor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_reactions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_views: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          viewer_ip: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          viewer_ip?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_views_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flows: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          external_id: string | null
          flow_type: string
          id: string
          note: string | null
          occurred_at: string
          source: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          external_id?: string | null
          flow_type: string
          id?: string
          note?: string | null
          occurred_at?: string
          source?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          external_id?: string | null
          flow_type?: string
          id?: string
          note?: string | null
          occurred_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          linked_trade_ids: string[] | null
          mood: string | null
          tags: string[] | null
          title: string
          tradingview_links: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          linked_trade_ids?: string[] | null
          mood?: string | null
          tags?: string[] | null
          title?: string
          tradingview_links?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          linked_trade_ids?: string[] | null
          mood?: string | null
          tags?: string[] | null
          title?: string
          tradingview_links?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      myfxbook_credentials: {
        Row: {
          created_at: string
          email: string
          id: string
          last_synced_at: string | null
          password: string
          session_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_synced_at?: string | null
          password: string
          session_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_synced_at?: string | null
          password?: string
          session_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          account_id: string
          ai_critique: string | null
          asset: string
          broker_comment: string | null
          commission: number | null
          created_at: string
          date: string
          direction: string
          entry_price: number
          exit_price: number
          exit_time: string | null
          external_id: string | null
          id: string
          journal_notes: string | null
          linked_group_id: string | null
          magic_number: string | null
          mental_state: string
          notes: string | null
          pips: number
          pnl: number
          position_size: number
          risk_amount: number | null
          rules_followed: boolean | null
          screenshot_url: string | null
          setup_tag: string | null
          source: string
          stop_loss: number | null
          swap: number | null
          take_profit: number | null
          tradingview_links: string[] | null
          user_id: string
        }
        Insert: {
          account_id: string
          ai_critique?: string | null
          asset: string
          broker_comment?: string | null
          commission?: number | null
          created_at?: string
          date?: string
          direction: string
          entry_price: number
          exit_price: number
          exit_time?: string | null
          external_id?: string | null
          id?: string
          journal_notes?: string | null
          linked_group_id?: string | null
          magic_number?: string | null
          mental_state?: string
          notes?: string | null
          pips?: number
          pnl?: number
          position_size?: number
          risk_amount?: number | null
          rules_followed?: boolean | null
          screenshot_url?: string | null
          setup_tag?: string | null
          source?: string
          stop_loss?: number | null
          swap?: number | null
          take_profit?: number | null
          tradingview_links?: string[] | null
          user_id: string
        }
        Update: {
          account_id?: string
          ai_critique?: string | null
          asset?: string
          broker_comment?: string | null
          commission?: number | null
          created_at?: string
          date?: string
          direction?: string
          entry_price?: number
          exit_price?: number
          exit_time?: string | null
          external_id?: string | null
          id?: string
          journal_notes?: string | null
          linked_group_id?: string | null
          magic_number?: string | null
          mental_state?: string
          notes?: string | null
          pips?: number
          pnl?: number
          position_size?: number
          risk_amount?: number | null
          rules_followed?: boolean | null
          screenshot_url?: string | null
          setup_tag?: string | null
          source?: string
          stop_loss?: number | null
          swap?: number | null
          take_profit?: number | null
          tradingview_links?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
