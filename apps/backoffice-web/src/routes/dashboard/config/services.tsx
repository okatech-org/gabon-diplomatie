import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Cog,
	ExternalLink,
	FileText,
	Folder,
	Globe,
	IdCard,
	Plane,
	ShieldCheck,
	Stamp,
	UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { api } from "@convex/_generated/api";

export const Route = createFileRoute("/dashboard/config/services")({
	component: ServicesConfigPage,
});

// Category info with icons and colors
const CATEGORY_INFO: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string; description: string }> = {
	passport: { label: "Passeports", icon: Plane, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", description: "Délivrance et renouvellement de passeports" },
	visa: { label: "Visas", icon: Stamp, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", description: "Visas d'entrée et de transit" },
	civil_status: { label: "État civil", icon: FileText, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30", description: "Actes de naissance, mariage, décès" },
	registration: { label: "Immatriculation", icon: UserPlus, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30", description: "Inscription consulaire des citoyens" },
	legalization: { label: "Légalisation", icon: ShieldCheck, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", description: "Authentification de documents" },
	consular_card: { label: "Carte consulaire", icon: IdCard, color: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950/30", description: "Cartes d'identité consulaire" },
	emergency: { label: "Urgences", icon: ShieldCheck, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", description: "Services d'urgence consulaire" },
	other: { label: "Autres", icon: Folder, color: "text-gray-600", bgColor: "bg-gray-50 dark:bg-gray-950/30", description: "Autres services consulaires" },
};

function ServicesConfigPage() {
	const { data: services, isPending } = useAuthenticatedConvexQuery(
		api.functions.services.listCatalog,
		{},
	);

	// Group services by category
	const servicesByCategory: Record<string, typeof services> = {};
	if (services) {
		for (const svc of services) {
			const cat = (svc as unknown as { category?: string }).category || "other";
			if (!servicesByCategory[cat]) servicesByCategory[cat] = [];
			servicesByCategory[cat]!.push(svc);
		}
	}

	const totalServices = services?.length || 0;
	const activeServices = services?.filter((s) => (s as unknown as { isActive?: boolean }).isActive !== false).length || 0;

	return (
		<div className="flex flex-1 flex-col gap-6 p-6 pt-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
							<Cog className="h-5 w-5 text-primary" />
						</div>
						Services consulaires
					</h1>
					<p className="text-muted-foreground mt-1">
						Configuration et gestion des services consulaires proposés aux citoyens
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/services">
						<ExternalLink className="mr-2 h-4 w-4" />
						Voir le catalogue
					</Link>
				</Button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="bg-linear-to-br from-primary/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-primary">
							{isPending ? "…" : totalServices}
						</div>
						<div className="text-xs text-muted-foreground">Services référencés</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-green-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-green-600">
							{isPending ? "…" : activeServices}
						</div>
						<div className="text-xs text-muted-foreground">Services actifs</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-amber-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-amber-600">
							{Object.keys(servicesByCategory).length || Object.keys(CATEGORY_INFO).length}
						</div>
						<div className="text-xs text-muted-foreground">Catégories</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-blue-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-blue-600">
							<Globe className="h-6 w-6 inline" />
						</div>
						<div className="text-xs text-muted-foreground">Accessible en ligne</div>
					</CardContent>
				</Card>
			</div>

			{/* Categories */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{Object.entries(CATEGORY_INFO).map(([catKey, catInfo]) => {
					const catServices = servicesByCategory[catKey] || [];
					const IconComponent = catInfo.icon;
					return (
						<Card key={catKey} className="overflow-hidden">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-3">
									<div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", catInfo.bgColor)}>
										<IconComponent className={cn("h-5 w-5", catInfo.color)} />
									</div>
									<div className="flex-1">
										<CardTitle className="text-base">{catInfo.label}</CardTitle>
										<CardDescription className="text-xs">{catInfo.description}</CardDescription>
									</div>
									<Badge variant="outline">
										{catServices.length} service{catServices.length !== 1 ? "s" : ""}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								{isPending ? (
									<div className="text-xs text-muted-foreground animate-pulse">Chargement…</div>
								) : catServices.length > 0 ? (
									<div className="space-y-1.5">
										{catServices.map((svc: Record<string, unknown>) => (
											<div key={String(svc._id)} className="flex items-center justify-between rounded-md border px-3 py-2 bg-card">
												<div className="flex items-center gap-2">
													<div className={cn("h-2 w-2 rounded-full", (svc.isActive !== false) ? "bg-green-500" : "bg-gray-300")} />
													<span className="text-sm">{String((svc.name as Record<string, string>)?.fr || svc.name)}</span>
												</div>
												{(svc.price as number) > 0 && (
													<span className="text-xs text-muted-foreground font-mono">
														{svc.price as number}€
													</span>
												)}
											</div>
										))}
									</div>
								) : (
									<p className="text-xs text-muted-foreground italic">Aucun service configuré</p>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
