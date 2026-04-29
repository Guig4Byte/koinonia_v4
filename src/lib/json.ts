export type ApiMessage = {
  error?: string;
  message?: string;
};

function stringProp(value: object, key: keyof ApiMessage): string | undefined {
  const prop = (value as Record<string, unknown>)[key];
  return typeof prop === "string" ? prop : undefined;
}

export async function readApiMessage(response: Response): Promise<ApiMessage | null> {
  const body: unknown = await response.json().catch(() => null);

  if (typeof body !== "object" || body === null) return null;

  return {
    error: stringProp(body, "error"),
    message: stringProp(body, "message"),
  };
}
