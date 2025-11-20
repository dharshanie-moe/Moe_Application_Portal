import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isAuthorizedAdmin } from "@/lib/db-setup"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(new URL("/admin/login?error=Authentication failed", request.url))
    }

    // Check if the user is an authorized admin
    if (data.user) {
      const isAdmin = await isAuthorizedAdmin(data.user.email || "")

      if (!isAdmin) {
        // Sign out if not an admin
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL("/admin/login?error=Not authorized as admin", request.url))
      }
    }
  }

  // Redirect to the admin dashboard
  return NextResponse.redirect(new URL("/admin/applications", request.url))
}
