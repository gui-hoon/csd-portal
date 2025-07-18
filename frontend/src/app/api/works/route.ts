import { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.10.19.189:8000';

export async function GET(req: NextRequest) {
  const url = `${API_BASE}/works${req.nextUrl.search}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${API_BASE}/works`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
} 