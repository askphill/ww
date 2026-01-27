import {Link} from 'react-router';

interface ProductCardProps {
  to: string;
  image?: {
    src: string;
    alt?: string;
  };
  title: string;
  price: string;
  loading?: 'eager' | 'lazy';
  className?: string;
}

export function ProductCard({
  to,
  image,
  title,
  price,
  loading = 'lazy',
  className,
}: ProductCardProps) {
  return (
    <Link
      className={`group block h-full bg-blue overflow-hidden hover-scale ${className || ''}`}
      prefetch="intent"
      to={to}
    >
      <div className="aspect-[5/6] flex items-center justify-center p-4 md:p-6">
        {image && (
          <img
            src={image.src}
            alt={image.alt || title}
            loading={loading}
            className="w-full h-full object-contain"
          />
        )}
      </div>
      <div className="p-4 md:p-6 pt-0 md:pt-0">
        <h4 className="text-label font-display uppercase tracking-tight">
          {title}
        </h4>
        <span className="text-small font-body opacity-80">{price}</span>
      </div>
    </Link>
  );
}
