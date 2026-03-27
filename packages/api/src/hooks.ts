"use client";

import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
	type UseQueryResult,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import {
	type PaginatedQueryReference,
	useAction,
	useConvexAuth,
	usePaginatedQuery,
} from "convex/react";
import type { FunctionReference, FunctionReturnType } from "convex/server";

export { convexQuery, useConvexMutation };

/**
 * Paginated query for public (non-auth) Convex functions.
 * Supports "skip" as args to disable the query.
 */
export function usePaginatedConvexQuery<Query extends PaginatedQueryReference>(
	query: Query,
	args: Record<string, unknown> | "skip",
	options: { initialNumItems: number },
) {
	const shouldSkip = args === "skip";
	const { results, status, loadMore, isLoading } = usePaginatedQuery(
		query,
		shouldSkip ? "skip" : (args as any),
		options,
	);

	return { results, status, loadMore, isLoading };
}

/**
 * Paginated query for Convex functions that require authentication.
 * Automatically skips the query when user is not authenticated.
 */
export function useAuthenticatedPaginatedQuery<
	Query extends PaginatedQueryReference,
>(
	query: Query,
	args: Record<string, unknown> | "skip",
	options: { initialNumItems: number },
) {
	const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
	const shouldSkip = args === "skip" || !isAuthenticated || isAuthLoading;

	const { results, status, loadMore, isLoading } = usePaginatedQuery(
		query,
		shouldSkip ? "skip" : (args as any),
		options,
	);

	return { results, status, loadMore, isLoading: isLoading || isAuthLoading };
}

/**
 * Query a Convex function using TanStack Query.
 * Supports "skip" as args to disable the query.
 */
export function useConvexQuery<Query extends FunctionReference<"query">>(
	query: Query,
	args: Query["_args"] | "skip",
): UseQueryResult<FunctionReturnType<Query>> {
	const shouldSkip = args === "skip";
	const queryOptions = shouldSkip
		? { queryKey: ["convexQuery", query, "skip"] as const }
		: convexQuery(query, args);
	return useQuery({
		...queryOptions,
		enabled: !shouldSkip,
	} as any);
}

/**
 * Query a Convex function that requires authentication.
 */
export function useAuthenticatedConvexQuery<
	Query extends FunctionReference<"query">,
>(
	query: Query,
	args: Query["_args"] | "skip",
): UseQueryResult<FunctionReturnType<Query>> {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const shouldSkip = args === "skip" || !isAuthenticated || isLoading;
	const queryOptions = shouldSkip
		? { queryKey: ["convexQuery", query, "skip"] as const }
		: convexQuery(query, args);

	return useQuery({
		...queryOptions,
		enabled: !shouldSkip,
	} as any);
}

/**
 * Mutate data using a Convex mutation with TanStack Query.
 */
export function useConvexMutationQuery<
	Mutation extends FunctionReference<"mutation">,
>(mutation: Mutation) {
	const mutationFn = useConvexMutation(mutation);
	return useMutation({
		mutationFn: async (args: Mutation["_args"]) => {
			return await mutationFn(args);
		},
	});
}

/**
 * Call a Convex action using TanStack Query.
 */
export function useConvexActionQuery<
	Action extends FunctionReference<"action">,
>(action: Action) {
	const actionFn = useAction(action);
	return useMutation({
		mutationFn: async (args: Action["_args"]) => {
			return await actionFn(args);
		},
	});
}
