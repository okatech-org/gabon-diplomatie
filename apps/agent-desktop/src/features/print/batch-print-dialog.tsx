import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { CheckCircle2, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { useOrg } from "@/components/org/org-provider";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";

interface BatchPrintDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function BatchPrintDialog({ open, onOpenChange }: BatchPrintDialogProps) {
	const { activeOrgId } = useOrg();

	// Step 1: select design, Step 2: configure & submit
	const [step, setStep] = useState<1 | 2>(1);
	const [selectedDesignId, setSelectedDesignId] = useState<Id<"cardDesigns"> | null>(null);
	const [copies, setCopies] = useState(1);
	const [duplex, setDuplex] = useState(false);
	const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<{ batchId: string; count: number } | null>(null);

	const { data: designs } = useAuthenticatedConvexQuery(
		api.functions.cardDesigns.listByOrg,
		activeOrgId ? { orgId: activeOrgId } : "skip",
	);

	const createSingle = useMutation(api.functions.printJobs.create);

	const selectedDesign = designs?.find((d) => d._id === selectedDesignId);

	const handleReset = () => {
		setStep(1);
		setSelectedDesignId(null);
		setCopies(1);
		setDuplex(false);
		setPriority("normal");
		setResult(null);
	};

	const handleClose = () => {
		onOpenChange(false);
		setTimeout(handleReset, 300);
	};

	const handleSubmitSample = async () => {
		if (!selectedDesign || !activeOrgId) return;
		setIsSubmitting(true);
		try {
			await createSingle({
				designId: selectedDesign._id,
				designName: selectedDesign.name,
				designVersion: selectedDesign.version,
				copies,
				printDuplex: duplex,
				priority,
				orgId: activeOrgId,
			});
			setResult({ batchId: "single", count: 1 });
		} catch (err) {
			console.error("Failed to create print job:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				{result ? (
					// Success state
					<div className="flex flex-col items-center gap-4 py-6">
						<CheckCircle2 className="h-12 w-12 text-green-500" />
						<div className="text-center">
							<p className="font-medium text-lg">
								{result.count} travail{result.count > 1 ? "x" : ""} ajouté{result.count > 1 ? "s" : ""}
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								Les impressions ont été ajoutées à la file d'attente
							</p>
						</div>
						<Button onClick={handleClose}>Fermer</Button>
					</div>
				) : step === 1 ? (
					// Step 1: Select design
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Printer className="h-5 w-5" />
								Nouvelle impression
							</DialogTitle>
							<DialogDescription>
								Sélectionnez un design de carte à imprimer
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-2 max-h-64 overflow-y-auto pt-2">
							{!designs ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							) : designs.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									Aucun design disponible. Créez-en un dans le Designer de cartes.
								</p>
							) : (
								designs.map((d) => (
									<button
										type="button"
										key={d._id}
										className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-muted/50 ${
											selectedDesignId === d._id
												? "border-primary bg-primary/5"
												: "border-border"
										}`}
										onClick={() => setSelectedDesignId(d._id)}
									>
										{/* Mini card preview placeholder */}
										<div
											className="w-16 h-10 rounded border flex-shrink-0 flex items-center justify-center text-[8px] text-muted-foreground overflow-hidden"
											style={{ backgroundColor: d.backgroundColor }}
										>
											{d.frontElements.length > 0
												? `${d.frontElements.length} éléments`
												: "Vide"}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">{d.name}</p>
											<p className="text-xs text-muted-foreground">
												v{d.version} · {d.printDuplex ? "Recto-verso" : "Recto seul"}
											</p>
										</div>
										{selectedDesignId === d._id && (
											<CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
										)}
									</button>
								))
							)}
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={handleClose}>
								Annuler
							</Button>
							<Button
								disabled={!selectedDesignId}
								onClick={() => setStep(2)}
							>
								Suivant
							</Button>
						</div>
					</>
				) : (
					// Step 2: Configure print settings
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Printer className="h-5 w-5" />
								Paramètres d'impression
							</DialogTitle>
							<DialogDescription>
								Configurez l'impression de « {selectedDesign?.name} »
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 pt-2">
							{/* Copies */}
							<div className="flex items-center justify-between">
								<Label htmlFor="batch-copies">Nombre de copies</Label>
								<Input
									id="batch-copies"
									type="number"
									min={1}
									max={100}
									value={copies}
									onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
									className="w-20 text-center"
								/>
							</div>

							{/* Duplex */}
							<div className="flex items-center justify-between">
								<Label htmlFor="batch-duplex">Impression recto-verso</Label>
								<Switch
									id="batch-duplex"
									checked={duplex}
									onCheckedChange={setDuplex}
								/>
							</div>

							{/* Priority */}
							<div className="flex items-center justify-between">
								<Label>Priorité</Label>
								<Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="normal">Normale</SelectItem>
										<SelectItem value="high">Haute</SelectItem>
										<SelectItem value="urgent">Urgente</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<p className="text-xs text-muted-foreground">
								Ceci crée une impression d'épreuve sans données de profil.
								L'impression par lot avec données personnalisées sera disponible
								depuis le registre consulaire.
							</p>

							{/* Actions */}
							<div className="flex justify-between pt-2">
								<Button variant="ghost" onClick={() => setStep(1)}>
									Retour
								</Button>
								<div className="flex gap-2">
									<Button variant="outline" onClick={handleClose}>
										Annuler
									</Button>
									<Button
										onClick={handleSubmitSample}
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
												Envoi...
											</>
										) : (
											"Envoyer à l'impression"
										)}
									</Button>
								</div>
							</div>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
