"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Eye, Filter } from "lucide-react"
import { regions, type Application } from "@/lib/supabase"
import { getApplications, getApplicationsByRegion } from "@/app/actions"

export default function AdminApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([])
  const [regionGroups, setRegionGroups] = useState<{ [region: string]: Application[] }>({})
  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [viewMode, setViewMode] = useState<"all" | "ranked">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = async (region?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getApplications(region || undefined)

      if (result.success) {
        setApplications(result.data || [])
      } else {
        setError(result.error || "Failed to fetch applications")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRegionRankings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getApplicationsByRegion()

      if (result.success) {
        setRegionGroups(result.data || {})
      } else {
        setError(result.error || "Failed to fetch regional rankings")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === "all") {
      fetchApplications(selectedRegion === "all" ? undefined : selectedRegion || undefined)
    } else {
      fetchRegionRankings()
    }
  }, [viewMode, selectedRegion])

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
  }

  const handleViewModeChange = (mode: "all" | "ranked") => {
    setViewMode(mode)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const renderAllApplications = () => {
    if (isLoading) {
      return (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      )
    }

    if (applications.length === 0) {
      return (
        <div className="py-12 text-center">
          <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600">No applications found.</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead className="text-center">AI Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id} className="hover:bg-gray-50 border-b border-gray-200">
                <TableCell className="font-medium border-gray-200">{application.name}</TableCell>
                <TableCell className="border-gray-200">{application.region}</TableCell>
                <TableCell className="border-gray-200">{application.email}</TableCell>
                <TableCell className="border-gray-200">{formatDate(application.created_at)}</TableCell>
                <TableCell className="text-center border-gray-200">
                  {application.ai_score !== null ? (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        application.ai_score >= 70
                          ? "bg-green-100 text-green-800"
                          : application.ai_score >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {Math.floor(application.ai_score)}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell className="text-right border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="hover:bg-green-50 hover:text-green-600 bg-white"
                  >
                    <Link href={`/admin/applications/${application.id}`}>
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const renderRegionRankings = () => {
    if (isLoading) {
      return (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading regional rankings...</p>
        </div>
      )
    }

    if (Object.keys(regionGroups).length === 0) {
      return (
        <div className="py-12 text-center">
          <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600">No applications found.</p>
        </div>
      )
    }

    return (
      <Tabs defaultValue={Object.keys(regionGroups)[0]} className="w-full">
        <TabsList className="flex flex-wrap mb-6">
          {Object.keys(regionGroups)
            .sort()
            .map((region) => (
              <TabsTrigger key={region} value={region} className="text-sm">
                {region} ({regionGroups[region].length})
              </TabsTrigger>
            ))}
        </TabsList>

        {Object.keys(regionGroups)
          .sort()
          .map((region) => (
            <TabsContent key={region} value={region} className="mt-0">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader className="bg-gray-50 border-b border-gray-200">
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>IT Qualification</TableHead>
                      <TableHead className="text-center">AI Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regionGroups[region].map((application, index) => (
                      <TableRow key={application.id} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="font-bold text-center border-gray-200">{index + 1}</TableCell>
                        <TableCell className="font-medium border-gray-200">{application.name}</TableCell>
                        <TableCell className="border-gray-200">{application.email}</TableCell>
                        <TableCell className="border-gray-200">
                          {application.certification
                            ? application.certification.split(",")[0] +
                              (application.certification.split(",").length > 1
                                ? ` (+${application.certification.split(",").length - 1} more)`
                                : "")
                            : "None"}
                        </TableCell>
                        <TableCell className="text-center">
                          {application.ai_score !== null ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                application.ai_score >= 70
                                  ? "bg-green-100 text-green-800"
                                  : application.ai_score >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {Math.floor(application.ai_score)}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="hover:bg-green-50 hover:text-green-600 bg-white"
                          >
                            <Link href={`/admin/applications/${application.id}`}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
      </Tabs>
    )
  }

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="bg-white rounded-t-lg border-b">
        <CardTitle className="text-black">IT Support Officer Applications</CardTitle>
        <CardDescription>View and manage applications for the IT Support Officer position.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white text-black">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-full sm:w-[250px] bg-white">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange("all")}
              className={viewMode !== "all" ? "bg-white" : ""}
            >
              All Applications
            </Button>
            <Button
              variant={viewMode === "ranked" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange("ranked")}
              className={viewMode !== "ranked" ? "bg-white" : ""}
            >
              Ranked by Region
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {viewMode === "all" ? renderAllApplications() : renderRegionRankings()}
      </CardContent>
    </Card>
  )
}
