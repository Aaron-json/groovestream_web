import { getUser } from "@/api/requests/user";
import { queryOptions } from "@tanstack/react-query";
import { isAxiosError } from "axios";

export const userKey = (userId: string) => ["user", userId] as const;

// The endpoint resolves the authenticated user from the access token. The ID
// is part of the key to keep each authenticated identity in a separate cache.
export function userOptions(userId: string) {
  return queryOptions({
    queryKey: userKey(userId),
    queryFn: async () => {
      try {
        return await getUser();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }

        throw error;
      }
    },
    // user data does not change frequently
    staleTime: 1000 * 60 * 15,
  });
}
