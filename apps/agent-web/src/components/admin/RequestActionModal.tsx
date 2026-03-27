"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getLocalized } from "@convex/lib/utils";
import type { LocalizedString } from "@convex/lib/validators";
import {
	AlertTriangle,
	CreditCard,
	FileWarning,
	HelpCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useConvexMutationQuery } from "@/integrations/convex/hooks";

// ─── Types ──────────────────────────────────────────────────────────

interface FormSchemaField {
	id: string;
	type?: string;
	label?: LocalizedString;
	description?: LocalizedString;
	options?: Array<{ value: string; label: LocalizedString }>;
	required?: boolean;
}

interface FormSchemaSection {
	id: string;
	title?: LocalizedString;
	description?: LocalizedString;
	fields?: FormSchemaField[];
}

interface FormSchema {
	sections?: FormSchemaSection[];
	joinedDocuments?: Array<{
		type: string;
		label: LocalizedString;
		required: boolean;
	}>;
}

// ─── Action Types ───────────────────────────────────────────────────

const ACTION_TYPES = [
	{
		value: "upload_document",
		label: "Documents manquants",
		description: "Le citoyen doit fournir des documents supplémentaires",
		icon: FileWarning,
	},
	{
		value: "complete_info",
		label: "Informations à modifier",
		description:
			"Le citoyen doit compléter ou corriger des champs du formulaire",
		icon: HelpCircle,
	},
	{
		value: "make_payment",
		label: "Paiement requis",
		description: "Le citoyen doit effectuer un paiement",
		icon: CreditCard,
	},
] as const;

type ActionType = (typeof ACTION_TYPES)[number]["value"];

// ─── Props ──────────────────────────────────────────────────────────

