import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProfileDetailView } from "@/components/dashboard/ProfileDetailView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/profiles/$profileId")({
	component: ProfileDetailPage,
});

function ProfileDetailPage() {
	const { profileId } = Route.useParams();
	const { t } = useTranslation();

	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild className="shrink-0">
					<Link to="/profiles">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{t("profileDetail.superadminTitle")}
					</h1>
				</div>
			</div>

			<div className="flex-1 rounded-xl overflow-hidden bg-background">
				<ProfileDetailView profileId={profileId} />
			</div>
		</div>
	);
}
