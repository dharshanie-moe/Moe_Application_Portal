import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
