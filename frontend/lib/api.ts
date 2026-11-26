export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  inStock: boolean;
};

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';
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
