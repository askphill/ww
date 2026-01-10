import {useFetcher} from 'react-router';
import {useEffect, useState} from 'react';
import {Stars, Button} from '@wakey/ui';
import {ProductTooltip} from '~/components/ProductTooltip';

interface ProductReviewsProps {
  productHandle: string;
  videoUrl: string;
  videoAlt?: string;
  initialReviewCount?: number;
  loadMoreText?: string;
}

interface Review {
  name: string;
  rating: number;
  title: string;
  body: string;
}

export function ProductReviews({
  productHandle,
  videoUrl,
  videoAlt = '',
  initialReviewCount = 4,
  loadMoreText = 'More reviews',
}: ProductReviewsProps) {
  const fetcher = useFetcher();
  const [visibleCount, setVisibleCount] = useState(initialReviewCount);

  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(`/api/reviews/${productHandle}`);
    }
  }, [productHandle, fetcher]);

  const reviews: Review[] = fetcher.data?.reviews || [];
  const averageRating = fetcher.data?.averageRating;
  const totalCount = fetcher.data?.totalCount || 0;

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMoreReviews = visibleCount < reviews.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, reviews.length));
  };

  return (
    <section className="md:grid md:grid-cols-2">
      {/* Reviews Column */}
      <div className="bg-sand rounded-card flex flex-col items-center overflow-hidden px-0 pt-8 pb-8 md:px-0 md:pt-8 md:pb-32">
        {/* Score Display */}
        {averageRating !== null && (
          <>
            <div className=" text-[12.81rem] md:text-[19.38rem] font-display leading-none pt-8 pb-4 md:pt-16 md:pb-4">
              {averageRating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center gap-2 pb-8 md:pb-16">
              <Stars rating={averageRating || 0} color="black" size="md" />
              <span className="text-small">({totalCount})</span>
            </div>
          </>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <ol className="w-full list-none p-0 m-0">
            {visibleReviews.map((review, index) => (
              <li
                key={index}
                className="grid grid-cols-3 md:grid-cols-2 p-4 md:py-6 md:px-8 border-b border-black/20 first:border-t"
              >
                <div className="flex flex-col">
                  <span className="text-s2 font-body italic pb-2">
                    {review.name}
                  </span>
                  <Stars rating={review.rating} color="black" size="sm" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  {review.title && (
                    <div className="text-paragraph font-display pb-2">
                      {review.title}
                    </div>
                  )}
                  {review.body && (
                    <div className="text-paragraph">{review.body}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          fetcher.state === 'idle' && (
            <div className="text-center py-8 text-s2">No reviews yet</div>
          )
        )}

        {/* Load More Button */}
        {hasMoreReviews && (
          <div className="w-full p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMore}
            >
              {loadMoreText}
            </Button>
          </div>
        )}
      </div>

      {/* Video Column - Desktop Only */}
      <div className="hidden md:block sticky top-0 h-dvh">
        <div className="relative h-full rounded-card overflow-hidden">
          <video
            className="w-full h-full object-cover"
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            aria-label={videoAlt}
          />
          <ProductTooltip
            handle={productHandle}
            position={{right: '1rem', bottom: '1rem'}}
          />
        </div>
      </div>

      {/* Video Column - Mobile */}
      <div className="md:hidden relative rounded-card overflow-hidden aspect-3/4">
        <video
          className="w-full h-full object-cover"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          aria-label={videoAlt}
        />
        <ProductTooltip
          handle={productHandle}
          position={{left: '1rem', bottom: '1rem'}}
        />
      </div>
    </section>
  );
}
