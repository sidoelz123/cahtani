/// <reference types="vite/client" />

const rawBaseUrl = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) || "";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export function apiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function apiClient(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}

apiClient.get = (path: string, options?: RequestInit): Promise<Response> => {
  return fetch(apiUrl(path), { ...options, method: "GET" });
};

apiClient.post = (path: string, body?: any, options?: RequestInit): Promise<Response> => {
  const isJson = body && typeof body === "object" && !(body instanceof FormData);
  return fetch(apiUrl(path), {
    ...options,
    method: "POST",
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    body: isJson ? JSON.stringify(body) : body,
  });
};

apiClient.put = (path: string, body?: any, options?: RequestInit): Promise<Response> => {
  const isJson = body && typeof body === "object" && !(body instanceof FormData);
  return fetch(apiUrl(path), {
    ...options,
    method: "PUT",
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    body: isJson ? JSON.stringify(body) : body,
  });
};

apiClient.patch = (path: string, body?: any, options?: RequestInit): Promise<Response> => {
  const isJson = body && typeof body === "object" && !(body instanceof FormData);
  return fetch(apiUrl(path), {
    ...options,
    method: "PATCH",
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    body: isJson ? JSON.stringify(body) : body,
  });
};

apiClient.delete = (path: string, options?: RequestInit): Promise<Response> => {
  return fetch(apiUrl(path), { ...options, method: "DELETE" });
};
