import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 