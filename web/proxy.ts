import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

type SessionPayload = {
  userId: number;
  role: "FARMER" | "BUYER" | "ADMIN";
  email: string;
};

async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const key = getSecretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

const protectedByRole: Record<string, string[]> = {
  "/buyer": ["BUYER"],
  "/farmer": ["FARMER"],
  "/admin": ["ADMIN"],
};

function isProtected(pathname: string) {
  return Object.keys(protectedByRole).some((prefix) => pathname.startsWith(prefix));
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(protectedByRole)) {
    if (pathname.startsWith(prefix)) return roles;
  }
  return null;
}

function dashboardForRole(role: string) {
  if (role === "FARMER") return "/farmer/dashboard";
  if (role === "BUYER") return "/buyer/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  return "/";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets handled by matcher, but double-check
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Auth pages: redirect away if already logged in
  if (isAuthPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardForRole(session.role);
    return NextResponse.redirect(url);
  }

  // Protected pages: require session
  if (isProtected(pathname)) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const required = getRequiredRoles(pathname);
    if (required && !required.includes(session.role)) {
      // Role mismatch - redirect to own dashboard
      const url = request.nextUrl.clone();
      url.pathname = dashboardForRole(session.role);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/buyer/:path*",
    "/farmer/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
