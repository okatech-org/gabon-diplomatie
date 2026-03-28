import { useCallback, useEffect, useState } from "react";

/**
 * Printer connection state — works in browser (simulated) and Tauri (real SDK).
 * In browser mode, we simulate discovery with mock printers.
 * In Tauri mode, this will call Rust commands via @tauri-apps/api.
 */

export interface PrinterInfo {
	id: string;
	name: string;
	model: string;
	serial: string;
	status: "ready" | "busy" | "error" | "offline";
	isConnected: boolean;
	// Capabilities
	supportsDuplex: boolean;
	supportsMagStripe: boolean;
	supportsLamination: boolean;
	// Ribbon info
	ribbonType?: string;
	ribbonRemaining?: number; // percentage
}

export interface PrinterState {
	printers: PrinterInfo[];
	selectedPrinterId: string | null;
	isDiscovering: boolean;
	error: string | null;
}

// Tauri v2 detection: check for __TAURI_INTERNALS__ (injected by Tauri runtime)
// or the tauri:// protocol, or the user-agent containing "Tauri"
const isTauri =
	typeof window !== "undefined" &&
	("__TAURI_INTERNALS__" in window ||
		window.location.protocol === "tauri:" ||
		navigator.userAgent.includes("Tauri"));

// Mock printers for browser development
const MOCK_PRINTERS: PrinterInfo[] = [
	{
		id: "evolis-primacy-2-001",
		name: "Evolis Primacy 2 (USB)",
		model: "Primacy 2",
		serial: "PKP2-00142",
		status: "ready",
		isConnected: false,
		supportsDuplex: true,
		supportsMagStripe: true,
		supportsLamination: false,
		ribbonType: "YMCKO 300",
		ribbonRemaining: 72,
	},
	{
		id: "evolis-primacy-2-002",
		name: "Evolis Primacy 2 (Réseau)",
		model: "Primacy 2",
		serial: "PKP2-00287",
		status: "offline",
		isConnected: false,
		supportsDuplex: true,
		supportsMagStripe: false,
		supportsLamination: true,
		ribbonType: "YMCKO 200",
		ribbonRemaining: 34,
	},
];

export function usePrinter() {
	const [state, setState] = useState<PrinterState>({
		printers: [],
		selectedPrinterId: null,
		isDiscovering: false,
		error: null,
	});

	const selectedPrinter = state.printers.find((p) => p.id === state.selectedPrinterId) ?? null;

	const discover = useCallback(async () => {
		setState((s) => ({ ...s, isDiscovering: true, error: null }));

		if (isTauri) {
			// TODO: Call Tauri command — invoke("plugin:evolis|discover_printers")
			setState((s) => ({
				...s,
				isDiscovering: false,
				error: "Mode Tauri : SDK Evolis non encore intégré",
			}));
		} else {
			// Browser simulation
			await new Promise((r) => setTimeout(r, 1200));
			setState((s) => ({
				...s,
				printers: MOCK_PRINTERS,
				isDiscovering: false,
			}));
		}
	}, []);

	const connect = useCallback(async (printerId: string) => {
		setState((s) => ({ ...s, error: null }));

		if (isTauri) {
			// TODO: invoke("plugin:evolis|connect_printer", { printerId })
			setState((s) => ({ ...s, error: "Mode Tauri : SDK Evolis non encore intégré" }));
			return;
		}

		// Browser simulation
		await new Promise((r) => setTimeout(r, 800));
		setState((s) => ({
			...s,
			printers: s.printers.map((p) =>
				p.id === printerId
					? { ...p, isConnected: true, status: "ready" as const }
					: { ...p, isConnected: false },
			),
			selectedPrinterId: printerId,
		}));
	}, []);

	const disconnect = useCallback(async () => {
		if (isTauri) {
			// TODO: invoke("plugin:evolis|disconnect_printer")
		}
		setState((s) => ({
			...s,
			printers: s.printers.map((p) => ({ ...p, isConnected: false })),
			selectedPrinterId: null,
		}));
	}, []);

	const testPrint = useCallback(async () => {
		if (!state.selectedPrinterId) return;
		setState((s) => ({
			...s,
			printers: s.printers.map((p) =>
				p.id === s.selectedPrinterId ? { ...p, status: "busy" as const } : p,
			),
		}));

		if (isTauri) {
			// TODO: invoke("plugin:evolis|test_print")
		}

		// Simulate printing
		await new Promise((r) => setTimeout(r, 2500));
		setState((s) => ({
			...s,
			printers: s.printers.map((p) =>
				p.id === s.selectedPrinterId ? { ...p, status: "ready" as const } : p,
			),
		}));
	}, [state.selectedPrinterId]);

	// Auto-discover on mount
	useEffect(() => {
		discover();
	}, [discover]);

	return {
		...state,
		selectedPrinter,
		discover,
		connect,
		disconnect,
		testPrint,
		isTauri,
	};
}
