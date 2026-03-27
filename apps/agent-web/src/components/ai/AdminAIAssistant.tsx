"use client";
import { useLocation } from "@tanstack/react-router";
import {
	Bot,
	ExternalLink,
	Loader2,
	MessageSquare,
	Mic,
	Minus,
	Plus,
	Send,
	User,
	ShieldCheck,
	FileEdit,
	CalendarDays,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useOrg } from "@/components/org/org-provider";
import {
	type AdminAIAction,
	type Message,
	useAdminAIChat,
} from "./useAdminAIChat";
import { useAdminVoiceChat } from "./useAdminVoiceChat";
import { VoiceButton, VoiceChatContent } from "./VoiceButton";

// Admin contextual suggestions based on current page
const getAdminSuggestions = (pathname: string): string[] => {
	const baseSuggestions = ["Résumé de la situation", "Demandes en attente"];

	if (pathname.includes("/admin/requests")) {
		return [
			"Demandes en attente de traitement",
			"Statistiques des demandes",
			"Demandes soumises aujourd'hui",
			...baseSuggestions,
		];
	}

	if (pathname.includes("/admin/consular-registry")) {
		return [
			"Statistiques du registre",
			"Cartes à imprimer",
			"Rechercher un citoyen",
			...baseSuggestions,
		];
	}

	if (pathname.includes("/admin/appointments")) {
		return [
			"Rendez-vous du jour",
			"Rendez-vous à confirmer",
			"Planning de la semaine",
			...baseSuggestions,
		];
	}

	if (pathname.includes("/admin/team")) {
		return [
			"Membres de l'équipe",
			"Qui est disponible ?",
			...baseSuggestions,
		];
	}

	if (pathname.includes("/admin/posts")) {
		return [
			"Publications récentes",
			"Rédiger une actualité",
			...baseSuggestions,
		];
	}

	if (pathname.includes("/admin/payments")) {
		return [
			"Paiements récents",
			"Total des recettes",
			...baseSuggestions,
		];
	}

	if (pathname.includes("/admin/settings")) {
		return [
			"Configuration actuelle",
			...baseSuggestions,
		];
	}

	if (pathname.includes("/admin/statistics")) {
		return [
			"Statistiques du mois",
			"Tendances des demandes",
			...baseSuggestions,
		];
	}

	// Default admin dashboard
	return [
		"Quelles sont les demandes en attente ?",
		"Résumé de la journée",
		...baseSuggestions,
	];
};

function ChatMessage({ message }: { message: Message }) {
	const isAssistant = message.role === "assistant";

	return (
		<div
			className={cn(
				"flex gap-3 p-3 rounded-lg",
				isAssistant ? "bg-muted/50" : "bg-primary/5",
			)}
		>
			<Avatar className="h-8 w-8 shrink-0">
				<AvatarFallback
					className={cn(
						isAssistant
							? "bg-emerald-600 text-white"
							: "bg-secondary",
					)}
				>
					{isAssistant ? (
						<Bot className="h-4 w-4" />
					) : (
						<User className="h-4 w-4" />
					)}
				</AvatarFallback>
			</Avatar>
			<div className="flex-1 space-y-1 overflow-hidden">
				<p className="text-sm font-medium">
					{isAssistant ? "Assistant Agent" : "Vous"}
				</p>
				{isAssistant ? (
					<div className="text-sm text-muted-foreground prose prose-sm prose-slate dark:prose-invert max-w-none break-words [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
						<Markdown>{message.content}</Markdown>
					</div>
				) : (
					<div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
						{message.content}
					</div>
				)}
			</div>
		</div>
	);
}

