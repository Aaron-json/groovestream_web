import { getUser } from "@/api/requests/user";
import { useQuery } from "@tanstack/react-query";

export function getUserKey() {
  return ["user"];
}

export function useUser() {
  const queryKey = getUserKey();
  const query = useQuery({
    queryKey,
    queryFn: getUser,
    // user data does not change frequently
    staleTime: 1000 * 60 * 15, // an hour
  });
  return { ...query, queryKey } as const;
}
