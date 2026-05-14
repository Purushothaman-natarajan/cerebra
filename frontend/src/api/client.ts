import { getAuthHeaders } from "./auth"

const BASE = "/api"

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    })
  } catch {
    throw new Error("Unable to connect to backend. Make sure the server is running on port 8000.")
  }

  if (!res.ok) {
    const msg = res.status === 401
      ? "Authentication required. Set your API key in settings."
      : `Request failed (${res.status})`
    throw new Error(msg)
  }

  return res.json()
}
