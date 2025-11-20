import { Button } from "@/components/ui/button"
import { MoELogo } from "@/components/moe-logo"
import AdminApplicationsList from "@/components/admin-applications-list"
import { LogOut } from "lucide-react"
import Link from "next/link"

export default function ApplicationsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <MoELogo size="small" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/">
            <LogOut className="h-4 w-4" /> Logout
          </Link>
        </Button>
      </div>
      <AdminApplicationsList />
    </div>
  )
}
