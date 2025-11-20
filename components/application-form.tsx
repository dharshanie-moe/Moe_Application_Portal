"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash, Phone, Info, Award } from "lucide-react"
import { regions, grades, commonSubjects } from "@/lib/supabase"
import { submitApplication, type ApplicationFormData } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { SuccessPopup } from "@/components/ui/success-popup"

// Define higher education qualifications that should be highlighted
const highValueQualifications = [
  "associates degree in computer science",
  "associate degree in computer science",
  "associates degree in information technology",
  "associate degree in information technology",
  "bachelors degree in computer science",
  "bachelor degree in computer science",
  "bachelor's degree in computer science",
  "bachelors degree in information technology",
  "bachelor degree in information technology",
  "bachelor's degree in information technology",
  "diploma in computer science",
  "diploma in information technology",
  "bsc in computer science",
  "bsc in information technology",
  "bs in computer science",
  "bs in information technology",
]

// Function to check if a certification is a high-value qualification
const isHighValueQualification = (cert: string): boolean => {
  return highValueQualifications.some(
    (q) => cert.toLowerCase().includes(q) || cert.toLowerCase().replace(/\s+/g, "").includes(q.replace(/\s+/g, "")),
  )
}

export default function ApplicationForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ path: string; message: string }[]>([])

  const [formData, setFormData] = useState<ApplicationFormData & { certificationInput?: string }>({
    name: "",
    address: "",
    phone: "",
    email: "",
    dob: "",
    region: "",
    certification: "",
    certificationInput: "",
    subjects: [
      { subject_name: "Mathematics", grade: "" },
      { subject_name: "English A", grade: "" },
      { subject_name: "", grade: "" },
      { subject_name: "", grade: "" },
      { subject_name: "", grade: "" },
    ],
    experiences: [],
  })

  const getFieldError = (path: string) => {
    return fieldErrors.find((err) => err.path === path)?.message
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Special handling for phone number to ensure it has the 592 prefix
    if (name === "phone") {
      let formattedPhone = value.replace(/\D/g, "") // Remove non-digits

      // If the user is trying to enter a number without the country code
      if (!formattedPhone.startsWith("592")) {
        // If they're entering a fresh number (not editing)
        if (formattedPhone.length > 0 && formData.phone === "592") {
          formattedPhone = "592" + formattedPhone
        }
        // If they've deleted the country code, add it back
        else if (!formattedPhone.startsWith("592")) {
          formattedPhone = "592" + formattedPhone.substring(Math.min(formattedPhone.length, 3))
        }
      }

      setFormData((prev) => ({ ...prev, [name]: formattedPhone }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handlePhoneInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const selectionStart = input.selectionStart
    const value = input.value

    // If user is trying to edit or delete the country code
    if (selectionStart !== null && selectionStart <= 3) {
      // Prevent deletion by resetting selection position
      if (!value.startsWith("592")) {
        input.value = "592" + value.substring(3)
        setTimeout(() => input.setSelectionRange(3, 3), 0)
      } else {
        input.setSelectionRange(3, 3)
      }
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubjectChange = (index: number, field: "subject_name" | "grade", value: string) => {
    setFormData((prev) => {
      const updatedSubjects = [...prev.subjects]
      updatedSubjects[index] = { ...updatedSubjects[index], [field]: value }
      return { ...prev, subjects: updatedSubjects }
    })
  }

  const handleExperienceChange = (index: number, field: keyof (typeof formData.experiences)[0], value: string) => {
    setFormData((prev) => {
      const updatedExperiences = [...prev.experiences]
      updatedExperiences[index] = { ...updatedExperiences[index], [field]: value }
      return { ...prev, experiences: updatedExperiences }
    })
  }

  // Initialize phone with 592 prefix
  useEffect(() => {
    if (!formData.phone) {
      setFormData((prev) => ({ ...prev, phone: "592" }))
    }
  }, [])

  const addSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { subject_name: "", grade: "" }],
    }))
  }

  const removeSubject = (index: number) => {
    // Don't allow removing Mathematics or English (first two subjects)
    if (index === 0 || index === 1) {
      setError("Mathematics and English are mandatory subjects and cannot be removed")
      return
    }

    if (formData.subjects.length <= 5) {
      setError("At least 5 subjects are required")
      return
    }

    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }))
  }

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, { company_name: "", start_date: "", end_date: "", duties: "" }],
    }))
  }

  const removeExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "592",
      email: "",
      dob: "",
      region: "",
      certification: "",
      certificationInput: "",
      subjects: [
        { subject_name: "Mathematics", grade: "" },
        { subject_name: "English A", grade: "" },
        { subject_name: "", grade: "" },
        { subject_name: "", grade: "" },
        { subject_name: "", grade: "" },
      ],
      experiences: [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors([])

    try {
      const result = await submitApplication(formData)

      if (result.success) {
        // Show success popup
        setShowSuccessPopup(true)

        // Also show toast notification
        toast({
          title: "Application Successfully Submitted!",
          description: "We will review your application and contact you if you are selected for the next stage.",
          duration: 6000,
          variant: "success", // Use success variant for green styling
        })

        // Reset form
        resetForm()
      } else {
        setError(result.error || "Failed to submit application")
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)

          // Scroll to the first field with an error
          if (result.fieldErrors.length > 0) {
            const firstErrorField = document.getElementById(result.fieldErrors[0].path)
            if (firstErrorField) {
              firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" })
              firstErrorField.focus()
            }
          }
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false)
    // Call the onSuccess callback if provided
    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <>
      <SuccessPopup
        open={showSuccessPopup}
        onClose={handleCloseSuccessPopup}
        title="Application Successfully Submitted!"
        description="We will review your application and contact you if you are selected for the next stage."
      />

      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white rounded-t-lg border-b border-gray-200">
            <CardTitle className="text-black">Application Form</CardTitle>
            <CardDescription>
              Fill out the form below to apply for the Regional IT Support Officer part-time position.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 bg-white text-black border-t border-b border-gray-200">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    aria-invalid={!!getFieldError("name")}
                    aria-describedby={getFieldError("name") ? "name-error" : undefined}
                    className="bg-white border-gray-200"
                  />
                  {getFieldError("name") && (
                    <p id="name-error" className="text-sm text-red-500">
                      {getFieldError("name")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    aria-invalid={!!getFieldError("email")}
                    aria-describedby={getFieldError("email") ? "email-error" : undefined}
                    className="bg-white border-gray-200"
                  />
                  {getFieldError("email") && (
                    <div id="email-error" className="flex items-start gap-2 mt-1">
                      <Info className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-500">{getFieldError("email")}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onSelect={handlePhoneInput}
                      onClick={(e) => {
                        // Place cursor after prefix when clicking on input
                        const input = e.currentTarget
                        if (input.selectionStart !== null && input.selectionStart < 3) {
                          setTimeout(() => input.setSelectionRange(3, 3), 0)
                        }
                      }}
                      className="pl-10 bg-white border-gray-200"
                      placeholder="592XXXXXXX"
                      aria-invalid={!!getFieldError("phone")}
                      aria-describedby={getFieldError("phone") ? "phone-error" : undefined}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Country code (592) is automatically added and cannot be removed
                  </p>
                  {getFieldError("phone") && (
                    <div id="phone-error" className="flex items-start gap-2 mt-1">
                      <Info className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-500">{getFieldError("phone")}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    aria-invalid={!!getFieldError("dob")}
                    aria-describedby={getFieldError("dob") ? "dob-error" : undefined}
                    className="bg-white border-gray-200"
                  />
                  {getFieldError("dob") && (
                    <p id="dob-error" className="text-sm text-red-500">
                      {getFieldError("dob")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                  rows={3}
                  aria-invalid={!!getFieldError("address")}
                  aria-describedby={getFieldError("address") ? "address-error" : undefined}
                  className="bg-white border-gray-200"
                />
                {getFieldError("address") && (
                  <p id="address-error" className="text-sm text-red-500">
                    {getFieldError("address")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">
                  Region of Interest <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.region} onValueChange={(value) => handleSelectChange("region", value)}>
                  <SelectTrigger
                    id="region"
                    aria-invalid={!!getFieldError("region")}
                    aria-describedby={getFieldError("region") ? "region-error" : undefined}
                    className="bg-white border-gray-200 text-black"
                  >
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-black">
                    {regions.map((region) => (
                      <SelectItem key={region} value={region} className="hover:text-gray-600">
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldError("region") && (
                  <p id="region-error" className="text-sm text-red-500">
                    {getFieldError("region")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">CXC Subjects (Minimum 5)</h3>
              <p className="text-sm text-gray-500">Please list at least 5 CXC subjects and their grades.</p>

              {formData.subjects.map((subject, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border border-gray-200 p-4 rounded-md"
                >
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor={`subject-${index}`}>
                      Subject <span className="text-red-500">*</span>
                      {(index === 0 || index === 1) && <span className="ml-2 text-xs text-red-500">(Mandatory)</span>}
                    </Label>
                    <Select
                      value={subject.subject_name}
                      onValueChange={(value) => handleSubjectChange(index, "subject_name", value)}
                      disabled={index === 0 || index === 1} // Disable changing Mathematics and English
                    >
                      <SelectTrigger id={`subject-${index}`} className="bg-white border-gray-200">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {commonSubjects.map((subj) => (
                          <SelectItem key={`${subj}-${index}`} value={subj}>
                            {subj}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other (Type in)</SelectItem>
                      </SelectContent>
                    </Select>
                    {subject.subject_name === "other" && (
                      <Input
                        className="mt-2 bg-white border-gray-200"
                        placeholder="Enter subject name"
                        value=""
                        onChange={(e) => handleSubjectChange(index, "subject_name", e.target.value)}
                      />
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor={`grade-${index}`}>
                      Grade <span className="text-red-500">*</span>
                    </Label>
                    <Select value={subject.grade} onValueChange={(value) => handleSubjectChange(index, "grade", value)}>
                      <SelectTrigger id={`grade-${index}`} className="bg-white border-gray-200">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 text-black">
                        {grades.map((grade) => (
                          <SelectItem key={`${grade}-${index}`} value={grade} className="text-black hover:bg-gray-100">
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSubject(index)}
                      disabled={index === 0 || index === 1} // Disable removing Mathematics and English
                      aria-label="Remove subject"
                      className={`bg-white ${index === 0 || index === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addSubject}
                className="flex items-center gap-2 bg-white border-gray-300"
              >
                <Plus className="h-4 w-4" /> Add Subject
              </Button>

              {getFieldError("subjects") && <p className="text-sm text-red-500">{getFieldError("subjects")}</p>}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">IT Qualification</h3>
              <p className="text-sm text-gray-500">
                If you have any IT certifications or qualifications, please enter them below. EDPM or IT subjects from
                your CXC list will be automatically detected. Press Enter to add multiple certifications.
              </p>
              <div className="space-y-2">
                <Label htmlFor="certification">
                  Additional IT Certification/Qualification{" "}
                  <span className="text-gray-500 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="certification"
                    name="certification"
                    value={formData.certificationInput || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, certificationInput: e.target.value }))
                    }}
                    onKeyDown={(e) => {
                      // Add certification ONLY on Enter key (not Space) if there's text
                      if (e.key === "Enter" && formData.certificationInput?.trim()) {
                        e.preventDefault()
                        const newCert = formData.certificationInput.trim()
                        const currentCerts = formData.certification ? formData.certification.split(",") : []

                        // Only add if not already in the list
                        if (!currentCerts.includes(newCert)) {
                          const updatedCerts = [...currentCerts, newCert].filter(Boolean)
                          setFormData((prev) => ({
                            ...prev,
                            certification: updatedCerts.join(","),
                            certificationInput: "",
                          }))
                        } else {
                          setFormData((prev) => ({ ...prev, certificationInput: "" }))
                        }
                      }
                    }}
                    placeholder="e.g., CompTIA A+, Associates Degree in Computer Science (press Enter to add)"
                    aria-invalid={!!getFieldError("certification")}
                    aria-describedby={getFieldError("certification") ? "certification-error" : undefined}
                    className="bg-white border-gray-200"
                  />
                </div>

                {/* Display added certifications as tags */}
                {formData.certification && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.certification
                      .split(",")
                      .filter(Boolean)
                      .map((cert, index) => {
                        const isHighValue = isHighValueQualification(cert)
                        return (
                          <div
                            key={index}
                            className={`${
                              isHighValue ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            } text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1`}
                          >
                            {isHighValue && <Award className="h-3 w-3 mr-1" />}
                            {cert}
                            <button
                              type="button"
                              onClick={() => {
                                const certs = formData.certification.split(",").filter(Boolean)
                                certs.splice(index, 1)
                                setFormData((prev) => ({
                                  ...prev,
                                  certification: certs.join(","),
                                }))
                              }}
                              className={`${
                                isHighValue
                                  ? "text-blue-700 hover:text-blue-900"
                                  : "text-green-700 hover:text-green-900"
                              } rounded-full h-4 w-4 inline-flex items-center justify-center`}
                              aria-label={`Remove ${cert}`}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                  </div>
                )}

                {formData.certification &&
                  formData.certification.split(",").some((cert) => isHighValueQualification(cert)) && (
                    <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>
                        Higher education qualifications in IT/Computer Science are highly valued for this position
                      </span>
                    </div>
                  )}

                {getFieldError("certification") && (
                  <p id="certification-error" className="text-sm text-red-500">
                    {getFieldError("certification")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Work Experience <span className="text-gray-500 font-normal">(Optional)</span>
              </h3>
              <p className="text-sm text-gray-500">
                If you have relevant work experience, please add it below. This is optional but may improve your
                application.
              </p>

              {formData.experiences.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md bg-gray-50">
                  <p className="text-gray-500 mb-4">No work experience added</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addExperience}
                    className="flex items-center gap-2 mx-auto bg-white border-gray-300"
                  >
                    <Plus className="h-4 w-4" /> Add Work Experience
                  </Button>
                </div>
              ) : (
                <>
                  {formData.experiences.map((experience, index) => (
                    <div key={index} className="border border-gray-200 p-4 rounded-md space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`company-${index}`}>
                            Company Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`company-${index}`}
                            value={experience.company_name}
                            onChange={(e) => handleExperienceChange(index, "company_name", e.target.value)}
                            placeholder="Enter company name"
                            className="bg-white border-gray-200"
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeExperience(index)}
                            aria-label="Remove experience"
                            className="bg-white"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`start-date-${index}`}>
                            Start Date <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`start-date-${index}`}
                            type="date"
                            value={experience.start_date}
                            onChange={(e) => handleExperienceChange(index, "start_date", e.target.value)}
                            className="bg-white border-gray-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`end-date-${index}`}>
                            End Date <span className="text-gray-500">(Leave blank if current)</span>
                          </Label>
                          <Input
                            id={`end-date-${index}`}
                            type="date"
                            value={experience.end_date || ""}
                            onChange={(e) => handleExperienceChange(index, "end_date", e.target.value)}
                            className="bg-white border-gray-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`duties-${index}`}>
                          Duties <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id={`duties-${index}`}
                          value={experience.duties}
                          onChange={(e) => handleExperienceChange(index, "duties", e.target.value)}
                          placeholder="Describe your duties and responsibilities"
                          rows={3}
                          className="bg-white border-gray-200"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addExperience}
                    className="flex items-center gap-2 bg-white border-gray-300"
                  >
                    <Plus className="h-4 w-4" /> Add Another Experience
                  </Button>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-white">
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </>
  )
}
