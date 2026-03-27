import { betterAuth } from "better-auth/minimal";
import { emailOTP, genericOAuth, phoneNumber } from "better-auth/plugins";
import { v } from "convex/values";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { Resend } from "@convex-dev/resend";
import authConfig from "../auth.config";
import { components } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import { sendSms } from "../lib/bird";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "../_generated/dataModel";

// Better Auth Component Client
export const authComponent = createClient<DataModel>(components.betterAuth);

// Resend Component — same instance pattern as notifications.ts
const resend = new Resend(components.resend, {
  testMode: process.env.NODE_ENV !== "production" ? true : false,
});

// Sender email — configurable via RESEND_FROM_EMAIL env var
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ??
  "Consulat du Gabon <mail@updates.consulat.ga>";

// ============================================================================
// OTP Email Template
// ============================================================================

const otpEmailTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #009639 0%, #006b2b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
		.header h1 { margin: 0; font-size: 24px; }
		.content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
		.footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
		.otp-box { font-size: 36px; letter-spacing: 10px; font-weight: 700; text-align: center; padding: 24px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 12px; margin: 20px 0; color: #166534; font-family: 'Courier New', monospace; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🇬🇦 Consulat du Gabon</h1>
			<p style="margin: 5px 0 0 0; opacity: 0.9;">Code de connexion</p>
		</div>
		<div class="content">
			<p>Bonjour,</p>
			<p>Voici votre code de connexion à la plateforme Consulat.ga :</p>
			<div class="otp-box">${otp}</div>
			<p style="text-align: center; color: #6b7280; font-size: 14px;">
				Ce code est valable <strong>5 minutes</strong>.<br>
				Si vous n'avez pas demandé ce code, ignorez cet email.
			</p>
		</div>
		<div class="footer">
			<p>Consulat Général du Gabon en France</p>
			<p>Ce message a été envoyé automatiquement, merci de ne pas répondre.</p>
		</div>
	</div>
</body>
</html>`;

// ============================================================================
// Better Auth Instance Factory
// ============================================================================

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    appName: "Consulat.ga",
    // baseURL is intentionally omitted — Better Auth will infer it from
    // the incoming request, which is required for our multi-domain
    // architecture (consulat.ga, diplomate.ga, etc.)
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({ authConfig }),
      emailOTP({
        otpLength: 6,
        expiresIn: 300, // 5 minutes
        async sendVerificationOTP({ email, otp, type }) {
          const subject =
            type === "sign-in" ? `Votre code de connexion : ${otp}`
            : type === "email-verification" ?
              `Vérification de votre email : ${otp}`
            : `Réinitialisation de mot de passe : ${otp}`;

          await resend.sendEmail(ctx as any, {
            from: FROM_EMAIL,
            to: email,
            subject,
            html: otpEmailTemplate(otp),
          });
        },
      }),
      genericOAuth({
        config: [
          {
            providerId: "idn",
            clientId: process.env.IDN_CLIENT_ID!,
            clientSecret: process.env.IDN_CLIENT_SECRET!,
            discoveryUrl: process.env.IDN_DISCOVERY_URL!,
            scopes: ["openid", "profile", "email"],
          },
        ],
      }),
      phoneNumber({
        sendOTP: async ({ phoneNumber: phone, code }) => {
          if (!process.env.BIRD_API_KEY) {
            console.log(
              "[Auth SMS] BIRD_API_KEY not configured, skipping OTP SMS",
            );
            return;
          }
          // Fire-and-forget to avoid slowing down the request
          try {
            await sendSms(
              phone,
              `Consulat.ga — Votre code de connexion : ${code}. Valable 5 minutes.`,
            );
          } catch (err) {
            console.error("[Auth SMS] Failed to send OTP:", err);
          }
        },
      }),
    ],
  });
};

// Query: Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx);
  },
});

/**
 * Reset BetterAuth credential passwords to null, in batches.
 * Returns { done, reset, skipped, remaining } so the script can loop.
 */
export const resetAllPasswords = mutation({
  args: {},
  handler: async (ctx) => {
    const result = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "account",
      where: [{ field: "providerId", value: "credential" }],
      paginationOpts: { numItems: 10000, cursor: null },
    })) as any;
    const accounts = (result?.page ?? result ?? []) as any[];

    // Only process accounts that still have a password
    const withPassword = accounts.filter((a: any) => a.password);

    // Process up to 50 per call
    const batch = withPassword.slice(0, 50);
    let reset = 0;

    for (const account of batch) {
      await ctx.runMutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: "account",
          where: [{ field: "_id", value: account._id }],
          update: { password: null },
        },
      });
      reset++;
    }

    return {
      done: withPassword.length <= 50,
      total: accounts.length,
      reset,
      skipped: accounts.length - withPassword.length,
      remaining: Math.max(0, withPassword.length - 50),
    };
  },
});
