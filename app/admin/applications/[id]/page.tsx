import { MoELogo } from "@/components/moe-logo"
import AdminApplicationDetail from "@/components/admin-application-detail"

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <MoELogo size="small" />
        <h1 className="text-2xl font-bold">Application Details</h1>
      </div>
      <AdminApplicationDetail applicationId={params.id} />
    </div>
  )
}
