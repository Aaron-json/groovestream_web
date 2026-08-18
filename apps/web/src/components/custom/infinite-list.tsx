import type { ReactNode } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useOnInView } from "react-intersection-observer";

import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ROOT_MARGIN = "0px 0px 100px 0px";

export type PaginationState = {
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
};

export type InfiniteScrollTriggerProps = {
  pagination: PaginationState;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
};

export function InfiniteScrollTrigger({
  pagination,
  loadingFallback,
  errorFallback,
}: InfiniteScrollTriggerProps) {
  const { loadMore, hasMore, isLoading, isError } = pagination;
  const ref = useOnInView(
    (inView) => {
      if (inView && hasMore && !isLoading && !isError) {
        loadMore();
      }
    },
    { rootMargin: ROOT_MARGIN, skip: !hasMore || isLoading || isError },
  );

  if (!hasMore) return null;

  return (
    <div ref={ref}>
      {isError
        ? (errorFallback ?? (
            <Alert variant="destructive">
              <AlertDescription>Unable to load more items.</AlertDescription>
              <AlertAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={isLoading ? "animate-spin" : undefined}
                    data-icon="inline-start"
                  />
                  {isLoading ? "Retrying..." : "Try again"}
                </Button>
              </AlertAction>
            </Alert>
          ))
        : isLoading
          ? (loadingFallback ?? (
              <div className="flex justify-center py-4">
                <LoaderCircle className="animate-spin text-muted-foreground" />
              </div>
            ))
          : null}
    </div>
  );
}

export type InfiniteListProps = {
  children: ReactNode;
  pagination: PaginationState;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
};

export function InfiniteList({
  children,
  pagination,
  loadingFallback,
  errorFallback,
}: InfiniteListProps) {
  return (
    <div className="w-full">
      {children}
      <InfiniteScrollTrigger
        pagination={pagination}
        loadingFallback={loadingFallback}
        errorFallback={errorFallback}
      />
    </div>
  );
}
