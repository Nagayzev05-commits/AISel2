import { QueryClient } from "@tanstack/react-query";

export const API_BASE =
  typeof window !== "undefined" && (window as Record<string, unknown>).__PORT_5000__
    ? String((window as Record<string, unknown>).__PORT_5000__)
    : "";

function getToken(): string | null {
  return _token;
}
// In-memory token store (avoids sessionStorage for iframe compatibility)
let _token: string | null = null;

export function setToken(token: string) {
  _token = token;
}
export function clearToken() {
  _token = null;
}

export async function apiRequest(method: string, path: string, body?: unknown): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export async function apiUpload(path: string, formData: FormData): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
}

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  // Support array keys like ['/api/items', id] → '/api/items/id'
  let path: string;
  if (Array.isArray(queryKey) && queryKey.length > 1) {
    path = queryKey.slice(1).reduce((acc, seg) => `${acc}/${seg}`, queryKey[0] as string) as string;
  } else {
    path = (Array.isArray(queryKey) ? queryKey[0] : queryKey) as string;
  }
  const res = await apiRequest("GET", path);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { queryFn: defaultQueryFn, retry: 1, staleTime: 30_000 },
  },
});
