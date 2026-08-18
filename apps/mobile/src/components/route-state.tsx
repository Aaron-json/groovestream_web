import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import type { ErrorBoundaryProps } from "expo-router";
import { ErrorState, LoadingState } from "@/components/screen-state";
import { getErrorMessage } from "@/lib/errors";

export function RouteLoadingState() {
  return <LoadingState label="Loading your library" />;
}

export function RouteErrorState({ error, retry }: ErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorState
      message={getErrorMessage(error, "Please check your connection and try again.")}
      onRetry={() => {
        reset();
        void retry();
      }}
    />
  );
}
