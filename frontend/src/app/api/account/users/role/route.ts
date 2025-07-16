import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { user_id, role } = await req.json();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${user_id}/role?role=${role}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 