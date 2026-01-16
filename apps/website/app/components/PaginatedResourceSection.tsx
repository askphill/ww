import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';

/**
 * <PaginatedResourceSection > is a component that encapsulate how the previous and next behaviors throughout your application.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  resourcesClassName?: string;
}) {
  return (
    <Pagination connection={connection}>
      {({
        nodes,
        isLoading,
        PreviousLink,
        NextLink,
        hasPreviousPage,
        hasNextPage,
      }) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div className="flex flex-col gap-6 md:gap-8">
            {hasPreviousPage && (
              <div className="flex justify-center">
                <PreviousLink className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-text/20 font-display text-label hover:bg-text/5 transition-colors">
                  {isLoading ? (
                    'Loading...'
                  ) : (
                    <>
                      <span className="text-paragraph">↑</span>
                      <span>Load previous</span>
                    </>
                  )}
                </PreviousLink>
              </div>
            )}
            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}
            {hasNextPage && (
              <div className="flex justify-center">
                <NextLink className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-text/20 font-display text-label hover:bg-text/5 transition-colors">
                  {isLoading ? (
                    'Loading...'
                  ) : (
                    <>
                      <span>Load more</span>
                      <span className="text-paragraph">↓</span>
                    </>
                  )}
                </NextLink>
              </div>
            )}
          </div>
        );
      }}
    </Pagination>
  );
}
