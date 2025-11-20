import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Check if we have a session cookie
  const sessionCookie = req.cookies.get("admin_session")

  // If coming from admin area to home page, clear the session
  if (sessionCookie && req.nextUrl.pathname === "/") {
    const response = NextResponse.next()
    response.cookies.delete("admin_session")
    return response
  }

  // If no session and trying to access admin routes (except login), redirect to login
  if (!sessionCookie && req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/admin/login")) {
    const redirectUrl = new URL("/admin/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If there is a session, try to parse it
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)

      // Check if session is expired
      if (session.expires < Date.now()) {
        // Redirect to login if session is expired
        if (req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/admin/login")) {
          const redirectUrl = new URL("/admin/login", req.url)
          return NextResponse.redirect(redirectUrl)
        }
      }
    } catch (e) {
      // If session is invalid, redirect to login
      if (req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/admin/login")) {
        const redirectUrl = new URL("/admin/login", req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return res
}

export const config = {
  matcher: ["/admin/:path*", "/"],
}
