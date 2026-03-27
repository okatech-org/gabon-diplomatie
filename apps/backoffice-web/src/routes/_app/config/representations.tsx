import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	Building,
	Building2,
	Globe,
	Home,
	Landmark,
	Layers,
	Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ORGANIZATION_TEMPLATES,
	POSITION_GRADES,
	type PositionTemplate,
} from "@convex/lib/roles";

export const Route = createFileRoute("/_app/config/representations")({
	component: RepresentationsConfigPage,
});

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
	Landmark,
	Building,
	Building2,
	Home,
	Globe,
};

function PositionBadge({ position }: { position: PositionTemplate }) {
	const grade = position.grade ? POSITION_GRADES[position.grade] : null;
	return (
		<div className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-card">
			<div className={`h-2 w-2 rounded-full ${grade?.color?.replace("text-", "bg-") || "bg-gray-400"}`} />
			<span className="text-sm font-medium">{position.title.fr}</span>
			{grade && (
				<span className={`text-[10px] font-medium ${grade.color}`}>
					{grade.shortLabel.fr}
				</span>
			)}
			{position.isRequired && (
				<Badge variant="outline" className="text-[8px] h-4 px-1 text-amber-600 border-amber-300 ml-auto">
					Requis
				</Badge>
			)}
		</div>
	);
}

function RepresentationsConfigPage() {
	const templates = useMemo(() => ORGANIZATION_TEMPLATES, []);

	return (
		<div className="flex flex-1 flex-col gap-6 p-6 pt-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
							<Globe className="h-5 w-5 text-primary" />
						</div>
						Représentations diplomatiques
					</h1>
					<p className="text-muted-foreground mt-1">
						Configuration des types de représentations, postes et modules par défaut
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="bg-linear-to-br from-primary/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-primary">{templates.length}</div>
						<div className="text-xs text-muted-foreground">Types de représentation</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-amber-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-amber-600">
							{templates.reduce((sum, t) => sum + t.positions.length, 0)}
						</div>
						<div className="text-xs text-muted-foreground">Postes prédéfinis (total)</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-blue-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-blue-600">
							{Object.keys(POSITION_GRADES).length}
						</div>
						<div className="text-xs text-muted-foreground">Grades hiérarchiques</div>
					</CardContent>
				</Card>
				<Card className="bg-linear-to-br from-green-500/5 to-transparent">
					<CardContent className="p-4">
						<div className="text-2xl font-bold text-green-600">
							{new Set(templates.flatMap(t => t.modules)).size}
						</div>
						<div className="text-xs text-muted-foreground">Modules disponibles</div>
					</CardContent>
				</Card>
			</div>

			{/* Organization type cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{templates.map((tpl) => {
					const IconComponent = ICON_MAP[tpl.icon] || Building2;
					const requiredPositions = tpl.positions.filter(p => p.isRequired).length;
					const gradeDistribution = Object.entries(POSITION_GRADES).map(([key, grade]) => ({
						key,
						label: grade.label.fr,
						color: grade.color,
						bgColor: grade.bgColor,
						count: tpl.positions.filter(p => p.grade === key).length,
					})).filter(g => g.count > 0);

					return (
						<Card key={tpl.type} className="overflow-hidden">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
											<IconComponent className="h-5 w-5 text-primary" />
										</div>
										<div>
											<CardTitle className="text-base">{tpl.label.fr}</CardTitle>
											<CardDescription className="text-xs">
												{tpl.description.fr}
											</CardDescription>
										</div>
									</div>
									<Badge variant="outline" className="shrink-0 text-xs">
										{tpl.type}
									</Badge>
								</div>

								{/* Grade distribution */}
								<div className="flex items-center gap-2 mt-3 flex-wrap">
									{gradeDistribution.map((g) => (
										<span key={g.key} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${g.bgColor} ${g.color}`}>
											{g.label}: {g.count}
										</span>
									))}
								</div>
							</CardHeader>
							<CardContent className="pt-0 space-y-3">
								{/* Stats row */}
								<div className="flex items-center gap-4 text-xs text-muted-foreground border-b pb-3">
									<span className="flex items-center gap-1">
										<Users className="h-3.5 w-3.5" />
										{tpl.positions.length} postes
									</span>
									<span className="flex items-center gap-1 text-amber-600">
										{requiredPositions} requis
									</span>
									<span className="flex items-center gap-1">
										<Layers className="h-3.5 w-3.5" />
										{tpl.modules.length} modules
									</span>
								</div>

								{/* Position list */}
								<div className="grid grid-cols-1 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
									{tpl.positions.map((pos) => (
										<PositionBadge key={pos.code} position={pos} />
									))}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
