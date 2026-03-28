import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";

interface OrgContextType {
  activeOrgId: Id<"orgs"> | null;
  activeMembershipId: Id<"memberships"> | null;
  activePositionGrade: string | null;
  setActiveOrgId: (orgId: Id<"orgs">) => void;
  isLoading: boolean;
  activeOrg: any | null;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrgId, setActiveOrgIdState] = useState<Id<"orgs"> | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const { data: memberships } = useAuthenticatedConvexQuery(
    api.functions.users.getOrgMemberships,
    {},
  );

  useEffect(() => {
    const storedOrgId = localStorage.getItem("consulat-active-org");
    if (storedOrgId) {
      setActiveOrgIdState(storedOrgId as Id<"orgs">);
    }
    setIsRestoring(false);
  }, []);

  useEffect(() => {
    if (!isRestoring && memberships !== undefined) {
      if (memberships.length === 0) {
        setActiveOrgIdState(null);
        localStorage.removeItem("consulat-active-org");
        return;
      }
      const isValid = memberships.some((m) => m.orgId === activeOrgId);
      if (!activeOrgId || !isValid) {
        const firstOrg = memberships[0];
        if (firstOrg) {
          setActiveOrgIdState(firstOrg.orgId);
          localStorage.setItem("consulat-active-org", firstOrg.orgId);
        }
      }
    }
  }, [memberships, activeOrgId, isRestoring]);

  const setActiveOrgId = (orgId: Id<"orgs">) => {
    setActiveOrgIdState(orgId);
    localStorage.setItem("consulat-active-org", orgId);
  };

  const activeMember =
    memberships?.find((m) => m.orgId === activeOrgId) || null;
  const activeMembershipId = (activeMember?._id as Id<"memberships">) || null;
  const activePositionGrade = (activeMember as any)?.positionGrade || null;
  const activeOrg = activeMember?.org || null;
  const isLoading = isRestoring || memberships === undefined;

  return (
    <OrgContext.Provider
      value={{
        activeOrgId,
        activeMembershipId,
        activePositionGrade,
        setActiveOrgId,
        isLoading,
        activeOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
