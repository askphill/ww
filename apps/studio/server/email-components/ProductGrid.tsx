import {Column, Img, Link, Row, Section, Text} from '@react-email/components';

export interface Product {
  imageUrl: string;
  title: string;
  price: string;
  url: string;
}

export interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3;
}

export function ProductGrid({products, columns = 2}: ProductGridProps) {
  // Limit to max 6 products
  const displayProducts = products.slice(0, 6);

  // Calculate column width percentage based on column count
  const columnWidth = columns === 2 ? '50%' : '33.33%';

  // Group products into rows
  const rows: Product[][] = [];
  for (let i = 0; i < displayProducts.length; i += columns) {
    rows.push(displayProducts.slice(i, i + columns));
  }

  return (
    <Section
      style={{
        padding: '24px',
      }}
    >
      {rows.map((row, rowIndex) => (
        <Row key={rowIndex} style={{marginBottom: '24px'}}>
          {row.map((product, colIndex) => (
            <Column
              key={colIndex}
              style={{
                width: columnWidth,
                padding: '0 8px',
                verticalAlign: 'top',
              }}
            >
              <Link
                href={product.url}
                style={{textDecoration: 'none', display: 'block'}}
              >
                <Img
                  src={product.imageUrl}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}
                />
                <Text
                  style={{
                    fontFamily:
                      "'Founders Grotesk', Arial, Helvetica, sans-serif",
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    margin: '0 0 4px 0',
                    textAlign: 'center',
                  }}
                >
                  {product.title}
                </Text>
                <Text
                  style={{
                    fontFamily:
                      "'ITC Avant Garde Gothic', Arial, Helvetica, sans-serif",
                    fontSize: '14px',
                    color: '#666666',
                    margin: '0',
                    textAlign: 'center',
                  }}
                >
                  {product.price}
                </Text>
              </Link>
            </Column>
          ))}
          {/* Add empty columns to maintain grid if row is not full */}
          {row.length < columns &&
            Array.from({length: columns - row.length}).map((_, i) => (
              <Column
                key={`empty-${i}`}
                style={{
                  width: columnWidth,
                  padding: '0 8px',
                }}
              />
            ))}
        </Row>
      ))}
    </Section>
  );
}

// Schema for the template editor
export const ProductGridSchema = {
  type: 'ProductGrid',
  name: 'Product Grid',
  description: 'Grid layout for showcasing products with images and prices',
  props: {
    products: {
      type: 'array',
      label: 'Products',
      description: 'Array of products to display (max 6)',
      required: true,
      maxItems: 6,
      itemSchema: {
        imageUrl: {
          type: 'string',
          label: 'Image URL',
          description: 'URL of the product image',
          required: true,
        },
        title: {
          type: 'string',
          label: 'Title',
          description: 'Product title',
          required: true,
        },
        price: {
          type: 'string',
          label: 'Price',
          description: 'Product price (e.g., "$29.99")',
          required: true,
        },
        url: {
          type: 'string',
          label: 'URL',
          description: 'Link to the product page',
          required: true,
        },
      },
      default: [],
    },
    columns: {
      type: 'select',
      label: 'Columns',
      description:
        'Number of columns on desktop (mobile always shows 1 column)',
      required: false,
      default: 2,
      options: [
        {value: 2, label: '2 Columns'},
        {value: 3, label: '3 Columns'},
      ],
    },
  },
} as const;

export const ProductGridDefaultProps: ProductGridProps = {
  products: [
    {
      imageUrl: 'https://via.placeholder.com/300x300',
      title: 'Product 1',
      price: '$29.99',
      url: 'https://www.wakey.care',
    },
    {
      imageUrl: 'https://via.placeholder.com/300x300',
      title: 'Product 2',
      price: '$39.99',
      url: 'https://www.wakey.care',
    },
  ],
  columns: 2,
};
