import { createRequestHandler } from "react-router";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

// Baseline security response headers. These are conservative defaults that
// work for the starter template; tune them (especially CSP) as the app grows.
const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
	"Cross-Origin-Opener-Policy": "same-origin",
	"X-DNS-Prefetch-Control": "off",
};

function applySecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!headers.has(name)) {
			headers.set(name, value);
		}
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export default {
	async fetch(request, env, ctx) {
		const response = await requestHandler(request, {
			cloudflare: { env, ctx },
		});
		return applySecurityHeaders(response);
	},
} satisfies ExportedHandler<Env>;
