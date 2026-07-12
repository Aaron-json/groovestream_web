import { getUser } from "@/api/requests/user";
import { queryOptions } from "@tanstack/react-query";

export const userKey = ["user"] as const;

export function userOptions() {
  return queryOptions({
    queryKey: userKey,
    queryFn: getUser,
    // user data does not change frequently
    staleTime: 1000 * 60 * 15, // an hour
  });
}
