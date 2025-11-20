"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Check, Copy, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface JobDescriptionProps {
  onApplyClick: () => void
}

export function JobDescription({ onApplyClick }: JobDescriptionProps) {
  const [shareSuccess, setShareSuccess] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const handleShare = async () => {
    try {
      // Check if running in a secure context and if the API is available
      if (window.isSecureContext && navigator.share) {
        await navigator.share({
          title: "Regional IT Support Officer Position - Ministry of Education, Guyana",
          text: "Check out this job opportunity for Regional IT Support Officer at the Ministry of Education, Guyana",
          url: window.location.href,
        })
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 3000)
      } else {
        // If Web Share API is not available, fall back to clipboard
        copyToClipboard()
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Always fall back to clipboard on any error
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    try {
      const url = window.location.href
      navigator.clipboard.writeText(url)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      setShareError("Unable to share or copy link. Please copy the URL manually.")
      setTimeout(() => setShareError(null), 5000)
    }
  }

  return (
    <>
      {/* Application Deadline Notice - Positioned above the card */}
      <div className="flex justify-center mb-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3 max-w-md shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">Applications Closed</h4>
            <p className="text-red-700">The application period has ended. We are no longer accepting applications.</p>
          </div>
        </div>
      </div>

      <Card className="mb-8 shadow-md border-0">
        <CardHeader className="bg-white rounded-t-lg border-b border-gray-200">
          <CardTitle className="text-2xl flex items-center gap-2 text-black">
            <FileText className="h-5 w-5 text-green-600" /> Regional IT Support Officer Position
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6 bg-white text-black border-t border-b border-gray-200">
          <div className="prose max-w-none">
            <p className="font-medium text-lg">
              The Ministry of Education hereby invite persons for the Position of Regional IT Support Officer to work on
              a Part-Time basis within the eleven Education Districts of Guyana.
            </p>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Key Responsibilities include:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Installation of IT Equipment at schools including devices, workstations, printers, and networking
                  items
                </li>
                <li>Maintenance of IT Equipment within the various schools of the Education District</li>
                <li>Supporting school users IT Issues with guidance from the MIS Unit</li>
                <li>Providing entry level training on use of IT Equipment</li>
                <li>Reporting on status of IT Equipment at schools</li>
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Qualification and Experience</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Five Subjects at CXC inclusive of Mathematics and English</li>
                <li>Pass at IT or EDPM or any equivalent IT Qualification</li>
                <li>Experience in installing and maintaining IT Equipment</li>
              </ul>
            </div>
          </div>

          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Applications for this position are no longer being accepted as the deadline has passed.
            </AlertDescription>
          </Alert>

          {shareSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Link copied to clipboard! You can now share it manually.
              </AlertDescription>
            </Alert>
          )}

          {shareError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-600">{shareError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t border-gray-200">
            <Button disabled className="flex-1 bg-gray-400 cursor-not-allowed">
              Applications Closed
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2 flex-1 bg-white border-gray-300"
            >
              {shareSuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Share Position
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
