import { getCurrentUser } from "@/api/generated/sdk.gen";
import { isApiError } from "@/api/types";
import { queryOptions } from "@tanstack/react-query";

export const userKey = (userId: string) => ["user", userId] as const;

// The endpoint resolves the authenticated user from the access token. The ID
// is part of the key to keep each authenticated identity in a separate cache.
export function userOptions(userId: string) {
  return queryOptions({
    queryKey: userKey(userId),
    queryFn: async ({ signal }) => {
      try {
        return await getCurrentUser({ signal });
      } catch (error) {
        if (isApiError(error) && error.http_code === 404) {
          return null;
        }

        throw error;
      }
    },
    // user data does not change frequently
    staleTime: 1000 * 60 * 15,
  });
}
