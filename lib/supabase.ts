import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = "https://qetjvxqiygghrhochoke.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldGp2eHFpeWdnaHJob2Nob2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTk1NjYsImV4cCI6MjA1NzczNTU2Nn0.tMYBTbZMfDbNalVJYzkE3N8IIKF1-z9vrgcHV4KZt9c"
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldGp2eHFpeWdnaHJob2Nob2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjE1OTU2NiwiZXhwIjoyMDU3NzM1NTY2fQ.25JkL-IChWZ5by4TUMEBjKy_m-YN22NgBVhw70vTeIw"

// Create a Supabase client with the anon key
export const supabase =
  typeof window !== "undefined"
    ? createClientComponentClient({ supabaseUrl, supabaseKey: supabaseAnonKey })
    : createClient(supabaseUrl, supabaseAnonKey)

// Create a Supabase admin client with the service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database types
export type Application = {
  id: string
  name: string
  address: string
  phone: string
  email: string
  dob: string
  region: string
  certification: string
  ai_score: number | null
  created_at: string
}

export type Subject = {
  id: string
  application_id: string
  subject_name: string
  grade: string
}

export type Experience = {
  id: string
  application_id: string
  company_name: string
  start_date: string
  end_date: string
  duties: string
}

export type Admin = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
}

export const regions = [
  "Georgetown",
  "Region 1",
  "Region 2",
  "Region 3",
  "Region 4",
  "Region 5",
  "Region 6",
  "Region 7",
  "Region 8",
  "Region 9",
  "Region 10",
]

export const grades = ["1", "2", "3"]

export const commonSubjects = [
  "Mathematics",
  "English A",
  "English B",
  "Information Technology",
  "Principles of Business",
  "Principles of Accounts",
  "Social Studies",
  "Integrated Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Geography",
  "History",
  "Spanish",
  "French",
  "EDPM",
  "Office Administration",
]
