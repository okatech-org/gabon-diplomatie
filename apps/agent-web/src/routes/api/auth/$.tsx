import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/auth-server";

// HTTP/1-only headers that crash the HTTP/2 dev server (HTTPS enables H2)
const FORBIDDEN_H2_HEADERS = [
	"transfer-encoding",
	"connection",
	"keep-alive",
	"upgrade",
];

async function safeHandler(request: Request): Promise<Response> {
	try {
		const response = await handler(request);

		// Buffer the body — streaming responses break under Vite's HTTP/2 server
		const body = await response.arrayBuffer();

		// Clone headers, preserving multi-value Set-Cookie
		const headers = new Headers();
		for (const [key, value] of response.headers.entries()) {
			if (!FORBIDDEN_H2_HEADERS.includes(key.toLowerCase())) {
				headers.append(key, value);
			}
		}

		return new Response(body, {
			status: response.status,
			headers,
		});
	} catch (error) {
		console.error("[auth] handler error:", error);
		return Response.json(
			{ error: "Internal auth error" },
			{ status: 502 },
		);
	}
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }: { request: Request }) => safeHandler(request),
			POST: ({ request }: { request: Request }) => safeHandler(request),
		},
	},
});
