import {Link} from 'react-router';

interface BlogCardProps {
  to: string;
  image?: {
    src: string;
    alt?: string;
  };
  title: string;
  description: string;
  date: string;
  loading?: 'eager' | 'lazy';
  className?: string;
}

export function BlogCard({
  to,
  image,
  title,
  description,
  date,
  loading = 'lazy',
  className,
}: BlogCardProps) {
  return (
    <article className={`flex flex-col ${className || ''}`}>
      <Link to={to} className="block">
        {image && (
          <img
            src={image.src}
            alt={image.alt || title}
            className="w-full aspect-[9/5] object-cover"
            loading={loading}
          />
        )}
        <div className="pt-2 pb-8 flex flex-col gap-3 md:pt-3">
          <h2 className="text-s1 font-display">{title}</h2>
          <div className="text-small text-text/60">
            <time>{date}</time>
          </div>
          <p className="text-paragraph text-text/75 font-display">
            {description}
          </p>
        </div>
      </Link>
    </article>
  );
}
