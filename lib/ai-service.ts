import type { Application, Subject, Experience } from "./supabase"

// Group applications by region and rank them
export async function rankApplicationsByRegion(
  applications: Application[],
  allSubjects: { [applicationId: string]: Subject[] },
  allExperiences: { [applicationId: string]: Experience[] },
): Promise<{ [region: string]: Application[] }> {
  // Group applications by region
  const regionGroups: { [region: string]: Application[] } = {}

  // Get all regions with applications
  for (const app of applications) {
    if (!regionGroups[app.region]) {
      regionGroups[app.region] = []
    }
    regionGroups[app.region].push(app)
  }

  // Rank applications within each region
  for (const region in regionGroups) {
    const regionApps = regionGroups[region]

    // Process each application in the region to get AI scores and tiebreakers
    for (const app of regionApps) {
      if (app.ai_score === null) {
        const { score, tiebreaker } = await rankApplication(
          app,
          allSubjects[app.id] || [],
          allExperiences[app.id] || [],
        )
        app.ai_score = score
        // Store tiebreaker as a temporary property for sorting
        app._tiebreaker = tiebreaker
      } else {
        // If score already exists, calculate tiebreaker for sorting
        app._tiebreaker = calculateTiebreaker(allSubjects[app.id] || [], allExperiences[app.id] || [])
      }
    }

    // Sort by AI score (highest to lowest) and then by tiebreaker if scores are equal
    regionGroups[region] = regionGroups[region].sort((a, b) => {
      const scoreDiff = (b.ai_score || 0) - (a.ai_score || 0)
      if (scoreDiff !== 0) return scoreDiff
      return (b._tiebreaker || 0) - (a._tiebreaker || 0)
    })
  }

  return regionGroups
}

// Calculate tiebreaker value separately
function calculateTiebreaker(subjects: Subject[], experiences: Experience[]): number {
  // Tiebreaker 1: Number of subjects with good grades (1-3)
  const goodGradeSubjects = subjects.filter((s) => ["1", "2", "3"].includes(s.grade)).length

  // Tiebreaker 2: Total months of work experience
  let totalExperienceMonths = 0
  if (experiences && experiences.length > 0) {
    experiences.forEach((exp) => {
      const startDate = new Date(exp.start_date)
      const endDate = exp.end_date ? new Date(exp.end_date) : new Date()
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
      totalExperienceMonths += Math.max(0, months)
    })
  }

  // Return a normalized tiebreaker value
  return goodGradeSubjects * 100 + totalExperienceMonths
}

// Use a scoring algorithm to rank a single application
export async function rankApplication(
  application: Application,
  subjects: Subject[],
  experiences: Experience[],
): Promise<{ score: number; tiebreaker: number }> {
  try {
    // For now, we'll use a calculated score since we can't directly use Gemini in this environment
    // In a production environment, you would make an API call to Gemini here
    return calculateScore(application, subjects, experiences)
  } catch (error) {
    console.error("Error ranking application:", error)
    // Fallback to calculated score if API fails
    return calculateScore(application, subjects, experiences)
  }
}

// Update the calculateScore function to return integer score and separate tiebreaker
function calculateScore(
  application: Application,
  subjects: Subject[],
  experiences: Experience[],
): { score: number; tiebreaker: number } {
  let score = 0
  const maxScore = 100

  // Extract IT/EDPM subjects from CXC
  const itSubjects = subjects.filter(
    (s) =>
      s.subject_name.toLowerCase().includes("information technology") ||
      s.subject_name.toLowerCase() === "it" ||
      s.subject_name.toLowerCase().includes("edpm") ||
      s.subject_name.toLowerCase().includes("electronic document"),
  )

  // Check for Math and English subjects
  const hasMath = subjects.some(
    (s) => s.subject_name.toLowerCase().includes("math") && ["1", "2", "3"].includes(s.grade),
  )

  const hasEnglish = subjects.some(
    (s) => s.subject_name.toLowerCase().includes("english") && ["1", "2", "3"].includes(s.grade),
  )

  // Base score for having the required subjects
  if (hasMath && hasEnglish) {
    score += 30
  } else if (hasMath || hasEnglish) {
    score += 15
  }

  // Score for IT/EDPM subjects - prioritize grade 1
  if (itSubjects.length > 0) {
    // Find the best grade among IT subjects (1 is best, 3 is lowest)
    const bestGrade = Math.min(...itSubjects.map((s) => Number.parseInt(s.grade)))

    // Assign score based on the best grade - give higher score for grade 1
    if (bestGrade === 1)
      score += 30 // Increased from 25 to prioritize grade 1
    else if (bestGrade === 2) score += 20
    else if (bestGrade === 3) score += 15
  }

  // Score for other IT certifications
  if (application.certification) {
    const certification = application.certification.toLowerCase()
    const certKeywords = [
      "comptia",
      "a+",
      "network+",
      "security+",
      "azure",
      "aws",
      "cloud",
      "microsoft",
      "cisco",
      "ccna",
      "itil",
      "dynamics",
    ]

    for (const keyword of certKeywords) {
      if (certification.includes(keyword)) {
        score += 20
        break
      }
    }
  }

  // Score for relevant work experience
  const relevantExperienceKeywords = [
    "it",
    "support",
    "computer",
    "technical",
    "helpdesk",
    "troubleshoot",
    "software",
    "hardware",
    "network",
    "install",
    "maintain",
    "equipment",
    "printer",
    "device",
    "workstation",
    "training",
    "user support",
  ]

  let experienceScore = 0
  if (experiences && experiences.length > 0) {
    experiences.forEach((exp) => {
      const duties = exp.duties.toLowerCase()
      relevantExperienceKeywords.forEach((keyword) => {
        if (duties.includes(keyword)) {
          experienceScore += 3
        }
      })
    })
  }

  // Cap experience score at 25
  score += Math.min(experienceScore, 25)

  // Ensure score doesn't exceed max and is an integer
  score = Math.min(Math.floor(score), maxScore)

  // Calculate tiebreaker separately
  const tiebreaker = calculateTiebreaker(subjects, experiences)

  return { score, tiebreaker }
}

// Helper to format dates
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  })
}
