import { apiUrl } from "@/lib/api/client";

export function openSse(path: string): EventSource {
  return new EventSource(apiUrl(path));
}

export function parseSsePayload<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
