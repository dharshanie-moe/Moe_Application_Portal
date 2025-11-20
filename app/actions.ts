"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { supabase, supabaseAdmin } from "@/lib/supabase"
import { rankApplication, rankApplicationsByRegion } from "@/lib/ai-service"
import { checkAdminCredentials, isAuthorizedAdmin } from "@/lib/db-setup"
import { z } from "zod"

// Define validation schema
const SubjectSchema = z.object({
  subject_name: z.string().min(1, "Subject name is required"),
  grade: z.string().min(1, "Grade is required"),
})

const ExperienceSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  duties: z.string().min(1, "Duties are required"),
})

const ApplicationSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits including country code")
    .refine((val) => val.startsWith("592"), {
      message: "Phone number must start with country code 592",
    })
    .refine((val) => /^592\d{7,}$/.test(val), {
      message: "Phone number must be in format 592XXXXXXX with at least 7 digits after 592",
    }),
  email: z.string().email("Valid email is required"),
  dob: z.string().min(1, "Date of birth is required"),
  region: z.string().min(1, "Region is required"),
  certification: z.string().optional().default(""),
  subjects: z.array(SubjectSchema).min(5, "At least 5 subjects are required"),
  experiences: z.array(ExperienceSchema).optional().default([]), // Made experiences optional
})

export type ApplicationFormData = z.infer<typeof ApplicationSchema>

