import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	Layers,
	Lock,
	Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DynamicLucideIcon } from "@/lib/lucide-icon";
import {
	MODULE_REGISTRY,
	type ModuleCategory,
	type ModuleCodeValue,
} from "@convex/lib/moduleCodes";
import { ORGANIZATION_TEMPLATES } from "@convex/lib/roles";

export const Route = createFileRoute("/dashboard/config/modules")({
	component: ModulesConfigPage,
});

// Category metadata
const CATEGORY_META: Record<ModuleCategory, { label: string; color: string; bgColor: string }> = {
	core: { label: "Cœur de système", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
	consular: { label: "Services consulaires", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
	community: { label: "Communauté", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
	finance: { label: "Finance", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
	communication: { label: "Communication", color: "text-teal-600", bgColor: "bg-teal-50 dark:bg-teal-950/30" },
	admin: { label: "Administration", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" },
	special: { label: "Spécial", color: "text-gray-600", bgColor: "bg-gray-50 dark:bg-gray-950/30" },
};

function ModulesConfigPage() {
	const [selectedOrgType, setSelectedOrgType] = useState<string | null>(null);

	// Group modules by category
	const modulesByCategory = useMemo(() => {
		const groups: Record<ModuleCategory, typeof MODULE_REGISTRY[keyof typeof MODULE_REGISTRY][]> = {
			core: [], consular: [], community: [], finance: [], communication: [], admin: [], special: [],
		};
		for (const mod of Object.values(MODULE_REGISTRY)) {
			groups[mod.category].push(mod);
		}
		return groups;
	}, []);

	const totalModules = Object.keys(MODULE_REGISTRY).length;
	const coreModules = Object.values(MODULE_REGISTRY).filter(m => m.isCore).length;

	// If an org type is selected, get its modules
	const selectedTemplate = selectedOrgType ? ORGANIZATION_TEMPLATES.find(t => t.type === selectedOrgType) : null;
	const orgModuleSet = new Set<string>(selectedTemplate?.modules || []);

	return (
		<div className="flex flex-1 flex-col gap-6 p-6 pt-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<Layers className="h-5 w-5 text-primary" />
					</div>
					Modules & Permissions
				</h1>
				<p className="text-muted-foreground mt-1">
					Vue d'ensemble des modules fonctionnels et de leur distribution par type de représentation
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="bg-linear-to-br from-primary/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-primary">{totalModules}</div>
						<div className="text-xs text-muted-foreground">Modules totaux</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-emerald-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-emerald-600">{coreModules}</div>
						<div className="text-xs text-muted-foreground">Modules obligatoires</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-blue-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-blue-600">{Object.keys(CATEGORY_META).length}</div>
						<div className="text-xs text-muted-foreground">Catégories</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-amber-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-amber-600">{ORGANIZATION_TEMPLATES.length}</div>
						<div className="text-xs text-muted-foreground">Types de représentation</div>
					</CardContent>
				</Card>
			</div>

			{/* Org type filter */}
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-xs text-muted-foreground font-medium mr-1">Filtrer par type :</span>
				<button
					type="button"
					className={cn(
						"text-xs rounded-full px-3 py-1 border transition-colors",
						!selectedOrgType
							? "bg-primary text-primary-foreground border-primary"
							: "bg-muted/50 text-muted-foreground hover:bg-muted border-transparent"
					)}
					onClick={() => setSelectedOrgType(null)}
				>
					Tous
				</button>
				{ORGANIZATION_TEMPLATES.map((tpl) => (
					<button
						key={tpl.type}
						type="button"
						className={cn(
							"text-xs rounded-full px-3 py-1 border transition-colors flex items-center gap-1",
							selectedOrgType === tpl.type
								? "bg-primary text-primary-foreground border-primary"
								: "bg-muted/50 text-muted-foreground hover:bg-muted border-transparent"
						)}
						onClick={() => setSelectedOrgType(tpl.type)}
					>
						{tpl.label.fr}
						<Badge variant={selectedOrgType === tpl.type ? "secondary" : "outline"} className="text-[9px] h-4 px-1">
							{tpl.modules.length}
						</Badge>
					</button>
				))}
			</div>

			{/* Modules by category */}
			<div className="space-y-6">
				{(Object.entries(modulesByCategory) as [ModuleCategory, typeof MODULE_REGISTRY[keyof typeof MODULE_REGISTRY][]][]).map(
					([category, modules]) => {
						if (modules.length === 0) return null;
						const catMeta = CATEGORY_META[category];

						return (
							<div key={category}>
								<div className="flex items-center gap-2 mb-3">
									<div className={cn("h-6 w-6 rounded flex items-center justify-center", catMeta.bgColor)}>
										<span className={cn("text-xs font-bold", catMeta.color)}>
											{modules.length}
										</span>
									</div>
									<h3 className={cn("text-sm font-bold", catMeta.color)}>
										{catMeta.label}
									</h3>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
									{modules.map((mod) => {
										const isActive = selectedOrgType ? orgModuleSet.has(mod.code) : true;
										return (
											<Card key={mod.code} className={cn("overflow-hidden transition-opacity", !isActive && selectedOrgType && "opacity-30")}>
												<CardContent className="p-4 flex items-start gap-3">
													<div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", catMeta.bgColor)}>
														<DynamicLucideIcon name={mod.icon} className={cn("h-4 w-4", mod.color)} />
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<span className="text-sm font-semibold">{mod.label.fr}</span>
															{mod.isCore && (
																<Lock className="h-3 w-3 text-emerald-500" />
															)}
															{selectedOrgType && isActive && (
																<Check className="h-3.5 w-3.5 text-green-500 ml-auto shrink-0" />
															)}
														</div>
														<p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
															{mod.description.fr}
														</p>
														<div className="mt-2 flex items-center gap-1 flex-wrap">
															{ORGANIZATION_TEMPLATES.map(tpl => {
																const hasModule = tpl.modules.includes(mod.code as ModuleCodeValue);
																return (
																	<span
																		key={tpl.type}
																		className={cn(
																			"text-[8px] font-medium px-1.5 py-0.5 rounded-full border",
																			hasModule
																				? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900"
																				: "bg-muted text-muted-foreground/50 border-transparent"
																		)}
																	>
																		{tpl.label.fr.split(" ")[0]}
																	</span>
																);
															})}
														</div>
													</div>
												</CardContent>
											</Card>
										);
									})}
								</div>
							</div>
						);
					},
				)}
			</div>

			{/* Compatibility matrix */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Layers className="h-4 w-4 text-primary" />
						Matrice de compatibilité
					</CardTitle>
					<CardDescription>
						Distribution des modules par type de représentation
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead>
								<tr className="border-b">
									<th className="text-left py-2 px-3 font-semibold">Module</th>
									{ORGANIZATION_TEMPLATES.map(tpl => (
										<th key={tpl.type} className="text-center py-2 px-2 font-semibold">
											{tpl.label.fr.split(" ").map(w => w[0]).join("")}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Object.values(MODULE_REGISTRY).map((mod) => (
									<tr key={mod.code} className="border-b border-border/50 hover:bg-muted/50">
										<td className="py-1.5 px-3 flex items-center gap-2">
											<DynamicLucideIcon name={mod.icon} className={cn("h-3.5 w-3.5", mod.color)} />
											<span className="font-medium">{mod.label.fr}</span>
											{mod.isCore && <Lock className="h-2.5 w-2.5 text-emerald-500" />}
										</td>
										{ORGANIZATION_TEMPLATES.map(tpl => {
											const has = tpl.modules.includes(mod.code as ModuleCodeValue);
											return (
												<td key={tpl.type} className="text-center py-1.5 px-2">
													{has ? (
														<Check className="h-4 w-4 text-green-500 mx-auto" />
													) : (
														<span className="text-muted-foreground/30">—</span>
													)}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
