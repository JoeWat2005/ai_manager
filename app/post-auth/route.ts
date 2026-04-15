import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId, orgId, orgSlug } = await auth();
  const origin = new URL(request.url).origin;

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  if (!orgId || !orgSlug) {
    return NextResponse.redirect(new URL("/onboarding", origin));
  }

  return NextResponse.redirect(new URL(`/${orgSlug}/dashboard`, origin));
}
