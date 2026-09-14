import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth";

// A GET route (not a page) because confirming email needs to set the session
// cookie, which Next.js only allows inside a Server Action or Route Handler —
// not while rendering a Server Component page.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  const url = request.nextUrl.clone();
  if (result === "ok") {
    url.pathname = "/dashboard";
    url.search = "?verified=1";
  } else {
    url.pathname = "/verificar-email/invalido";
    url.search = `?reason=${result}`;
  }
  return NextResponse.redirect(url);
}
