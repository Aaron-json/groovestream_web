import { getUser } from "@/api/requests/user";
import { useQuery } from "@tanstack/react-query";

export const userKey = ["user"] as const;

export function useUser() {
  const query = useQuery({
    queryKey: userKey,
    queryFn: getUser,
    // user data does not change frequently
    staleTime: 1000 * 60 * 15, // an hour
  });
  return { ...query, queryKey: userKey } as const;
}
