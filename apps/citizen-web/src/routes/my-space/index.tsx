import { api } from "@convex/_generated/api";
import { RequestStatus } from "@convex/lib/constants";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
	ArrowRight,
	Bell,
	Building2,
	Calendar,
	FileText,
	Loader2,
	Megaphone,
	PlayCircle,
	Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ConsularCardWidget } from "@/components/my-space/consular-card-widget";
import { MySpaceHeader } from "@/components/my-space/my-space-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	useAuthenticatedConvexQuery,
	useConvexQuery,
} from "@/integrations/convex/hooks";
import { getLocalizedValue } from "@/lib/i18n-utils";
import { REQUEST_STATUS_CONFIG } from "@/lib/request-status-config";

export const Route = createFileRoute("/my-space/")({
	component: UserDashboard,
});

// Status badge helper using centralized config
function getStatusBadge(
	status: string,
	t: (key: string, fallback: string) => string,
) {
	const config = REQUEST_STATUS_CONFIG[status as RequestStatus];
	return (
		<Badge variant="outline" className={config?.className ?? ""}>
			{config ? t(config.i18nKey, config.fallback) : status}
		</Badge>
	);
}

function UserDashboard() {
	const { t, i18n } = useTranslation();
	const { data: profile, isPending } = useAuthenticatedConvexQuery(
		api.functions.profiles.getMine,
		{},
	);
	const { data: latestRequest } = useAuthenticatedConvexQuery(
		api.functions.requests.getLatestActive,
		{},
	);
	const { data: appointments } = useAuthenticatedConvexQuery(
		api.functions.appointments.listByUser,
		{},
	);
	const { data: posts } = useConvexQuery(api.functions.posts.getLatest, {
		limit: 3,
	});
	const { data: services } = useConvexQuery(
		api.functions.services.listCatalog,
		{},
	);

	const popularServices = services?.slice(0, 4) ?? [];

	if (isPending) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 lg:gap-6 md:h-full p-1">
			<MySpaceHeader />

			{/* Main Content Grid - stacked on mobile, 50/50 on desktop */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2, delay: 0.1 }}
				className="flex flex-col md:grid md:grid-cols-2 gap-4 lg:gap-6 md:flex-1 md:min-h-0"
			>
				{/* Left Column - Main blocks stacked */}
				<div className="grid gap-4 lg:gap-6 md:min-h-0">
					{/* Current Request Card */}
					<Card className="overflow-hidden flex flex-col">
						<CardHeader className="pb-0">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									{t("mySpace.currentRequest.title")}
								</CardTitle>
								{latestRequest && getStatusBadge(latestRequest.status, t)}
							</div>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col">
							{latestRequest ? (
								<div className="flex-1 flex flex-col">
									{/* Top Section - Service Info */}
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-lg truncate">
												{getLocalizedValue(
													latestRequest.service?.name as any,
													i18n.language,
												) || t("requests.unknownService")}
											</h3>
											<p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
												<Building2 className="h-3.5 w-3.5" />
												{(latestRequest.org as any)?.name ||
													t("requests.unknownOrg")}
											</p>
											{/* Action required indicator */}
											{(() => {
												const actions = (
													latestRequest as Record<string, unknown>
												).actionsRequired as
													| Array<{ message: string; completedAt?: number }>
													| undefined;
												const pending =
													actions?.filter((a) => !a.completedAt) ?? [];
												if (pending.length === 0) return null;
												return (
													<div className="mt-2 space-y-1">
														<Badge className="bg-amber-100 text-amber-700 border-amber-200">
															{t(
																"mySpace.currentRequest.actionRequired",
																"Action requise",
															)}
														</Badge>
														<p className="text-sm text-amber-700 line-clamp-2">
															{pending[0]?.message ?? ""}
														</p>
													</div>
												);
											})()}
										</div>
										{latestRequest.reference && (
											<span className="font-mono text-xs bg-muted px-2 py-1 rounded shrink-0">
												{latestRequest.reference}
											</span>
										)}
									</div>

									{/* Bottom Section - pushed to bottom */}
									<div className="flex-1 flex flex-col justify-end mt-4">
										{/* Timeline Progress - only for non-draft */}
										{latestRequest.status !== RequestStatus.Draft && (
											<div className="flex items-center gap-2 py-2">
												{[
													RequestStatus.Pending,
													RequestStatus.UnderReview,
													RequestStatus.Completed,
												].map((step, i) => {
													const isActive = latestRequest.status === step;
													const isPast =
														[
															RequestStatus.Pending,
															RequestStatus.UnderReview,
															RequestStatus.Completed,
														].indexOf(latestRequest.status) > i;
													return (
														<div
															key={step}
															className="flex-1 flex items-center"
														>
															<div
																className={`h-2 flex-1 rounded-full ${
																	isActive || isPast ? "bg-primary" : "bg-muted"
																}`}
															/>
														</div>
													);
												})}
											</div>
										)}

										<div className="flex items-center justify-between">
											<p className="text-sm text-muted-foreground">
												{t("mySpace.currentRequest.updated")}{" "}
												{formatDistanceToNow(
													new Date(latestRequest._creationTime),
													{ addSuffix: true, locale: fr },
												)}
											</p>
											{latestRequest.status === RequestStatus.Draft ? (
												<Button asChild size="sm">
													<Link
														to="/my-space/requests/$reference"
														params={{
															reference:
																latestRequest.reference || latestRequest._id,
														}}
													>
														<PlayCircle className="mr-2 h-4 w-4" />
														{t("requests.resumeDraft")}
													</Link>
												</Button>
											) : (
												<Button asChild size="sm">
													<Link
														to="/my-space/requests/$reference"
														params={{
															reference:
																latestRequest.reference || latestRequest._id,
														}}
													>
														{t(
															"mySpace.currentRequest.viewDetails",
															"Voir les détails",
														)}
														<ArrowRight className="ml-1 h-4 w-4" />
													</Link>
												</Button>
											)}
										</div>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-8 text-center flex-1">
									<FileText className="h-12 w-12 mb-4 text-muted-foreground/30" />
									<h3 className="font-medium mb-1">
										{t(
											"mySpace.currentRequest.empty",
											"Aucune demande en cours",
										)}
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										{t(
											"mySpace.currentRequest.emptyDesc",
											"Commencez une nouvelle démarche consulaire",
										)}
									</p>
									<Button asChild>
										<Link to="/services">
											{t(
												"mySpace.currentRequest.newRequest",
												"Faire une demande",
											)}
											<ArrowRight className="ml-1 h-4 w-4" />
										</Link>
									</Button>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Official Communications Card - fills remaining space */}
					<Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<Megaphone className="h-5 w-5" />
									{t(
										"mySpace.communications.title",
										"Communications officielles",
									)}
								</CardTitle>
								<Button asChild variant="ghost" size="sm">
									<Link to="/news">
										{t("mySpace.communications.viewAll")}
										<ArrowRight className="ml-1 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto min-h-0">
							{posts && posts.length > 0 ? (
								<div className="space-y-2">
									{posts.map((post: any) => (
										<Link
											key={post._id}
											to="/news/$slug"
											params={{ slug: post.slug }}
											className="block group"
										>
											<div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
												<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
													<Bell className="h-5 w-5 text-primary" />
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
														{post.title}
													</h4>
													<p className="text-xs text-muted-foreground mt-0.5">
														{post.publishedAt
															? format(
																	new Date(post.publishedAt),
																	"dd MMM yyyy",
																	{
																		locale: fr,
																	},
																)
															: format(
																	new Date(post._creationTime),
																	"dd MMM yyyy",
																	{
																		locale: fr,
																	},
																)}
													</p>
												</div>
											</div>
										</Link>
									))}
								</div>
							) : (
								<div className="text-center py-6">
									<Megaphone className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										{t(
											"mySpace.communications.empty",
											"Aucune communication récente",
										)}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column - 1 col on mobile, 2x2 grid on desktop */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2, delay: 0.15 }}
					className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 md:grid-rows-2 md:h-full"
				>
					{/* Consular Card Widget */}
					<ConsularCardWidget profile={profile} />
					{/* Upcoming Appointments Widget */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								{t("mySpace.upcomingAppointments.title")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{appointments && appointments.length > 0 ? (
								<div className="space-y-2">
									{appointments
										.filter((apt: any) => apt.date)
										.slice(0, 2)
										.map((apt: any) => (
											<div
												key={apt._id}
												className="flex items-center gap-2 text-sm"
											>
												<div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
													<Calendar className="h-4 w-4 text-primary" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-medium truncate">
														{apt.service?.name || "Rendez-vous"}
													</p>
													<p className="text-xs text-muted-foreground">
														{format(new Date(apt.date), "dd MMM à HH:mm", {
															locale: fr,
														})}
													</p>
												</div>
											</div>
										))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center flex-1">
									<Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										{t(
											"mySpace.upcomingAppointments.empty",
											"Aucun rendez-vous prévu",
										)}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Most used services - styled like communications */}
					<Card className="flex flex-col min-h-0 overflow-hidden md:col-span-2">
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-medium flex items-center gap-2">
									<Sparkles className="h-4 w-4" />
									{t(
										"mySpace.popularServices.title",
										"Services les plus demandés",
									)}
								</CardTitle>
								<Button asChild variant="ghost" size="sm">
									<Link to="/services">
										{t("mySpace.popularServices.viewAll")}
										<ArrowRight className="ml-1 h-3.5 w-3.5" />
									</Link>
								</Button>
							</div>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto min-h-0">
							{popularServices.length > 0 ? (
								<div className="space-y-1">
									{popularServices.map((service: any) => (
										<Link
											key={service._id}
											to="/services/$slug"
											params={{ slug: service.slug }}
											className="block group"
										>
											<div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
												<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
													<FileText className="h-4 w-4 text-primary" />
												</div>
												<div className="flex-1 min-w-0">
													<h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
														{getLocalizedValue(service.name, i18n.language) ||
															service.slug}
													</h4>
													<p className="text-xs text-muted-foreground line-clamp-1">
														{getLocalizedValue(
															service.description,
															i18n.language,
														) || ""}
													</p>
												</div>
											</div>
										</Link>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-6 text-center">
									<FileText className="h-8 w-8 mb-2 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										{t(
											"mySpace.popularServices.empty",
											"Aucun service disponible",
										)}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	);
}
