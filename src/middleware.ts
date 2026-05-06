import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Aplica em tudo exceto assets estáticos e imagens
    "/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
