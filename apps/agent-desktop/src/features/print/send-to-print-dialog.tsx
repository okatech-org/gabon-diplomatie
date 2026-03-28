import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Printer } from "lucide-react";
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

interface SendToPrintDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	designId: Id<"cardDesigns">;
	designName: string;
	designVersion: number;
	printDuplex: boolean;
	orgId: Id<"orgs">;
}

export function SendToPrintDialog({
	open,
	onOpenChange,
	designId,
	designName,
	designVersion,
	printDuplex,
	orgId,
}: SendToPrintDialogProps) {
	const [copies, setCopies] = useState(1);
	const [duplex, setDuplex] = useState(printDuplex);
	const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createJob = useMutation(api.functions.printJobs.create);

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			await createJob({
				designId,
				designName,
				designVersion,
				copies,
				printDuplex: duplex,
				priority,
				orgId,
			});
			onOpenChange(false);
		} catch (err) {
			console.error("Failed to create print job:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Printer className="h-5 w-5" />
						Envoyer à l'impression
					</DialogTitle>
					<DialogDescription>
						Ajouter « {designName} » à la file d'impression
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 pt-2">
					{/* Copies */}
					<div className="flex items-center justify-between">
						<Label htmlFor="copies">Nombre de copies</Label>
						<Input
							id="copies"
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
						<Label htmlFor="duplex">Impression recto-verso</Label>
						<Switch
							id="duplex"
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
						Cette impression utilise le design sans données de profil. Pour imprimer
						des cartes personnalisées, utilisez l'impression par lot depuis le registre consulaire.
					</p>

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Annuler
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? "Envoi..." : "Envoyer à l'impression"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
