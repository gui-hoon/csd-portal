import { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.10.19.189:8000';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${API_BASE}/clients/${params.id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.text();
  const res = await fetch(`${API_BASE}/clients/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${API_BASE}/clients/${params.id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
} 