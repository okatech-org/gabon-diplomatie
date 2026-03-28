import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
	AlertCircle,
	Ban,
	CheckCircle2,
	ChevronDown,
	Clock,
	Loader2,
	Plus,
	Printer,
	RefreshCw,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { useOrg } from "@/components/org/org-provider";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { BatchPrintDialog } from "./batch-print-dialog";
import { PrinterPanel } from "./printer-panel";

type JobStatus = "queued" | "printing" | "completed" | "failed" | "cancelled";

const STATUS_CONFIG: Record<
	JobStatus,
	{ label: string; icon: React.ElementType; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
	queued: { label: "En attente", icon: Clock, color: "text-amber-500", badgeVariant: "outline" },
	printing: { label: "Impression", icon: Printer, color: "text-blue-500", badgeVariant: "default" },
	completed: { label: "Terminé", icon: CheckCircle2, color: "text-green-500", badgeVariant: "secondary" },
	failed: { label: "Échoué", icon: AlertCircle, color: "text-red-500", badgeVariant: "destructive" },
	cancelled: { label: "Annulé", icon: Ban, color: "text-muted-foreground", badgeVariant: "outline" },
};

const PRIORITY_LABELS: Record<string, string> = {
	normal: "Normal",
	high: "Haute",
	urgent: "Urgente",
};

