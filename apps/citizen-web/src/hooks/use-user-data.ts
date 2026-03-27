import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { api } from "@convex/_generated/api";

/**
 * Hook léger pour le routing uniquement (post-login-redirect, header).
 * Charge l'utilisateur + memberships pour déterminer le rôle.
 * N'appelle PAS getMine (profile) — utiliser useCitizenData pour ça.
 */
export function useUserData() {
	const {
		data: userData,
		isPending: userPending,
		error,
	} = useAuthenticatedConvexQuery(api.functions.users.getMe, {});

	const { data: memberships, isPending: membershipsPending } =
		useAuthenticatedConvexQuery(
			api.functions.memberships.listMyMemberships,
			{},
		);

	const BACKOFFICE_ROLES = ["super_admin", "admin_system", "admin"];

	return {
		userData,
		isSignedIn: Boolean(userData),
		isAgent: Boolean(memberships && memberships.length > 0),
		isSuperAdmin: Boolean(userData?.isSuperadmin),
		isBackOffice: Boolean(
			userData?.isSuperadmin ||
				(userData?.role && BACKOFFICE_ROLES.includes(userData.role)),
		),
		isPending: userPending || membershipsPending,
		error,
	};
}
