import { supabaseAdmin } from "./supabase"

export async function setupDatabase() {
  // Create applications table
  const { error: applicationsError } = await supabaseAdmin.rpc("create_table_if_not_exists", {
    table_name: "its_applications",
    columns: `
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      address text not null,
      phone text not null,
      email text not null,
      dob date not null,
      region text not null,
      certification text not null,
      ai_score numeric,
      created_at timestamp with time zone default now()
    `,
  })

  if (applicationsError) {
    console.error("Error creating applications table:", applicationsError)
  }

  // Create subjects table
  const { error: subjectsError } = await supabaseAdmin.rpc("create_table_if_not_exists", {
    table_name: "its_subjects",
    columns: `
      id uuid primary key default uuid_generate_v4(),
      application_id uuid references its_applications(id) on delete cascade,
      subject_name text not null,
      grade text not null
    `,
  })

  if (subjectsError) {
    console.error("Error creating subjects table:", subjectsError)
  }

  // Create experience table
  const { error: experienceError } = await supabaseAdmin.rpc("create_table_if_not_exists", {
    table_name: "its_experience",
    columns: `
      id uuid primary key default uuid_generate_v4(),
      application_id uuid references its_applications(id) on delete cascade,
      company_name text not null,
      start_date date not null,
      end_date date,
      duties text not null
    `,
  })

  if (experienceError) {
    console.error("Error creating experience table:", experienceError)
  }

  // Create admin table
  const { error: adminError } = await supabaseAdmin.rpc("create_table_if_not_exists", {
    table_name: "its_admin",
    columns: `
      id uuid primary key default uuid_generate_v4(),
      email text not null unique,
      password text not null,
      name text,
      role text default 'admin',
      created_at timestamp with time zone default now()
    `,
  })

  if (adminError) {
    console.error("Error creating admin table:", adminError)
  }

  // Check if default admin exists
  const { data: existingAdmin, error: checkError } = await supabaseAdmin
    .from("its_admin")
    .select("id")
    .eq("email", "admin@moe.gov.gy")
    .maybeSingle()

  if (checkError) {
    console.error("Error checking for default admin:", checkError)
  }

  // Insert default admin if not exists
  if (!existingAdmin) {
    // Default password is 'password' - in a real app, this would be hashed
    const { error: insertError } = await supabaseAdmin.from("its_admin").insert({
      email: "admin@moe.gov.gy",
      password: "password", // In production, use a hashed password
      name: "System Administrator",
      role: "admin",
    })

    if (insertError) {
      console.error("Error inserting default admin:", insertError)
    }
  }

  return {
    success: !applicationsError && !subjectsError && !experienceError && !adminError,
  }
}

// Function to check admin credentials
export async function checkAdminCredentials(email: string, password: string): Promise<boolean> {
  if (!email || !password) return false

  const { data, error } = await supabaseAdmin
    .from("its_admin")
    .select("id, password")
    .eq("email", email.toLowerCase())
    .single()

  if (error || !data) {
    console.error("Error checking admin credentials:", error)
    return false
  }

  // In a real application, you would use a proper password hashing library
  // and compare the hashed password instead of storing plaintext passwords
  return data.password === password
}

// Function to check if an email is authorized as admin
export async function isAuthorizedAdmin(email: string): Promise<boolean> {
  if (!email) return false

  const { data, error } = await supabaseAdmin.from("its_admin").select("id").eq("email", email.toLowerCase()).single()

  if (error || !data) {
    console.error("Error checking admin authorization:", error)
    return false
  }

  return true
}
