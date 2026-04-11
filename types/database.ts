export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          full_name: string;
          employee_code: string;
          password_hash: string;
          dni_hash: string | null;
          role: "admin" | "employee";
          hourly_rate: number | null;
          monthly_salary: number | null;
          password_change_required: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          employee_code: string;
          password_hash: string;
          dni_hash?: string | null;
          role: "admin" | "employee";
          hourly_rate?: number | null;
          monthly_salary?: number | null;
          password_change_required?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
        Relationships: [];
      };
      work_reports: {
        Row: {
          id: string;
          employee_id: string;
          work_date: string;
          check_in_at: string;
          check_out_at: string | null;
          check_in_lat: number;
          check_in_lng: number;
          check_in_accuracy: number;
          check_out_lat: number | null;
          check_out_lng: number | null;
          check_out_accuracy: number | null;
          task_text: string | null;
          null_report: boolean;
          total_minutes: number | null;
          status: "open" | "closed" | "nullified";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          work_date: string;
          check_in_at: string;
          check_out_at?: string | null;
          check_in_lat: number;
          check_in_lng: number;
          check_in_accuracy: number;
          check_out_lat?: number | null;
          check_out_lng?: number | null;
          check_out_accuracy?: number | null;
          task_text?: string | null;
          null_report?: boolean;
          total_minutes?: number | null;
          status?: "open" | "closed" | "nullified";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["work_reports"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "work_reports_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          }
        ];
      };
      report_mail_logs: {
        Row: {
          id: string;
          from_date: string;
          to_date: string;
          recipient_email: string;
          subject: string;
          sent_at: string;
          sent_by: string | null;
        };
        Insert: {
          id?: string;
          from_date: string;
          to_date: string;
          recipient_email: string;
          subject: string;
          sent_at?: string;
          sent_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["report_mail_logs"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "report_mail_logs_sent_by_fkey";
            columns: ["sent_by"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      employee_role: "admin" | "employee";
      work_report_status: "open" | "closed" | "nullified";
    };
    CompositeTypes: Record<string, never>;
  };
};
