import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 