function formatRelativeTime(ts: number): string {
	const diff = Date.now() - ts;
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return "À l'instant";
	if (minutes < 60) return `Il y a ${minutes}min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `Il y a ${hours}h`;
	const days = Math.floor(hours / 24);
	return `Il y a ${days}j`;
}

export function PrintQueuePage() {
	const { activeOrgId } = useOrg();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showNewPrint, setShowNewPrint] = useState(false);

	const cancelJob = useMutation(api.functions.printJobs.cancel);
	const retryJob = useMutation(api.functions.printJobs.retry);
	const removeJob = useMutation(api.functions.printJobs.remove);

	const { data: allJobs, isPending } = useAuthenticatedConvexQuery(
		api.functions.printJobs.listByOrg,
		activeOrgId ? { orgId: activeOrgId } : "skip",
	);

	const { data: stats } = useAuthenticatedConvexQuery(
		api.functions.printJobs.queueStats,
		activeOrgId ? { orgId: activeOrgId } : "skip",
	);

	const filteredJobs = allJobs?.filter((j) => {
		if (statusFilter === "all") return true;
		if (statusFilter === "active") return j.status === "queued" || j.status === "printing";
		return j.status === statusFilter;
	}) ?? [];

	const handleCancel = async (jobId: Id<"printJobs">) => {
		try { await cancelJob({ jobId }); } catch { /* toast */ }
	};
	const handleRetry = async (jobId: Id<"printJobs">) => {
		try { await retryJob({ jobId }); } catch { /* toast */ }
	};
	const handleRemove = async (jobId: Id<"printJobs">) => {
		try { await removeJob({ jobId }); } catch { /* toast */ }
	};

	return (
		<div className="flex h-full">
			<div className="flex-1 flex flex-col min-w-0">
				<div className="p-6 pb-4 space-y-4 border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div>
								<h1 className="text-2xl font-bold tracking-tight">File d'impression</h1>
								<p className="text-sm text-muted-foreground">
									Gérer les impressions de cartes consulaires
								</p>
							</div>
							<div className="ml-auto" />
							<Button onClick={() => setShowNewPrint(true)} size="sm">
								<Plus className="h-4 w-4 mr-1.5" />
								Nouvelle impression
							</Button>
						</div>
						{stats && (
							<div className="flex items-center gap-3">
								{stats.queued > 0 && (
									<div className="flex items-center gap-1.5 text-sm">
										<Clock className="h-4 w-4 text-amber-500" />
										<span className="font-medium">{stats.queued}</span>
										<span className="text-muted-foreground">en attente</span>
									</div>
								)}
								{stats.printing > 0 && (
									<div className="flex items-center gap-1.5 text-sm">
										<Printer className="h-4 w-4 text-blue-500 animate-pulse" />
										<span className="font-medium">{stats.printing}</span>
										<span className="text-muted-foreground">en cours</span>
									</div>
								)}
								{stats.failed > 0 && (
									<div className="flex items-center gap-1.5 text-sm">
										<AlertCircle className="h-4 w-4 text-red-500" />
										<span className="font-medium">{stats.failed}</span>
										<span className="text-muted-foreground">échoué(s)</span>
									</div>
								)}
							</div>
						)}
					</div>
					<Tabs value={statusFilter} onValueChange={setStatusFilter}>
						<TabsList>
							<TabsTrigger value="all">
								Tout{allJobs ? ` (${allJobs.length})` : ""}
							</TabsTrigger>
							<TabsTrigger value="active">
								Actif{stats ? ` (${stats.total})` : ""}
							</TabsTrigger>
							<TabsTrigger value="completed">Terminés</TabsTrigger>
							<TabsTrigger value="failed">Échoués{stats && stats.failed > 0 ? ` (${stats.failed})` : ""}</TabsTrigger>
							<TabsTrigger value="cancelled">Annulés</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
				<div className="flex-1 overflow-y-auto">
					{isPending ? (
						<div className="flex items-center justify-center h-48">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : filteredJobs.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
							<Printer className="h-10 w-10 mb-3 opacity-40" />
							<p className="text-sm font-medium">Aucun travail d'impression</p>
							<p className="text-xs mt-1">
								{statusFilter === "all"
									? "Envoyez un design à l'impression depuis le Designer de cartes"
									: "Aucun travail avec ce statut"}
							</p>
						</div>
					) : (
						<div className="divide-y">
							{filteredJobs.map((job) => {
								const cfg = STATUS_CONFIG[job.status as JobStatus];
								const Icon = cfg.icon;
								return (
									<div
										key={job._id}
										className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors"
									>
										<div className={`flex-shrink-0 ${cfg.color}`}>
											<Icon className={`h-5 w-5 ${job.status === "printing" ? "animate-pulse" : ""}`} />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-medium text-sm truncate">{job.designName}</span>
												{job.priority !== "normal" && (
													<Badge variant="outline" className="text-[10px] px-1.5 py-0">
														{PRIORITY_LABELS[job.priority]}
													</Badge>
												)}
												{job.batchId && (
													<Badge variant="secondary" className="text-[10px] px-1.5 py-0">Lot</Badge>
												)}
											</div>
											<div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
												{job.profileName && <span className="truncate">{job.profileName}</span>}
												{job.profileName && <span>·</span>}
												<span>{job.copies} copie{job.copies > 1 ? "s" : ""}</span>
												{job.printDuplex && (<><span>·</span><span>Recto-verso</span></>)}
												<span>·</span>
												<span>{formatRelativeTime(job.queuedAt)}</span>
											</div>
											{job.errorMessage && (
												<p className="text-xs text-red-500 mt-0.5 truncate">{job.errorMessage}</p>
											)}
										</div>
										<Badge variant={cfg.badgeVariant} className="text-xs flex-shrink-0">{cfg.label}</Badge>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
													<ChevronDown className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{job.status === "queued" && (
													<DropdownMenuItem onClick={() => handleCancel(job._id)}>
														<X className="h-4 w-4 mr-2" />Annuler
													</DropdownMenuItem>
												)}
												{job.status === "failed" && (
													<DropdownMenuItem onClick={() => handleRetry(job._id)}>
														<RefreshCw className="h-4 w-4 mr-2" />Réessayer
													</DropdownMenuItem>
												)}
												{(job.status === "completed" || job.status === "cancelled" || job.status === "failed") && (
													<DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemove(job._id)}>
														<Trash2 className="h-4 w-4 mr-2" />Supprimer
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								);
							})}
						</div>
					)}
				</div>
				<BatchPrintDialog open={showNewPrint} onOpenChange={setShowNewPrint} />
			</div>
			<div className="w-72 border-l flex-shrink-0 bg-muted/30">
				<PrinterPanel />
			</div>
		</div>
	);
}
