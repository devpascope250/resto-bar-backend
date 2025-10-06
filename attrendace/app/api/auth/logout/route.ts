import { clearTokenCookie } from "@/lib/auth";
import { NextResponse } from "next/server";
export async function POST() {
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );
  
  console.log(response);
  
  return clearTokenCookie(response);
}
