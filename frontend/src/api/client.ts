import { getAuthHeaders } from "./auth"

const BASE = "/api"

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const msg = res.status === 401 ? "Authentication required. Set your API key in settings." : `Request failed: ${res.statusText}`
    throw new Error(msg)
  }
  return res.json()
}

export async function apiFetchRaw(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  })
}
