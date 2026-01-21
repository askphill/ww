import type {ProductGridSection} from '@wakey/email';
import {Input} from '../../ui/input';
import {Label} from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {ColorPicker} from './ColorPicker';
import {TypographyPicker} from './TypographyPicker';

interface ProductGridPropertiesProps {
  config: ProductGridSection['config'];
  onChange: (config: Partial<ProductGridSection['config']>) => void;
}

export function ProductGridProperties({
  config,
  onChange,
}: ProductGridPropertiesProps) {
  const addProduct = () => {
    onChange({
      products: [
        ...config.products,
        {
          imageUrl: '',
          title: 'Product Name',
          price: '€0.00',
          url: 'https://www.wakey.care',
        },
      ],
    });
  };

  const updateProduct = (
    index: number,
    field: keyof ProductGridSection['config']['products'][0],
    value: string,
  ) => {
    const products = [...config.products];
    products[index] = {...products[index], [field]: value};
    onChange({products});
  };

  const removeProduct = (index: number) => {
    onChange({products: config.products.filter((_, i) => i !== index)});
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Columns</Label>
        <Select
          value={String(config.columns)}
          onValueChange={(value) =>
            onChange({columns: parseInt(value) as 1 | 2 | 3})
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Column</SelectItem>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TypographyPicker
        label="Title Style"
        value={config.titleStyle}
        onChange={(titleStyle) => onChange({titleStyle})}
      />
      <TypographyPicker
        label="Price Style"
        value={config.priceStyle}
        onChange={(priceStyle) => onChange({priceStyle})}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Products</Label>
          <button
            onClick={addProduct}
            className="text-sm text-primary hover:underline"
          >
            + Add Product
          </button>
        </div>
        <div className="max-h-60 space-y-3 overflow-y-auto">
          {config.products.map((product, index) => (
            <div
              key={index}
              className="rounded-md border border-border bg-muted/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Product {index + 1}
                </span>
                <button
                  onClick={() => removeProduct(index)}
                  className="text-sm text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="space-y-2">
                <Input
                  type="url"
                  value={product.imageUrl}
                  onChange={(e) =>
                    updateProduct(index, 'imageUrl', e.target.value)
                  }
                  placeholder="Image URL"
                />
                <Input
                  type="text"
                  value={product.title}
                  onChange={(e) =>
                    updateProduct(index, 'title', e.target.value)
                  }
                  placeholder="Product Name"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    value={product.price}
                    onChange={(e) =>
                      updateProduct(index, 'price', e.target.value)
                    }
                    placeholder="€0.00"
                  />
                  <Input
                    type="url"
                    value={product.url}
                    onChange={(e) =>
                      updateProduct(index, 'url', e.target.value)
                    }
                    placeholder="URL"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ColorPicker
        label="Background"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({backgroundColor})}
      />
    </div>
  );
}