export async function submitApplication(formData: ApplicationFormData) {
  try {
    // Check if Mathematics and English are included
    const hasMath = formData.subjects.some((s) => s.subject_name.toLowerCase() === "mathematics" && s.grade)

    const hasEnglish = formData.subjects.some(
      (s) =>
        (s.subject_name.toLowerCase() === "english a" ||
          s.subject_name.toLowerCase() === "english b" ||
          s.subject_name.toLowerCase() === "english") &&
        s.grade,
    )

    if (!hasMath || !hasEnglish) {
      return {
        success: false,
        error: "Mathematics and English are mandatory subjects",
        fieldErrors: [
          ...(!hasMath ? [{ path: "subjects", message: "Mathematics is required with a grade" }] : []),
          ...(!hasEnglish ? [{ path: "subjects", message: "English is required with a grade" }] : []),
        ],
      }
    }

    // Validate form data
    const validatedData = ApplicationSchema.parse(formData)

    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from("its_applications")
      .select("id")
      .eq("email", validatedData.email)
      .maybeSingle()

    if (emailCheckError) {
      console.error("Error checking existing email:", emailCheckError)
    }

    if (existingEmail) {
      return {
        success: false,
        error: "An application with this email already exists",
        fieldErrors: [{ path: "email", message: "This email address has already been used for an application" }],
      }
    }

    // Check if phone already exists
    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from("its_applications")
      .select("id")
      .eq("phone", validatedData.phone)
      .maybeSingle()

    if (phoneCheckError) {
      console.error("Error checking existing phone:", phoneCheckError)
    }

    if (existingPhone) {
      return {
        success: false,
        error: "An application with this phone number already exists",
        fieldErrors: [{ path: "phone", message: "This phone number has already been used for an application" }],
      }
    }

    // Check if the applicant already has an IT/EDPM subject in their CXC
    const itSubjects = validatedData.subjects.filter(
      (s) =>
        s.subject_name.toLowerCase().includes("information technology") ||
        s.subject_name.toLowerCase() === "it" ||
        s.subject_name.toLowerCase().includes("edpm") ||
        s.subject_name.toLowerCase().includes("electronic document"),
    )

    // Insert application
    const { data: application, error: applicationError } = await supabase
      .from("its_applications")
      .insert({
        name: validatedData.name,
        address: validatedData.address,
        phone: validatedData.phone,
        email: validatedData.email,
        dob: validatedData.dob,
        region: validatedData.region,
        certification: validatedData.certification,
      })
      .select()
      .single()

    if (applicationError || !application) {
      console.error("Error inserting application:", applicationError)
      return { success: false, error: "Failed to submit application" }
    }

    // Insert subjects
    const subjectsToInsert = validatedData.subjects.map((subject) => ({
      application_id: application.id,
      subject_name: subject.subject_name,
      grade: subject.grade,
    }))

    const { error: subjectsError } = await supabase.from("its_subjects").insert(subjectsToInsert)

    if (subjectsError) {
      console.error("Error inserting subjects:", subjectsError)
      return { success: false, error: "Failed to submit subjects" }
    }

    // Insert experiences (only if there are any)
    if (validatedData.experiences && validatedData.experiences.length > 0) {
      const experiencesToInsert = validatedData.experiences.map((exp) => ({
        application_id: application.id,
        company_name: exp.company_name,
        start_date: exp.start_date,
        end_date: exp.end_date || null,
        duties: exp.duties,
      }))

      const { error: experiencesError } = await supabase.from("its_experience").insert(experiencesToInsert)

      if (experiencesError) {
        console.error("Error inserting experiences:", experiencesError)
        return { success: false, error: "Failed to submit experiences" }
      }
    }

    // Get inserted subjects and experiences for AI ranking
    const { data: insertedSubjects } = await supabase
      .from("its_subjects")
      .select("*")
      .eq("application_id", application.id)

    const { data: insertedExperiences } = await supabase
      .from("its_experience")
      .select("*")
      .eq("application_id", application.id)

    // Calculate AI score
    const { score } = await rankApplication(application, insertedSubjects || [], insertedExperiences || [])

    // Update application with AI score (integer only)
    const { error: updateError } = await supabase
      .from("its_applications")
      .update({ ai_score: score })
      .eq("id", application.id)

    if (updateError) {
      console.error("Error updating AI score:", updateError)
    }

    revalidatePath("/admin/applications")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }))
      return {
        success: false,
        error: "Validation failed",
        fieldErrors,
      }
    }

    console.error("Error submitting application:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getApplications(region?: string) {
  try {
    let query = supabase.from("its_applications").select("*").order("created_at", { ascending: false })

    if (region) {
      query = query.eq("region", region)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching applications:", error)
      return { success: false, error: "Failed to fetch applications" }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching applications:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Update the rankApplicationsByRegion function to handle ties properly

export async function getApplicationsByRegion() {
  try {
    // Get all applications
    const { data: applications, error: applicationsError } = await supabase
      .from("its_applications")
      .select("*")
      .order("created_at", { ascending: false })

    if (applicationsError) {
      console.error("Error fetching applications:", applicationsError)
      return { success: false, error: "Failed to fetch applications" }
    }

    // Get all subjects
    const { data: allSubjects, error: subjectsError } = await supabase.from("its_subjects").select("*")

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError)
      return { success: false, error: "Failed to fetch subjects data" }
    }

    // Get all experiences
    const { data: allExperiences, error: experiencesError } = await supabase.from("its_experience").select("*")

    if (experiencesError) {
      console.error("Error fetching experiences:", experiencesError)
      return { success: false, error: "Failed to fetch experience data" }
    }

    // Organize subjects and experiences by application ID
    const subjectsByApplication: { [applicationId: string]: any[] } = {}
    const experiencesByApplication: { [applicationId: string]: any[] } = {}

    allSubjects?.forEach((subject) => {
      if (!subjectsByApplication[subject.application_id]) {
        subjectsByApplication[subject.application_id] = []
      }
      subjectsByApplication[subject.application_id].push(subject)
    })

    allExperiences?.forEach((experience) => {
      if (!experiencesByApplication[experience.application_id]) {
        experiencesByApplication[experience.application_id] = []
      }
      experiencesByApplication[experience.application_id].push(experience)
    })

    // Group and rank applications by region
    const regionGroups = await rankApplicationsByRegion(
      applications || [],
      subjectsByApplication,
      experiencesByApplication,
    )

    return { success: true, data: regionGroups }
  } catch (error) {
    console.error("Error ranking applications by region:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getApplicationDetails(id: string) {
  try {
    // Get application
    const { data: application, error: applicationError } = await supabase
      .from("its_applications")
      .select("*")
      .eq("id", id)
      .single()

    if (applicationError || !application) {
      console.error("Error fetching application:", applicationError)
      return { success: false, error: "Failed to fetch application details" }
    }

    // Get subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from("its_subjects")
      .select("*")
      .eq("application_id", id)

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError)
      return { success: false, error: "Failed to fetch subject details" }
    }

    // Get experiences
    const { data: experiences, error: experiencesError } = await supabase
      .from("its_experience")
      .select("*")
      .eq("application_id", id)

    if (experiencesError) {
      console.error("Error fetching experiences:", experiencesError)
      return { success: false, error: "Failed to fetch experience details" }
    }

    return {
      success: true,
      data: {
        application,
        subjects: subjects || [],
        experiences: experiences || [],
      },
    }
  } catch (error) {
    console.error("Error fetching application details:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Login admin with email and password
export async function loginAdmin(email: string, password: string) {
  try {
    // Check if the credentials are valid
    const isValid = await checkAdminCredentials(email, password)

    if (!isValid) {
      return { success: false, error: "Invalid credentials" }
    }

    // In a real application, you would set a session cookie or token here
    // For this demo, we'll just return success

    // Get admin details for the session
    const { data: admin } = await supabaseAdmin
      .from("its_admin")
      .select("id, email, name, role")
      .eq("email", email)
      .single()

    // Set a cookie to maintain the session
    cookies().set(
      "admin_session",
      JSON.stringify({
        id: admin?.id,
        email: admin?.email,
        name: admin?.name,
        role: admin?.role,
        loggedIn: true,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      },
    )

    return { success: true }
  } catch (error) {
    console.error("Error logging in:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Verify admin session
export async function verifyAdminSession() {
  try {
    const sessionCookie = cookies().get("admin_session")

    if (!sessionCookie) {
      return { success: false, error: "No active session" }
    }

    try {
      const session = JSON.parse(sessionCookie.value)

      // Check if session is expired
      if (session.expires < Date.now()) {
        cookies().delete("admin_session")
        return { success: false, error: "Session expired" }
      }

      // Check if the user's email is still in the admin table
      const isAdmin = await isAuthorizedAdmin(session.email || "")

      if (!isAdmin) {
        cookies().delete("admin_session")
        return { success: false, error: "Not authorized as admin" }
      }

      return {
        success: true,
        user: {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
        },
      }
    } catch (e) {
      cookies().delete("admin_session")
      return { success: false, error: "Invalid session" }
    }
  } catch (error) {
    console.error("Error verifying admin session:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Sign out admin
export async function signOutAdmin() {
  try {
    cookies().delete("admin_session")
    return { success: true, redirect: "/" }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
