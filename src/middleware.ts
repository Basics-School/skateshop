import { NextResponse } from "next/server"
import {createMiddlewareClient} from "@supabase/auth-helpers-nextjs"
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'
export async function middleware(req:NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

<<<<<<< HEAD
export default authMiddleware({
  publicRoutes: [
    "/",
    "/signin(.*)",
    "/signup(.*)",
    "/sso-callback(.*)",
    "/api(.*)",
    "/categories(.*)",
    "/products(.*)",
    "/build-a-board(.*)",
  ],
})
=======
  const supabase = createMiddlewareClient<Database>({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (
    !session &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/settings"))
  ) {
    const url = new URL(req.url)
    url.pathname = "/signin"
    return NextResponse.redirect(url)
  }

  if (
    session &&
    (pathname === "/signin" ||
      pathname === "/signup" ||
      pathname === "/forgot-password")
  ) {
    const url = new URL(req.url)
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return res
}
>>>>>>> 7256339 (up date)

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
}
