/** API client with auth headers and detailed error parsing from backend responses. */

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
    let detail = ""
    try {
      const body = await res.json()
      detail = body.detail || body.message || JSON.stringify(body)
    } catch {
      detail = res.statusText || `HTTP ${res.status}`
    }

    if (res.status === 401) {
      throw new Error("Authentication required. Set your API key in settings.")
    }
    if (res.status === 500) {
      throw new Error(detail || `Server error (500). Check backend logs for details.`)
    }
    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please wait before making more requests.")
    }
    throw new Error(detail || `Request failed (${res.status})`)
  }

  return res.json()
}
