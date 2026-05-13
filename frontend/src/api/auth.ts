const AUTH_KEY = "cerebra-auth-key"

export function getAuthHeaders(): Record<string, string> {
  const key = localStorage.getItem(AUTH_KEY) || ""
  if (!key) return {}
  return { Authorization: `Bearer ${key}` }
}

export function setAuthKey(key: string) {
  localStorage.setItem(AUTH_KEY, key)
}

export function clearAuthKey() {
  localStorage.removeItem(AUTH_KEY)
}
