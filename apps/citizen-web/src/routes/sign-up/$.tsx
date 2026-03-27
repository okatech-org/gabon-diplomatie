import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IDNSignInButton } from "@/components/auth/IDNSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConvexMutationQuery } from "@/integrations/convex/hooks";
import { captureEvent } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";
import { normalizePhone } from "@convex/lib/phone";

export const Route = createFileRoute("/sign-up/$")({
	component: SignUpPage,
});

function SignUpPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const { mutateAsync: updateMe } = useConvexMutationQuery(
		api.functions.users.updateMe,
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const cleanPhone = normalizePhone(phone);
			const result = await authClient.signUp.email({
				email,
				password,
				name,
				phoneNumber: cleanPhone,
			});

			if (result.error) {
				setError(result.error.message || t("errors.auth.signUpFailed"));
			} else {
				// Save phone to user record after successful sign-up
				if (cleanPhone) {
					try {
						await updateMe({ phone: cleanPhone });
					} catch {
						// Non-blocking
					}
				}
				captureEvent("user_signed_up", { method: "email" });
				navigate({ to: "/post-login-redirect" });
			}
		} catch {
			setError(t("errors.auth.signUpFailed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950">
			{/* Background Image with Gradient Overlay - Matching Hero */}
			<div className="absolute inset-0 z-0">
				<img
					src="/hero-background.png"
					alt="Gabon cityscape"
					className="h-full w-full object-cover opacity-50"
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
			</div>

			<div className="relative z-10 w-full max-w-md px-4">
				<div className="mb-8 text-center space-y-2">
					<h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
						{t("errors.auth.createAccount")}
					</h1>
					<p className="text-white/80 text-lg">
						{t("errors.auth.joinPlatform")}
					</p>
				</div>

				{/* Sign Up Form */}
				<div className="w-full">
					<form
						onSubmit={handleSubmit}
						className="rounded-xl border border-border/50 bg-card shadow-xl w-full mx-auto p-6 space-y-4"
					>
						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label
								htmlFor="sign-up-name"
								className="text-foreground font-medium"
							>
								{t("common.name")}
							</Label>
							<Input
								id="sign-up-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								autoComplete="name"
								className="border-border focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="sign-up-phone"
								className="text-foreground font-medium"
							>
								{t("profile.fields.phone", "Téléphone")}
							</Label>
							<Input
								id="sign-up-phone"
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+33 6 12 34 56 78"
								autoComplete="tel"
								className="border-border focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="sign-up-email"
								className="text-foreground font-medium"
							>
								{t("common.email")}
							</Label>
							<Input
								id="sign-up-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="email@example.com"
								required
								autoComplete="email"
								className="border-border focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="sign-up-password"
								className="text-foreground font-medium"
							>
								{t("common.password")}
							</Label>
							<Input
								id="sign-up-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								autoComplete="new-password"
								className="border-border focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
							disabled={loading}
						>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("errors.auth.createAccount")}
						</Button>

						<IDNSignInButton />

						<div className="text-center text-sm text-muted-foreground">
							{t("errors.auth.alreadyHaveAccount")}{" "}
							<a
								href="/sign-in"
								className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
							>
								{t("header.nav.signIn")}
							</a>
						</div>
					</form>
				</div>

				{/* Footer */}
				<div className="mt-8 text-center text-sm text-muted-foreground/60">
					<p>
						&copy; {new Date().getFullYear()} Consulat.ga - République Gabonaise
					</p>
				</div>
			</div>
		</div>
	);
}
