import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { authComponent, createAuth } from "./betterAuth/auth";
import { hashPassword } from "better-auth/crypto";

const http = httpRouter();

// Better Auth route handlers
authComponent.registerRoutes(http, createAuth);

// ============================================================================
// DEV-ONLY: Passwordless sign-in for the Dev Account Switcher
// Sets a temp password → calls Better Auth sign-in → clears the password.
// ============================================================================
http.route({
  path: "/dev/sign-in",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // ── Safety guard: only active when DEV_SIGNIN_ENABLED=true ──
    if (process.env.DEV_SIGNIN_ENABLED !== "true") {
      return new Response("Dev sign-in not enabled", { status: 403 });
    }

    const origin = request.headers.get("origin") ?? "";
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Credentials": "true",
    };

    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    try {
      // 1. Find the user
      const usersResult = await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: "user",
          where: [{ field: "email", value: email }],
          paginationOpts: { numItems: 1, cursor: null },
        },
      );
      const users = ((usersResult as any)?.page ?? usersResult ?? []) as any[];
      if (users.length === 0) {
        return new Response(
          JSON.stringify({ error: `No user found for ${email}` }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      const user = users[0];
      const userId = String(user._id ?? user.id);

      // 2. Find or create a credential account with a temp password
      const tempPassword = "__dev_temp_" + crypto.randomUUID();
      const accountsResult = await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: "account",
          where: [
            { field: "userId", value: userId },
            { field: "providerId", value: "credential" },
          ],
          paginationOpts: { numItems: 1, cursor: null },
        },
      );
      const accounts = ((accountsResult as any)?.page ?? accountsResult ?? []) as any[];

      // Hash the temp password using Better Auth's scrypt hasher
      const hashedPassword = await hashPassword(tempPassword);

      if (accounts.length > 0) {
        // Update existing credential account with temp password
        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: "account",
            where: [{ field: "_id", value: accounts[0]._id ?? accounts[0].id }],
            update: { password: hashedPassword },
          },
        } as any);
      } else {
        // Create a credential account
        await ctx.runMutation(components.betterAuth.adapter.create, {
          input: {
            model: "account",
            data: {
              userId,
              providerId: "credential",
              accountId: userId,
              password: hashedPassword,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          },
        } as any);
      }

      // 3. Call Better Auth's sign-in handler with the temp password
      const auth = createAuth(ctx);
      const siteUrl = process.env.SITE_URL ?? "https://localhost:3000";
      const signInRequest = new Request(`${siteUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": origin || siteUrl,
          "User-Agent": request.headers.get("user-agent") ?? "",
        },
        body: JSON.stringify({ email, password: tempPassword }),
      });

      const authResponse = await auth.handler(signInRequest);

      // 4. Clear the temp password (set back to null)
      const accountId = accounts[0]?._id ?? accounts[0]?.id;
      if (accountId) {
        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: "account",
            where: [{ field: "_id", value: accountId }],
            update: { password: null },
          },
        } as any);
      }

      // 5. Relay the auth response (includes proper Set-Cookie headers)
      const responseBody = await authResponse.text();
      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", "application/json");

      // Forward Set-Cookie headers from Better Auth's response
      const setCookieHeader = authResponse.headers.get("set-cookie");
      if (setCookieHeader) {
        responseHeaders.set("Set-Cookie", setCookieHeader);
      }

      // Add CORS headers
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
      }

      return new Response(responseBody, {
        status: authResponse.status,
        headers: responseHeaders,
      });
    } catch (error: any) {
      console.error("[dev/sign-in] error:", error);
      return new Response(
        JSON.stringify({ error: error.message ?? "Internal error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
  }),
});

// CORS preflight for /dev/sign-in
http.route({
  path: "/dev/sign-in",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    const origin = request.headers.get("origin") ?? "*";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

/**
 * Stripe Webhook Handler
 * Handles payment confirmations from Stripe
 */
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    const payload = await request.text();

    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    try {
      await ctx.runAction(internal.functions.payments.handleWebhook, {
        payload,
        signature,
      });
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      return new Response(error.message || "Webhook error", { status: 400 });
    }
  }),
});

export default http;
