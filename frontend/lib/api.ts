export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  inStock: boolean;
};

export type AuthProvider = 'google' | 'microsoft' | 'facebook';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  provider: AuthProvider;
  avatarUrl: string | null;
};

/**
 * Resolve the API base URL for the current runtime.
 * Prefer API_URL when set (Compose injects http://api:3001 for RSC). That env
 * is not NEXT_PUBLIC_*, so it is absent from the browser bundle; clients fall
 * back to NEXT_PUBLIC_API_URL (host-reachable, e.g. http://localhost:3001).
 */
export function getApiBaseUrl(): string {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return raw.replace(/\/$/, '');
}

/**
 * Browser-facing API origin for redirects (OAuth start links) and credentialed
 * fetches. Never use the Docker-internal API_URL here.
 */
export function getBrowserApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${getApiBaseUrl()}/products`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  return response.json() as Promise<Product[]>;
}

export async function fetchAuthProviders(): Promise<AuthProvider[]> {
  const response = await fetch(`${getBrowserApiBaseUrl()}/auth/providers`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to load auth providers (${response.status})`);
  }
  const data = (await response.json()) as { providers: AuthProvider[] };
  return data.providers;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${getBrowserApiBaseUrl()}/auth/me`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to load session (${response.status})`);
  }
  const data = (await response.json()) as { user: AuthUser | null };
  return data.user;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${getBrowserApiBaseUrl()}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to sign out (${response.status})`);
  }
}

export function oauthStartUrl(provider: AuthProvider): string {
  return `${getBrowserApiBaseUrl()}/auth/${provider}`;
}
