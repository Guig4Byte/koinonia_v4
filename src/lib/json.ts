import type { NextRequest } from "next/server";

export type ApiMessage = {
  error?: string;
  message?: string;
};

function getStringProperty(value: Record<string, unknown>, key: keyof ApiMessage): string | undefined {
  const prop = value[key];
  return typeof prop === "string" ? prop : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Reads a JSON request body without allowing `any` to leak into route validation.
 */
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Safely extracts the small error/message envelope returned by API routes.
 */
export async function readApiMessage(response: Response): Promise<ApiMessage | null> {
  const body: unknown = await response.json().catch(() => null);

  if (!isRecord(body)) return null;

  return {
    error: getStringProperty(body, "error"),
    message: getStringProperty(body, "message"),
  };
}
