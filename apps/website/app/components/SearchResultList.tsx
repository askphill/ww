import {Link} from 'react-router';
import {urlWithTrackingParams} from '~/lib/search';

interface SearchResultItem {
  id: string;
  title: string;
  handle: string;
  trackingParameters?: string | null;
}

interface SearchResultListProps<T extends SearchResultItem> {
  title: string;
  items: T[];
  term: string;
  getPath: (item: T) => string;
}

/**
 * Generic search result list component for rendering simple lists of links.
 * Used for articles, pages, and similar search result types.
 */
export function SearchResultList<T extends SearchResultItem>({
  title,
  items,
  term,
  getPath,
}: SearchResultListProps<T>) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>{title}</h2>
      <div>
        {items.map((item) => {
          const url = urlWithTrackingParams({
            baseUrl: getPath(item),
            trackingParams: item.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={item.id}>
              <Link prefetch="intent" to={url}>
                {item.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}
