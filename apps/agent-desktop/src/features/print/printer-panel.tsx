import {
	AlertCircle,
	Check,
	Loader2,
	MonitorSmartphone,
	Plug2,
	Printer,
	RefreshCw,
	Settings2,
	TestTube,
	Unplug,
	WifiOff,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { Separator } from "@workspace/ui/components/separator";
import type { PrinterInfo } from "./use-printer";
import { usePrinter } from "./use-printer";

const STATUS_MAP: Record<
	PrinterInfo["status"],
	{ label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
	ready: { label: "Prêt", color: "text-green-500", variant: "secondary" },
	busy: { label: "Impression...", color: "text-blue-500", variant: "default" },
	error: { label: "Erreur", color: "text-red-500", variant: "destructive" },
	offline: { label: "Hors ligne", color: "text-muted-foreground", variant: "outline" },
};

export function PrinterPanel() {
	const {
		printers,
		selectedPrinter,
		isDiscovering,
		error,
		discover,
		connect,
		disconnect,
		testPrint,
		isTauri,
	} = usePrinter();

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-4 pb-3 space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold flex items-center gap-2">
						<Settings2 className="h-4 w-4" />
						Imprimantes
					</h2>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={discover}
						disabled={isDiscovering}
					>
						<RefreshCw className={`h-3.5 w-3.5 ${isDiscovering ? "animate-spin" : ""}`} />
					</Button>
				</div>

				{!isTauri && (
					<div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
						<MonitorSmartphone className="h-4 w-4 text-amber-500 flex-shrink-0" />
						<p className="text-[11px] text-amber-600 dark:text-amber-400 leading-tight">
							Mode navigateur — imprimantes simulées. Lancez en mode desktop (Tauri) pour connecter de vraies imprimantes Evolis.
						</p>
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
						<AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
						<p className="text-[11px] text-destructive leading-tight">{error}</p>
					</div>
				)}
			</div>

			<Separator />

			{/* Printer list */}
			<div className="flex-1 overflow-y-auto">
				{isDiscovering && printers.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
						<Loader2 className="h-5 w-5 animate-spin mb-2" />
						<p className="text-xs">Recherche d'imprimantes...</p>
					</div>
				) : printers.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
						<Printer className="h-8 w-8 opacity-30 mb-2" />
						<p className="text-xs font-medium">Aucune imprimante détectée</p>
						<Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={discover}>
							<RefreshCw className="h-3 w-3 mr-1.5" />
							Relancer la recherche
						</Button>
					</div>
				) : (
					<div className="p-2 space-y-1.5">
						{printers.map((printer) => {
							const statusCfg = STATUS_MAP[printer.status];
							const isSelected = printer.id === selectedPrinter?.id;
							return (
								<div
									key={printer.id}
									className={`rounded-lg border p-3 transition-colors ${
										isSelected
											? "border-primary bg-primary/5"
											: "border-border hover:bg-muted/50"
									}`}
								>
									{/* Printer header */}
									<div className="flex items-start gap-2.5">
										<div className={`mt-0.5 ${statusCfg.color}`}>
											{printer.status === "offline" ? (
												<WifiOff className="h-4 w-4" />
											) : (
												<Printer className={`h-4 w-4 ${printer.status === "busy" ? "animate-pulse" : ""}`} />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium truncate">
													{printer.name}
												</span>
												<Badge variant={statusCfg.variant} className="text-[10px] px-1.5 py-0">
													{statusCfg.label}
												</Badge>
											</div>
											<p className="text-[11px] text-muted-foreground mt-0.5">
												{printer.model} · S/N {printer.serial}
											</p>
										</div>
									</div>

									{/* Capabilities */}
									<div className="flex gap-1.5 mt-2 flex-wrap">
										{printer.supportsDuplex && (
											<Badge variant="outline" className="text-[10px] px-1.5 py-0">
												Recto-verso
											</Badge>
										)}
										{printer.supportsMagStripe && (
											<Badge variant="outline" className="text-[10px] px-1.5 py-0">
												Piste magnétique
											</Badge>
										)}
										{printer.supportsLamination && (
											<Badge variant="outline" className="text-[10px] px-1.5 py-0">
												Lamination
											</Badge>
										)}
									</div>

									{/* Ribbon info */}
									{printer.ribbonType && printer.ribbonRemaining != null && (
										<div className="mt-2.5 space-y-1">
											<div className="flex items-center justify-between text-[11px]">
												<span className="text-muted-foreground">
													Ruban {printer.ribbonType}
												</span>
												<span className={`font-medium ${
													printer.ribbonRemaining < 20
														? "text-red-500"
														: printer.ribbonRemaining < 50
															? "text-amber-500"
															: "text-green-500"
												}`}>
													{printer.ribbonRemaining}%
												</span>
											</div>
											<Progress
												value={printer.ribbonRemaining}
												className="h-1.5"
											/>
										</div>
									)}

									{/* Actions */}
									<div className="flex items-center gap-1.5 mt-3">
										{printer.isConnected ? (
											<>
												<Button
													variant="outline"
													size="sm"
													className="text-xs h-7 flex-1"
													onClick={disconnect}
												>
													<Unplug className="h-3 w-3 mr-1" />
													Déconnecter
												</Button>
												<Button
													variant="secondary"
													size="sm"
													className="text-xs h-7 flex-1"
													onClick={testPrint}
													disabled={printer.status === "busy"}
												>
													{printer.status === "busy" ? (
														<>
															<Loader2 className="h-3 w-3 mr-1 animate-spin" />
															Test...
														</>
													) : (
														<>
															<TestTube className="h-3 w-3 mr-1" />
															Impression test
														</>
													)}
												</Button>
											</>
										) : (
											<Button
												variant="default"
												size="sm"
												className="text-xs h-7 w-full"
												onClick={() => connect(printer.id)}
												disabled={printer.status === "offline"}
											>
												<Plug2 className="h-3 w-3 mr-1" />
												{printer.status === "offline"
													? "Hors ligne"
													: "Connecter"}
											</Button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Footer — connected printer summary */}
			{selectedPrinter && (
				<>
					<Separator />
					<div className="p-3 flex items-center gap-2 bg-green-500/5">
						<Check className="h-4 w-4 text-green-500 flex-shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium truncate">
								{selectedPrinter.name}
							</p>
							<p className="text-[10px] text-muted-foreground">
								Connectée · Prête à imprimer
							</p>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
