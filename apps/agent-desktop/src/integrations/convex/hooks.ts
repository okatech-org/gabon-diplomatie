export {
  useConvexQuery,
  useAuthenticatedConvexQuery,
  useAuthenticatedPaginatedQuery,
  usePaginatedConvexQuery,
  useConvexMutationQuery,
  useConvexActionQuery,
  useConvexMutation,
} from "@workspace/api/hooks";

// Legacy aliases
export {
  useConvexMutationQuery as useAuthenticatedConvexMutation,
  useConvexActionQuery as useConvexAction,
} from "@workspace/api/hooks";
