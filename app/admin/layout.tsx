import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin - Regional IT Support Officer Application Portal",
  description: "Admin dashboard for the Regional IT Support Officer Application Portal",
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">{children}</div>
}
