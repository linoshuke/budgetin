import { refreshSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/signup", "/verify-email"];

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let supabaseHost = "";
  try {
    supabaseHost = supabaseUrl ? new URL(supabaseUrl).origin : "";
  } catch {
    supabaseHost = "";
  }

  const styleSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://fonts.googleapis.com",
    isDev ? "'unsafe-inline'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    !isDev ? "https://va.vercel-scripts.com" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `style-src ${styleSrc}`,
    isDev ? "style-src-attr 'unsafe-inline'" : "",
    `script-src ${scriptSrc}`,
    `script-src-elem ${scriptSrc}`,
    `connect-src 'self' ${supabaseHost || "https://*.supabase.co"} https: wss:`,
    "frame-src 'self' https:",
    "media-src 'self' https:",
  ]
    .filter(Boolean)
    .join("; ");
}

function hasSessionCookie(request: NextRequest) {
  const cookies = request.cookies.getAll();
  return cookies.some((cookie) => {
    if (cookie.name === "sb-access-token" || cookie.name === "sb-refresh-token") return true;
    return cookie.name.includes("auth-token");
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);

  const response = await refreshSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return response;
  }

  if (!hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname && pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
