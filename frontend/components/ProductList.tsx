import type { Product } from '@/lib/api';

type ProductListProps = {
  products: Product[];
};

function formatPrice(price: string): string {
  const value = Number(price);
  if (Number.isNaN(value)) {
    return price;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return <p className="empty">No products yet. Start the API and refresh.</p>;
  }

  return (
    <ul className="product-list">
      {products.map((product) => (
        <li key={product.id} className="product">
          <div className="product-header">
            <h2>{product.name}</h2>
            <span className="price">{formatPrice(product.price)}</span>
          </div>
          <p>{product.description}</p>
          <span className={product.inStock ? 'stock in' : 'stock out'}>
            {product.inStock ? 'In stock' : 'Out of stock'}
          </span>
        </li>
      ))}
    </ul>
  );
}
