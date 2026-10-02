import { useQuery } from "@tanstack/react-query";
import type { ResourceQuery } from "../../contracts/resource";
import { getAllResources } from "../../services/resources";

export const resourceQueryKeys = {
  all: ["resources"] as const,
  list: (query: Partial<ResourceQuery>) =>
    [...resourceQueryKeys.all, "list", query] as const,
};

export function useResourcesQuery(query: Partial<ResourceQuery> = {}) {
  return useQuery({
    queryKey: resourceQueryKeys.list(query),
    queryFn: ({ signal }) => getAllResources(query, signal),
  });
}