function ActionPreview({
	actions,
	onConfirm,
	onReject,
	isLoading,
}: {
	actions: AdminAIAction[];
	onConfirm: (action: AdminAIAction) => void;
	onReject: (action: AdminAIAction) => void;
	isLoading: boolean;
}) {
	const getActionLabel = (action: AdminAIAction) => {
		if (action.reason) return action.reason;

		switch (action.type) {
			case "updateRequestStatus":
				return `Changer statut → ${action.args.status}`;
			case "addNoteToRequest":
				return "Ajouter une note à la demande";
			case "assignRequest":
				return "Assigner la demande";
			case "manageAppointment":
				return `RDV: ${action.args.action}`;
			case "sendOrgMail":
				return `Envoyer: ${action.args.subject}`;
			case "navigateTo":
				return `Naviguer vers: ${action.args.route}`;
			default:
				return action.type;
		}
	};

	const getActionIcon = (action: AdminAIAction) => {
		switch (action.type) {
			case "updateRequestStatus":
				return <FileEdit className="h-4 w-4 text-blue-600" />;
			case "addNoteToRequest":
				return <MessageSquare className="h-4 w-4 text-amber-600" />;
			case "assignRequest":
				return <User className="h-4 w-4 text-violet-600" />;
			case "manageAppointment":
				return <CalendarDays className="h-4 w-4 text-green-600" />;
			case "sendOrgMail":
				return <Send className="h-4 w-4 text-sky-600" />;
			case "navigateTo":
				return <ExternalLink className="h-4 w-4 text-purple-600" />;
			default:
				return (
					<ExternalLink className="h-4 w-4 text-muted-foreground" />
				);
		}
	};

	return (
		<div className="border-t bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
			<div className="flex items-center gap-2">
				<Badge
					variant="outline"
					className="text-amber-700 border-amber-300"
				>
					Action(s) en attente de confirmation
				</Badge>
			</div>
			{actions.map((action, i) => (
				<div
					key={`${action.type}-${i}`}
					className="flex items-center justify-between bg-background rounded-md p-3 border border-amber-200"
				>
					<div className="flex items-center gap-2">
						{getActionIcon(action)}
						<span className="text-sm font-medium">
							{getActionLabel(action)}
						</span>
					</div>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => onReject(action)}
							disabled={isLoading}
						>
							Annuler
						</Button>
						<Button
							size="sm"
							variant="default"
							onClick={() => onConfirm(action)}
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Confirmer"
							)}
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}

function ChatInput({
	onSend,
	isLoading,
}: {
	onSend: (message: string) => void;
	isLoading: boolean;
}) {
	const [value, setValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSend = () => {
		if (value.trim() && !isLoading) {
			onSend(value.trim());
			setValue("");
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="border-t p-3">
			<div className="flex gap-2">
				<Textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Comment puis-je vous aider ?"
					className="min-h-[60px] max-h-[120px] resize-none"
					disabled={isLoading}
				/>
				<Button
					onClick={handleSend}
					disabled={!value.trim() || isLoading}
					size="icon"
					className="shrink-0 self-end"
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</Button>
			</div>
		</div>
	);
}

export function AdminAIAssistant() {
	const [open, setOpen] = useState(false);
	const location = useLocation();
	const { activeOrg } = useOrg();
	const {
		messages,
		isLoading,
		error,
		pendingActions,
		sendMessage,
		confirmAction,
		rejectAction,
		newConversation,
	} = useAdminAIChat();

	const voice = useAdminVoiceChat();

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const suggestions = getAdminSuggestions(location.pathname);

	// Auto-scroll to bottom
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	});

	return (
		<>
			{/* FAB - admin style */}
			<AnimatePresence>
				{!open && (
					<motion.div
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{
							type: "spring",
							damping: 20,
							stiffness: 300,
						}}
						className="fixed bottom-6 right-6 z-50"
					>
						<Button
							size="lg"
							className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-emerald-600 hover:bg-emerald-700"
							onClick={() => setOpen(true)}
							aria-label="Ouvrir l'assistant IA agent"
						>
							<Bot className="h-6 w-6" />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Chat Window */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{
							type: "spring",
							damping: 25,
							stiffness: 300,
						}}
						className="fixed bottom-0 right-0 w-full sm:w-[420px] sm:right-6 sm:bottom-6
						           h-[100dvh] sm:h-[min(600px,calc(100vh-100px))] rounded-none sm:rounded-2xl shadow-2xl z-50
						           bg-background border flex flex-col overflow-hidden"
					>
						{/* Header */}
						<div className="border-b px-4 py-3 flex items-center justify-between shrink-0 bg-emerald-600 text-white">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
									<ShieldCheck className="h-5 w-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-semibold">
										Assistant Agent
									</h2>
									<p className="text-xs text-white/70">
										{activeOrg?.name || "Consulat"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								{voice.isAvailable && (
									<VoiceButton
										isOpen={voice.isOpen}
										onClick={() => voice.isOpen ? voice.closeOverlay() : voice.openOverlay()}
										className="text-white hover:bg-white/20"
									/>
								)}
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={newConversation}
									title="Nouvelle conversation"
									className="text-white hover:bg-white/20"
								>
									<Plus className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setOpen(false)}
									title="Fermer"
									className="text-white hover:bg-white/20"
								>
									<Minus className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Messages Area — or Voice Overlay */}
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							{voice.isOpen ? (
								<VoiceChatContent
									state={voice.state}
									error={voice.error}
									onClose={voice.closeOverlay}
									pendingConfirmation={voice.pendingConfirmation}
									isConfirming={voice.isConfirming}
									onConfirm={voice.confirmPending}
									onReject={voice.rejectPending}
								/>
							) : messages.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-center p-4">
									<div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
										<ShieldCheck className="h-7 w-7 text-emerald-600" />
									</div>
									<h3 className="font-medium mb-2">
										Bonjour !
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Je suis l'assistant IA dédié aux agents
										consulaires. Je peux vous aider avec le
										traitement des demandes, le registre, les
										rendez-vous et plus encore.
									</p>
									{voice.isAvailable && (
										<Button
											variant="outline"
											size="sm"
											onClick={voice.openOverlay}
											className="mb-4 gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
										>
											<Mic className="h-4 w-4" />
											Mode vocal
										</Button>
									)}
									<div className="flex flex-wrap gap-2 justify-center">
										{suggestions.slice(0, 4).map((suggestion) => (
											<Badge
												key={suggestion}
												variant="secondary"
												className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
												onClick={() =>
													sendMessage(suggestion)
												}
											>
												{suggestion}
											</Badge>
										))}
									</div>
								</div>
							) : (
								<>
									{messages.map((msg) => (
									<ChatMessage key={msg.timestamp} message={msg} />
									))}
									{isLoading && (
										<div className="flex gap-3 p-3 rounded-lg bg-muted/50">
											<Avatar className="h-8 w-8 shrink-0">
												<AvatarFallback className="bg-emerald-600 text-white">
													<Bot className="h-4 w-4" />
												</AvatarFallback>
											</Avatar>
											<div className="flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
												<span className="text-sm text-muted-foreground">
													Analyse en cours...
												</span>
											</div>
										</div>
									)}
									<div ref={messagesEndRef} />
								</>
							)}

							{error && (
								<div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
									{error}
								</div>
							)}
						</div>

						{/* Actions Preview */}
						{pendingActions.length > 0 && (
							<ActionPreview
								actions={pendingActions}
								onConfirm={confirmAction}
								onReject={rejectAction}
								isLoading={isLoading}
							/>
						)}

						{/* Input — hidden when voice is active */}
						{!voice.isOpen && (
							<ChatInput
								onSend={sendMessage}
								isLoading={isLoading}
							/>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
