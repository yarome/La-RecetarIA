const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let tokenGetter: () => string | null = () => null;
let onUnauthorised: () => void = () => {};

export function configureApiClient(opts: {
  getToken: () => string | null;
  onUnauthorised?: () => void;
}): void {
  tokenGetter = opts.getToken;
  if (opts.onUnauthorised) onUnauthorised = opts.onUnauthorised;
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!init.skipAuth) {
    const token = tokenGetter();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) return undefined as T;
  let body: unknown = null;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  if (!res.ok) {
    if (res.status === 401) onUnauthorised();
    const message =
      (body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)
        ? String((body as Record<string, unknown>).error)
        : null) ?? `Request failed: ${res.status}`;
    throw new ApiError(res.status, message, body);
  }
  return body as T;
}
