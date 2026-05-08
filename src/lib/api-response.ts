import { NextResponse } from "next/server";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function apiJson<T extends object>(body: T) {
  return NextResponse.json(body);
}

export function apiOk<T extends object>(body: T) {
  return NextResponse.json({ ok: true, ...body });
}
