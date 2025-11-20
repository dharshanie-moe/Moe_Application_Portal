"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Briefcase, Calendar, GraduationCap, Mail, MapPin, Phone, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Application, Subject, Experience } from "@/lib/supabase"
import { getApplicationDetails } from "@/app/actions"

interface ApplicationDetailProps {
  applicationId: string
}

const calculateTotalExperience = (experiences: Experience[]) => {
  if (!experiences || experiences.length === 0) return "None"

  let totalMonths = 0
  experiences.forEach((exp) => {
    const startDate = new Date(exp.start_date)
    const endDate = exp.end_date ? new Date(exp.end_date) : new Date()
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
    totalMonths += Math.max(0, months)
  })

  const years = Math.floor(totalMonths / 12)
  const remainingMonths = totalMonths % 12

  if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? "s" : ""}, ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`
  } else if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`
  } else {
    return `${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`
  }
}

export default function AdminApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const [application, setApplication] = useState<Application | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getApplicationDetails(applicationId)

        if (result.success && result.data) {
          setApplication(result.data.application)
          setSubjects(result.data.subjects)
          setExperiences(result.data.experiences)
        } else {
          setError(result.error || "Failed to fetch application details")
        }
      } catch (err) {
        setError("An unexpected error occurred")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplicationDetails()
  }, [applicationId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Present"
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card className="shadow-md border-0">
        <CardContent className="py-12 text-center bg-white">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !application) {
    return (
      <Card className="shadow-md border-0">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Application not found"}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/admin/applications">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Applications
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="bg-white rounded-t-lg border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-black">{application.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {application.region}
            </CardDescription>
          </div>
          <div>
            {application.ai_score !== null && (
              <div className="text-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">AI Suitability Score</div>
                <Badge
                  className={`text-lg px-3 py-1 ${
                    application.ai_score >= 70
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : application.ai_score >= 50
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {Math.floor(application.ai_score)}
                </Badge>
              </div>
            )}
            <div className="mt-4 text-sm text-gray-500">
              <p>Tiebreaker factors:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>
                  CXC Subjects with grades 1-3: {subjects.filter((s) => ["1", "2", "3"].includes(s.grade)).length}
                </li>
                <li>
                  IT/EDPM with grade 1:{" "}
                  {subjects.some(
                    (s) =>
                      (s.subject_name.toLowerCase().includes("information technology") ||
                        s.subject_name.toLowerCase() === "it" ||
                        s.subject_name.toLowerCase().includes("edpm") ||
                        s.subject_name.toLowerCase().includes("electronic document")) &&
                      s.grade === "1",
                  )
                    ? "Yes"
                    : "No"}
                </li>
                <li>Total work experience: {calculateTotalExperience(experiences)}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8 bg-white border-t border-b border-gray-200">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-black">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-black">
            <User className="h-5 w-5 text-green-600" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-black">{application.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-black">{application.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-black">{formatDate(application.dob)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Region</p>
                <p className="font-medium text-black">{application.region}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-black">{application.address}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-black">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-black">
            <GraduationCap className="h-5 w-5 text-green-600" /> IT Qualification
          </h3>
          <div className="flex flex-wrap gap-2">
            {application.certification
              .split(",")
              .filter(Boolean)
              .map((cert, index) => (
                <span key={index} className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-1 rounded">
                  {cert}
                </span>
              ))}
            {!application.certification && <p className="text-gray-500">No certifications provided</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-black">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-black">
            <GraduationCap className="h-5 w-5 text-green-600" /> CXC Subjects
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const isITSubject =
                subject.subject_name.toLowerCase().includes("information technology") ||
                subject.subject_name.toLowerCase() === "it" ||
                subject.subject_name.toLowerCase().includes("edpm") ||
                subject.subject_name.toLowerCase().includes("electronic document")

              return (
                <div
                  key={subject.id}
                  className={`border rounded-md p-4 text-black ${
                    isITSubject ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p className="font-medium text-black">{subject.subject_name}</p>
                  <p className="text-sm mt-1 text-black">
                    Grade: <span className="font-semibold">{subject.grade}</span>
                    {isITSubject && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        IT Subject
                      </span>
                    )}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-black">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-black">
            <Briefcase className="h-5 w-5 text-green-600" /> Work Experience
          </h3>
          <div className="space-y-4">
            {experiences && experiences.length > 0 ? (
              experiences.map((experience) => (
                <div key={experience.id} className="border border-gray-200 rounded-md p-4 bg-gray-50 text-black">
                  <h4 className="font-medium text-lg text-black">{experience.company_name}</h4>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" /> {formatDate(experience.start_date)} -{" "}
                    {formatDate(experience.end_date)}
                  </p>
                  <Separator className="my-3 bg-gray-200" />
                  <p className="mt-2 text-black">{experience.duties}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-gray-500">No work experience provided</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-200 p-4">
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/admin/applications">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Applications
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
