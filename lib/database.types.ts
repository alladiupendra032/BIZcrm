export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: 'Admin' | 'Manager' | 'Team Member'
          organization_id: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          role?: 'Admin' | 'Manager' | 'Team Member'
          organization_id?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          role?: 'Admin' | 'Manager' | 'Team Member'
          organization_id?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          notes: string | null
          status: 'Lead' | 'Active' | 'Closed'
          archived: boolean
          organization_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          status?: 'Lead' | 'Active' | 'Closed'
          archived?: boolean
          organization_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          status?: 'Lead' | 'Active' | 'Closed'
          archived?: boolean
          organization_id?: string | null
          created_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          customer_id: string | null
          title: string
          value: number | null
          stage: 'New' | 'Contacted' | 'Negotiation' | 'Won' | 'Lost'
          expected_close_date: string | null
          assigned_to: string | null
          organization_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          title: string
          value?: number | null
          stage?: 'New' | 'Contacted' | 'Negotiation' | 'Won' | 'Lost'
          expected_close_date?: string | null
          assigned_to?: string | null
          organization_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          title?: string
          value?: number | null
          stage?: 'New' | 'Contacted' | 'Negotiation' | 'Won' | 'Lost'
          expected_close_date?: string | null
          assigned_to?: string | null
          organization_id?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          assigned_to: string | null
          related_customer: string | null
          related_deal: string | null
          status: 'Pending' | 'In Progress' | 'Completed'
          due_date: string | null
          organization_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assigned_to?: string | null
          related_customer?: string | null
          related_deal?: string | null
          status?: 'Pending' | 'In Progress' | 'Completed'
          due_date?: string | null
          organization_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assigned_to?: string | null
          related_customer?: string | null
          related_deal?: string | null
          status?: 'Pending' | 'In Progress' | 'Completed'
          due_date?: string | null
          organization_id?: string | null
          created_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          organization_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          organization_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          organization_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