interface RequestActionModalProps {
	requestId: Id<"requests">;
	formSchema?: FormSchema;
	formData?: Record<string, unknown>;
	onSuccess?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────

export function RequestActionModal({
	requestId,
	formSchema,
	formData,
	onSuccess,
}: RequestActionModalProps) {
	const { i18n } = useTranslation();
	const lang = i18n.language;

	const [open, setOpen] = useState(false);
	const [type, setType] = useState<ActionType>("upload_document");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Selected fields for complete_info
	const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
	// Selected document types for upload_document
	const [selectedDocTypes, setSelectedDocTypes] = useState<Set<string>>(
		new Set(),
	);

	const { mutateAsync: setActionRequired } = useConvexMutationQuery(
		api.functions.requests.setActionRequired,
	);

	// Build flat list of all form fields from schema
	const allFields = useMemo(() => {
		if (!formSchema?.sections) return [];
		const fields: Array<{
			fieldPath: string;
			sectionTitle: string;
			field: FormSchemaField;
		}> = [];
		for (const section of formSchema.sections) {
			const sectionTitle = getLocalized(section.title, lang) || section.id;
			for (const field of section.fields || []) {
				fields.push({
					fieldPath: `${section.id}.${field.id}`,
					sectionTitle,
					field,
				});
			}
		}
		return fields;
	}, [formSchema, lang]);

	// Get list of required documents from formSchema
	const requiredDocs = useMemo(() => {
		return formSchema?.joinedDocuments || [];
	}, [formSchema]);

	// Get current value for a field path from formData
	const getFieldCurrentValue = (fieldPath: string): unknown => {
		if (!formData) return undefined;
		const [sectionId, fieldId] = fieldPath.split(".");
		const section = formData[sectionId];
		if (section && typeof section === "object" && !Array.isArray(section)) {
			return (section as Record<string, unknown>)[fieldId];
		}
		return undefined;
	};

	const toggleField = (fieldPath: string) => {
		setSelectedFields((prev) => {
			const next = new Set(prev);
			if (next.has(fieldPath)) {
				next.delete(fieldPath);
			} else {
				next.add(fieldPath);
			}
			return next;
		});
	};

	const toggleDocType = (docType: string) => {
		setSelectedDocTypes((prev) => {
			const next = new Set(prev);
			if (next.has(docType)) {
				next.delete(docType);
			} else {
				next.add(docType);
			}
			return next;
		});
	};

	const handleSubmit = async () => {
		if (!message.trim()) {
			toast.error("Veuillez saisir un message pour le citoyen");
			return;
		}

		if (type === "complete_info" && selectedFields.size === 0) {
			toast.error("Veuillez sélectionner au moins un champ à modifier");
			return;
		}

		if (type === "upload_document" && selectedDocTypes.size === 0) {
			toast.error(
				"Veuillez sélectionner au moins un type de document manquant",
			);
			return;
		}

		setIsSubmitting(true);
		try {
			// Build rich field metadata
			const fields =
				type === "complete_info"
					? allFields
							.filter((f) => selectedFields.has(f.fieldPath))
							.map((f) => ({
								fieldPath: f.fieldPath,
								label: f.field.label,
								type: f.field.type,
								options: f.field.options,
								currentValue: getFieldCurrentValue(f.fieldPath),
							}))
					: undefined;

			// Build rich document types
			const documentTypes =
				type === "upload_document"
					? requiredDocs
							.filter((d) => selectedDocTypes.has(d.type))
							.map((d) => ({
								type: d.type,
								label: d.label,
								required: d.required,
							}))
					: undefined;

			await setActionRequired({
				requestId,
				type,
				message: message.trim(),
				fields,
				documentTypes,
			});
			toast.success("Action requise envoyée au citoyen");
			setOpen(false);
			setMessage("");
			setType("upload_document");
			setSelectedFields(new Set());
			setSelectedDocTypes(new Set());
			onSuccess?.();
		} catch (error) {
			console.error("Failed to set action required:", error);
			toast.error("Erreur lors de l'envoi de la demande");
		} finally {
			setIsSubmitting(false);
		}
	};

	const selectedType = ACTION_TYPES.find((t) => t.value === type);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<AlertTriangle className="h-4 w-4" />
					Demander une action
				</Button>
			</SheetTrigger>
			<SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Demander une action au citoyen</SheetTitle>
					<SheetDescription>
						Le citoyen sera notifié et verra un message dans sa demande lui
						indiquant l'action à effectuer.
					</SheetDescription>
				</SheetHeader>

				<div className="space-y-4 py-4">
					{/* Action type selection */}
					<div className="space-y-2">
						<Label>Type d'action requise</Label>
						<Select
							value={type}
							onValueChange={(v) => {
								setType(v as ActionType);
								setSelectedFields(new Set());
								setSelectedDocTypes(new Set());
							}}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ACTION_TYPES.map((actionType) => (
									<SelectItem key={actionType.value} value={actionType.value}>
										<div className="flex items-center gap-2">
											<actionType.icon className="h-4 w-4 text-muted-foreground" />
											<span>{actionType.label}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedType && (
							<p className="text-xs text-muted-foreground">
								{selectedType.description}
							</p>
						)}
					</div>

					{/* ─── Field selector for complete_info ─── */}
					{type === "complete_info" && (
						<div className="space-y-2">
							<Label>
								Champs à modifier{" "}
								<span className="text-muted-foreground font-normal">
									({selectedFields.size} sélectionné
									{selectedFields.size > 1 ? "s" : ""})
								</span>
							</Label>
							{allFields.length > 0 ? (
								<div className="rounded-lg border max-h-52 overflow-y-auto">
									{(() => {
										let currentSection = "";
										return allFields.map((item) => {
											const showSection = item.sectionTitle !== currentSection;
											if (showSection) currentSection = item.sectionTitle;
											return (
												<div key={item.fieldPath}>
													{showSection && (
														<div className="bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0">
															{item.sectionTitle}
														</div>
													)}
													<label className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 cursor-pointer transition-colors">
														<Checkbox
															checked={selectedFields.has(item.fieldPath)}
															onCheckedChange={() =>
																toggleField(item.fieldPath)
															}
														/>
														<div className="flex-1 min-w-0">
															<span className="text-sm">
																{getLocalized(item.field.label, lang) ||
																	item.field.id}
															</span>
															{item.field.type && (
																<span className="ml-2 text-xs text-muted-foreground">
																	({item.field.type})
																</span>
															)}
														</div>
													</label>
												</div>
											);
										});
									})()}
								</div>
							) : (
								<p className="text-xs text-muted-foreground italic">
									Aucun champ disponible dans le formulaire de ce service.
								</p>
							)}
						</div>
					)}

					{/* ─── Document selector for upload_document ─── */}
					{type === "upload_document" && (
						<div className="space-y-2">
							<Label>
								Documents manquants{" "}
								<span className="text-muted-foreground font-normal">
									({selectedDocTypes.size} sélectionné
									{selectedDocTypes.size > 1 ? "s" : ""})
								</span>
							</Label>
							{requiredDocs.length > 0 ? (
								<div className="rounded-lg border max-h-52 overflow-y-auto">
									{requiredDocs.map((doc) => (
										<label
											key={doc.type}
											className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 cursor-pointer transition-colors border-b last:border-0"
										>
											<Checkbox
												checked={selectedDocTypes.has(doc.type)}
												onCheckedChange={() => toggleDocType(doc.type)}
											/>
											<div className="flex-1 min-w-0">
												<span className="text-sm">
													{getLocalized(doc.label, lang) || doc.type}
												</span>
												{doc.required && (
													<span className="ml-2 text-xs text-amber-600">
														Obligatoire
													</span>
												)}
											</div>
										</label>
									))}
								</div>
							) : (
								<p className="text-xs text-muted-foreground italic">
									Aucun document requis configuré pour ce service.
								</p>
							)}
						</div>
					)}

					{/* Message */}
					<div className="space-y-2">
						<Label htmlFor="message">Message pour le citoyen</Label>
						<Textarea
							id="message"
							placeholder="Expliquez clairement ce que le citoyen doit faire..."
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={4}
						/>
						<p className="text-xs text-muted-foreground">
							Soyez précis et expliquez exactement ce qui est attendu.
						</p>
					</div>
				</div>

				<SheetFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isSubmitting}
					>
						Annuler
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Envoi..." : "Envoyer la demande"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
