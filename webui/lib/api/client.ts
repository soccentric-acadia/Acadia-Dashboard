const API_BASE =
  process.env.NEXT_PUBLIC_PLATFORM_SERVER?.replace(/\/$/, "") ?? "http://localhost:8080";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    // DSH-003: the Server authenticates every route (SRV-001) via the session
    // cookie set at login — send credentials on every call.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // DSH-003: a 401 means the session expired or was never established —
    // clear local auth state and return the operator to the login page.
    if (response.status === 401) {
      const { handleUnauthorized } = await import("./auth");
      handleUnauthorized();
    }
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}