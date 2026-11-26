import { ProductList } from '@/components/ProductList';
import { fetchProducts, type Product } from '@/lib/api';

// Fetch at request time so Docker SSR can use runtime API_URL (compose network).
// Build-time static generation would call localhost and bake a failed catalog.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await fetchProducts();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unable to load products';
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Webshop 2025</p>
        <h1>Curated goods for everyday rituals</h1>
        <p className="lede">
          A small Nest.js + Next.js catalog. Products are served from the API with a Postgres seed.
        </p>
      </header>

      <section aria-labelledby="catalog-heading">
        <h2 id="catalog-heading" className="section-title">
          Catalog
        </h2>
        {error ? <p className="error">{error}</p> : <ProductList products={products} />}
      </section>
    </main>
  );
}
