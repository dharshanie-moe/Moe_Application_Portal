"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import ApplicationForm from "@/components/application-form"
import { MoELogo } from "@/components/moe-logo"
import { JobDescription } from "@/components/job-description"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

export default function Home() {
  const [showForm, setShowForm] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const scrollToForm = () => {
    setShowForm(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 py-8 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <MoELogo size="medium" />
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href="/admin/login">
              <Lock className="h-3 w-3" /> Admin
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-center text-black">
            Regional IT Support Officer Application Portal
          </h1>
          <p className="text-gray-600 max-w-2xl text-center">
            Apply for the Regional IT Support Officer part-time position with the Ministry of Education, Guyana.
          </p>
        </div>

        <JobDescription onApplyClick={scrollToForm} />

        {showForm ? (
          <div ref={formRef}>
            <ApplicationForm
              onSuccess={() => {
                // Reset the form view
                setShowForm(false)
                // Scroll to top
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
            />
          </div>
        ) : null}
      </div>
    </main>
  )
}
