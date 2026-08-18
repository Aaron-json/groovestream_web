import {
  checkUsernameExists,
  createUserProfile,
  getCurrentUser,
} from "@groovestream/api/sdk";
import { isApiError } from "@groovestream/api/errors";
import { mutationOptions, queryOptions } from "@tanstack/react-query";

export const userKey = (userId: string) => ["user", userId] as const;

export function userOptions(userId: string) {
  return queryOptions({
    queryKey: userKey(userId),
    queryFn: async ({ signal }) => {
      try {
        return await getCurrentUser({ signal });
      } catch (error) {
        if (isApiError(error) && error.http_code === 404) return null;
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function usernameAvailabilityMutationOptions() {
  return mutationOptions({
    mutationFn: async (username: string) => ({
      username,
      available: !(await checkUsernameExists({ query: { username } })),
    }),
  });
}

export function createProfileMutationOptions() {
  return mutationOptions({
    mutationFn: async (username: string) => {
      try {
        await createUserProfile({ body: { username } });
      } catch (error) {
        if (
          isApiError(error) &&
          error.http_code === 409 &&
          error.error_code === "PROFILE_EXISTS"
        ) {
          return;
        }
        throw error;
      }
    },
  });
}
