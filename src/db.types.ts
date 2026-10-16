
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "actor": string | null,"at": string,"id": number,"new": Json | null,"old": Json | null,"op": string,"tbl": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor"?: string | null,"at"?: string,"id"?: never,"new"?: Json | null,"old"?: Json | null,"op": string,"tbl": string
                  }
                  Update: {
                    "actor"?: string | null,"at"?: string,"id"?: never,"new"?: Json | null,"old"?: Json | null,"op"?: string,"tbl"?: string
                  }
                  Relationships: [
                    
                  ]
                },"confirmations": {
                  Row: {
                    "confirmed_at": string,"confirmed_by": string,"id": string,"period_end": string,"snapshot": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmed_at"?: string,"confirmed_by"?: string,"id"?: string,"period_end": string,"snapshot": NonNullable<Json>
                  }
                  Update: {
                    "confirmed_at"?: string,"confirmed_by"?: string,"id"?: string,"period_end"?: string,"snapshot"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"days": {
                  Row: {
                    "date": string,"leave": boolean,"note": string | null,"ot": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "date": string,"leave"?: boolean,"note"?: string | null,"ot"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "date"?: string,"leave"?: boolean,"note"?: string | null,"ot"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"holidays": {
                  Row: {
                    "date": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "date": string,"name": string
                  }
                  Update: {
                    "date"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string,"id": string,"note": string | null,"paid_on": string,"period_end": string,"receipts": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"id"?: string,"note"?: string | null,"paid_on": string,"period_end": string,"receipts"?: (string)[]
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"id"?: string,"note"?: string | null,"paid_on"?: string,"period_end"?: string,"receipts"?: (string)[]
                  }
                  Relationships: [
                    
                  ]
                },"people": {
                  Row: {
                    "created_at": string,"id": string,"role": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"role"?: string,"username": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"role"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"period_overrides": {
                  Row: {
                    "note": string | null,"period_end": string,"salary": number
                  }
                  ComputedFields: never
                  Insert: {
                    "note"?: string | null,"period_end": string,"salary": number
                  }
                  Update: {
                    "note"?: string | null,"period_end"?: string,"salary"?: number
                  }
                  Relationships: [
                    
                  ]
                },"rates": {
                  Row: {
                    "effective_from": string,"ot_rate": number,"salary": number
                  }
                  ComputedFields: never
                  Insert: {
                    "effective_from": string,"ot_rate": number,"salary": number
                  }
                  Update: {
                    "effective_from"?: string,"ot_rate"?: number,"salary"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "my_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"set_role":
{ Args: { "new_role": string,"target": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
