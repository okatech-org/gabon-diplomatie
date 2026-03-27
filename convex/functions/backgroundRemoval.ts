"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { removeBackgroundFromImageFile } from "remove.bg";

export interface BackgroundRemovalResult {
	success: boolean;
	imageUrl?: string;
	error?: string;
}

/**
 * Action to remove background from an image file (provided as base64 string).
 * This uses the `remove.bg` Node SDK.
 * 
 * IMPORTANT: This requires `REMOVEBG_API_KEY` to be set in the Convex Environment Variables.
 */
export const removeBackgroundFromFile = action({
	args: {
		fileBase64: v.string(),
		fileName: v.string(),
	},
	handler: async (_: any, args: { fileBase64: string; fileName: string }): Promise<BackgroundRemovalResult> => {
		try {
			// Dynamically import fs/path modules as they are only available in a Node environment
			const fs = await import("fs");
			const path = await import("path");
			const { writeFile } = await import("fs/promises");

			// We write the file temporarily to /tmp since removeBackgroundFromImageFile requires a file path
			const tempDir = "/tmp";
			const tempFileName = `bg-removal-${Date.now()}-${args.fileName}`;
			const tempFilePath = path.join(tempDir, tempFileName);

			// Decode base64 to buffer and write to disk
			const buffer = Buffer.from(args.fileBase64, "base64");
			await writeFile(tempFilePath, buffer);

			// Call remove.bg API
			const data = await removeBackgroundFromImageFile({
				path: tempFilePath,
				apiKey: process.env.REMOVEBG_API_KEY!,
				size: "preview",
				type: "person",
				format: "png",
			});

			// Cleanup the temporary file
			try {
				fs.unlinkSync(tempFilePath);
			} catch (cleanupError) {
				console.warn(
					"Erreur lors du nettoyage du fichier temporaire:",
					cleanupError,
				);
			}

			// Format response to data URL
			if (data && typeof data === "object" && "base64img" in data) {
				const dataUrl = `data:image/png;base64,${data.base64img}`;
				return {
					success: true,
					imageUrl: dataUrl,
				};
			}

			return {
				success: false,
				error: "Aucune image retournée par Remove.bg",
			};
		} catch (error) {
			console.error("Erreur lors du traitement du fichier avec Remove.bg:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Erreur inconnue",
			};
		}
	},
});
