export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  inStock: boolean;
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

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${getApiBaseUrl()}/products`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  return response.json() as Promise<Product[]>;
}
