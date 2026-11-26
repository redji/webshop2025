import { render, screen } from '@testing-library/react';
import { ProductList } from '@/components/ProductList';

describe('ProductList', () => {
  it('renders empty state', () => {
    render(<ProductList products={[]} />);
    expect(screen.getByText(/No products yet/i)).toBeInTheDocument();
  });

  it('renders products with stock labels', () => {
    render(
      <ProductList
        products={[
          {
            id: '1',
            name: 'Oak Desk Lamp',
            description: 'Warm LED desk lamp',
            price: '89.00',
            inStock: true,
          },
          {
            id: '2',
            name: 'Wool Throw',
            description: 'Soft merino throw',
            price: '76.00',
            inStock: false,
          },
        ]}
      />,
    );

    expect(screen.getByText('Oak Desk Lamp')).toBeInTheDocument();
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByText('$89.00')).toBeInTheDocument();
  });
});
