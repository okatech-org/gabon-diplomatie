"use client";

import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
	ArrowRight,
	CheckCircle,
	Clock,
	CreditCard,
	QrCode,
	RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { cn } from "@/lib/utils";

// Card model images
const CARD_RECTO_URL =
	"https://greedy-horse-339.convex.cloud/api/storage/91438165-c30d-4aab-91e0-0a8e5806c1ec";
const CARD_VERSO_URL =
	"https://greedy-horse-339.convex.cloud/api/storage/1423b4ef-2701-46ef-ac6f-10d759e61c09";

interface ConsularCardWidgetProps {
	profile: Doc<"profiles"> | null | undefined;
}

export function ConsularCardWidget({ profile }: ConsularCardWidgetProps) {
	const { t } = useTranslation();
	const [isFlipped, setIsFlipped] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	// Query consular registrations for this profile
	const { data: registrations } = useAuthenticatedConvexQuery(
		api.functions.consularRegistrations.listByProfile,
		{},
	);
	const latestRegistration = registrations?.[0];

	// Get the registration request status if we have a pending registration
	const { data: registrationRequest } = useAuthenticatedConvexQuery(
		api.functions.requests.getById,
		latestRegistration?.requestId
			? { requestId: latestRegistration.requestId }
			: "skip",
	);

	const hasValidCard =
		profile?.consularCard?.cardNumber &&
		profile.consularCard.cardExpiresAt > Date.now();

	const hasExpiredCard =
		profile?.consularCard?.cardNumber &&
		profile.consularCard.cardExpiresAt <= Date.now();

	const formatDate = (timestamp: number) => {
		return format(new Date(timestamp), "dd/MM/yyyy", { locale: fr });
	};

	const handleFlip = () => setIsFlipped(!isFlipped);

	// Has valid card - show card preview
	if (hasValidCard && profile.consularCard) {
		const consularCard = profile.consularCard;
		const identity = profile.identity;
		return (
			<Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/30">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<CreditCard className="h-4 w-4 text-green-500" />
						{t("mySpace.consularCard.title")}
						<Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
							<CheckCircle className="h-3 w-3 mr-1" />
							{t("mySpace.consularCard.active")}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-1">
						<p className="font-mono text-sm font-semibold">
							{consularCard.cardNumber}
						</p>
						<p className="text-xs text-muted-foreground">
							{t("mySpace.consularCard.validUntil")}{" "}
							{formatDate(consularCard.cardExpiresAt)}
						</p>
					</div>

					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild>
							<Button variant="outline" size="sm" className="w-full gap-2">
								<QrCode className="h-4 w-4" />
								{t("mySpace.consularCard.viewCard")}
							</Button>
						</SheetTrigger>

						<SheetContent
							side="bottom"
							className="w-full max-w-[600px] mx-auto h-auto max-h-[85vh] rounded-t-xl"
						>
							<SheetHeader className="pb-4">
								<SheetTitle className="text-center">
									{t("mySpace.consularCard.title")}
								</SheetTitle>
							</SheetHeader>

							<div className="flex flex-col items-center gap-6 pb-6 overflow-y-auto">
								{/* Card with flip animation */}
								<button
									type="button"
									className="relative w-full max-w-[400px] cursor-pointer bg-transparent border-0 p-0"
									style={{ perspective: "1000px" }}
									onClick={handleFlip}
								>
									<div
										className={cn(
											"relative w-full transition-transform duration-500",
											"[transform-style:preserve-3d]",
											isFlipped && "[transform:rotateY(180deg)]",
										)}
									>
										{/* Front */}
										<div className="relative aspect-[1.6/1] w-full [backface-visibility:hidden] rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-green-800 to-green-900">
											<img
												src={CARD_RECTO_URL}
												alt="Card front"
												className="absolute inset-0 w-full h-full object-cover"
											/>
											<div className="absolute inset-0 p-4 flex flex-col justify-between">
												<div className="text-center">
													<p className="text-xs text-gray-800/80 font-medium uppercase tracking-wider">
														République Gabonaise
													</p>
													<p className="text-[10px] text-gray-800/60">
														Consulat Général du Gabon en France
													</p>
												</div>
												<div className="flex items-center gap-4">
													<div className="w-20 h-24 bg-white/20 rounded-lg flex items-center justify-center border-2 border-white/30">
														<span className="text-gray-800/50 text-xs">
															Photo
														</span>
													</div>
													<div className="flex-1 text-gray-800 space-y-1">
														<p className="font-bold text-lg uppercase truncate">
															{identity?.lastName || "NOM"}
														</p>
														<p className="text-sm">
															{identity?.firstName || "Prénom"}
														</p>
														<p className="text-xs text-gray-800/70">
															N° {consularCard.cardNumber}
														</p>
													</div>
												</div>
												<div className="flex justify-between text-xs text-gray-800/80">
													<div>
														<p className="text-[10px] text-gray-800/50">
															Délivrée le
														</p>
														<p>{formatDate(consularCard.cardIssuedAt)}</p>
													</div>
													<div className="text-right">
														<p className="text-[10px] text-gray-800/50">
															Expire le
														</p>
														<p>{formatDate(consularCard.cardExpiresAt)}</p>
													</div>
												</div>
											</div>
											<div className="absolute bottom-3 right-3 w-12 h-12 bg-white rounded p-1">
												<div className="w-full h-full bg-gray-800 rounded-sm" />
											</div>
										</div>

										{/* Back */}
										<div
											className={cn(
												"absolute inset-0 aspect-[1.6/1] w-full [backface-visibility:hidden] [transform:rotateY(180deg)]",
												"rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-green-700 to-green-800",
											)}
										>
											<img
												src={CARD_VERSO_URL}
												alt="Card back"
												className="absolute inset-0 w-full h-full object-cover"
											/>
											<div className="absolute inset-0 p-4 flex flex-col justify-center items-center">
												<div className="bg-white/90 rounded-lg p-4 text-center max-w-[80%]">
													<p className="text-xs text-gray-600 mb-2">
														Cette carte est la propriété du Consulat Général du
														Gabon
													</p>
													<p className="text-[10px] text-gray-500">
														En cas de perte, merci de la retourner à l'adresse
														ci-dessous
													</p>
													<div className="mt-3 pt-3 border-t border-gray-200">
														<p className="text-[10px] text-gray-600">
															Consulat Général du Gabon
														</p>
														<p className="text-[10px] text-gray-500">
															26 bis, avenue Raphaël - 75016 Paris
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</button>

								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<RotateCcw className="h-4 w-4" />
									<span>
										{t(
											"mySpace.consularCard.clickToFlip",
											"Cliquez pour retourner",
										)}
									</span>
								</div>

								{/* Card details */}
								<div className="w-full max-w-[400px] grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground text-xs">
											{t("mySpace.consularCard.cardNumber")}
										</p>
										<p className="font-mono font-medium">
											{consularCard.cardNumber}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											{t("mySpace.consularCard.holder")}
										</p>
										<p className="font-medium">
											{[identity?.firstName, identity?.lastName]
												.filter(Boolean)
												.join(" ") || "—"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											{t("mySpace.consularCard.issuedAt")}
										</p>
										<p className="font-medium">
											{formatDate(consularCard.cardIssuedAt)}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											{t("mySpace.consularCard.expiresAt")}
										</p>
										<p className="font-medium">
											{formatDate(consularCard.cardExpiresAt)}
										</p>
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</CardContent>
			</Card>
		);
	}

	// Has expired card
	if (hasExpiredCard) {
		return (
			<Card className="flex flex-col">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<CreditCard className="h-4 w-4" />
						{t("mySpace.consularCard.title")}
						<Badge variant="destructive" className="ml-auto">
							{t("mySpace.consularCard.expired")}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-3">
					<CreditCard className="h-8 w-8 text-muted-foreground/30" />
					<p className="text-xs text-muted-foreground">
						{t(
							"mySpace.consularCard.expiredDesc",
							"Votre carte consulaire a expiré",
						)}
					</p>
					<Button asChild variant="outline" size="sm">
						<Link
							to="/services/$slug/new"
							params={{ slug: "consular-card-registration" }}
						>
							{t("mySpace.consularCard.renew")}
							<ArrowRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	// Has pending request - check request status
	if (latestRegistration?.requestId && registrationRequest) {
		const status = registrationRequest.status;
		const isPending = ["Pending", "Processing", "Draft"].includes(status);

		if (isPending) {
			return (
				<Card className="flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<CreditCard className="h-4 w-4" />
							{t("mySpace.consularCard.title")}
							<Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200">
								<Clock className="h-3 w-3 mr-1" />
								{t("mySpace.consularCard.pending")}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="flex-1 flex flex-col items-center justify-center text-center py-6">
						<Clock className="h-8 w-8 mb-2 text-amber-500/50" />
						<p className="text-xs text-muted-foreground">
							{t(
								"mySpace.consularCard.pendingDesc",
								"Demande en cours de traitement",
							)}
						</p>
					</CardContent>
				</Card>
			);
		}
	}

	// Not a national - not eligible
	if (!profile?.isNational) {
		return (
			<Card className="flex flex-col">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<CreditCard className="h-4 w-4" />
						{t("mySpace.consularCard.title")}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col items-center justify-center text-center py-6">
					<CreditCard className="h-8 w-8 mb-2 text-muted-foreground/30" />
					<p className="text-sm text-muted-foreground">
						{t(
							"mySpace.consularCard.notEligible",
							"Réservé aux ressortissants gabonais",
						)}
					</p>
				</CardContent>
			</Card>
		);
	}

	// No card, no pending request - can request
	return (
		<Card className="flex flex-col">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2">
					<CreditCard className="h-4 w-4" />
					{t("mySpace.consularCard.title")}
					<Badge variant="secondary" className="ml-auto">
						{t("mySpace.consularCard.notIssued")}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-3">
				<CreditCard className="h-8 w-8 text-muted-foreground/30" />
				<p className="text-sm text-muted-foreground">
					{t(
						"mySpace.consularCard.noCardYet",
						"Vous n'avez pas encore de carte consulaire",
					)}
				</p>
				<Button asChild variant="outline" size="sm">
					<Link
						to="/services/$slug/new"
						params={{ slug: "consular-card-registration" }}
					>
						{t("mySpace.consularCard.request")}
						<ArrowRight className="ml-1 h-4 w-4" />
					</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
