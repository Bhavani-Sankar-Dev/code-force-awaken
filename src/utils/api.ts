const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
  });
}
