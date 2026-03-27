import { api } from "@convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import {
	Bell,
	Bot,
	Building2,
	Check,
	Clock,
	Edit,
	Globe,
	KeyRound,
	Loader2,
	LogOut,
	Mail,
	Palette,
	Phone,
	Plus,
	Save,
	Settings2,
	Trash2,
	X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useOrg } from "@/components/org/org-provider";
import {
	SettingsDivider,
	SettingsLayout,
	SettingsRow,
	SettingsSectionHeader,
	type SettingsTab,
} from "@/components/shared/settings-layout";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCanDoTask } from "@/hooks/useCanDoTask";
import { type ConsularTheme, useConsularTheme } from "@/hooks/useConsularTheme";
import {
	useAuthenticatedConvexQuery,
	useConvexMutationQuery,
} from "@/integrations/convex/hooks";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings/")({
	component: DashboardSettings,
});

const DAYS_OF_WEEK = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
];

function DashboardSettings() {
	const { activeOrgId } = useOrg();
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);
	const [activeTab, setActiveTab] = useState("profile");

	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const { canDo, isReady: permissionsReady } = useCanDoTask(
		activeOrgId ?? undefined,
	);

	// ── Session data ──
	const { data: session } = authClient.useSession();

	// ── OTP reset state ──
	const [resetStep, setResetStep] = useState<"idle" | "otp_sent" | "done">(
		"idle",
	);
	const [resetOtp, setResetOtp] = useState("");
	const [resetNewPassword, setResetNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resetLoading, setResetLoading] = useState(false);
	const [resetError, setResetError] = useState<string | null>(null);
	const [resetSuccess, setResetSuccess] = useState(false);

	const handleSendResetOtp = async () => {
		const email = session?.user?.email;
		if (!email) return;
		setResetError(null);
		setResetLoading(true);
		try {
			const result = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "forget-password",
			});
			if (result.error) {
				setResetError(
					result.error.message || t("settings.security.changeFailed"),
				);
			} else {
				setResetStep("otp_sent");
			}
		} catch {
			setResetError(t("settings.security.changeFailed"));
		} finally {
			setResetLoading(false);
		}
	};

	const handleResetWithOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		const email = session?.user?.email;
		if (!email) return;
		if (resetNewPassword.length < 8) {
			setResetError(t("settings.security.passwordTooShort"));
			return;
		}
		if (resetNewPassword !== confirmPassword) {
			setResetError(t("settings.security.passwordMismatch"));
			return;
		}
		setResetError(null);
		setResetLoading(true);
		try {
			const result = await authClient.emailOtp.resetPassword({
				email,
				otp: resetOtp,
				password: resetNewPassword,
			});
			if (result.error) {
				setResetError(
					result.error.message || t("settings.security.changeFailed"),
				);
			} else {
				setResetSuccess(true);
				setResetStep("done");
				setResetOtp("");
				setResetNewPassword("");
				setConfirmPassword("");
				setTimeout(() => {
					setResetSuccess(false);
					setResetStep("idle");
				}, 4000);
			}
		} catch {
			setResetError(t("settings.security.changeFailed"));
		} finally {
			setResetLoading(false);
		}
	};

	// Granular permission checks
	const canViewOrgSettings = permissionsReady && canDo("settings.view");
	const canManageSettings = permissionsReady && canDo("settings.manage");

	const { data: org } = useAuthenticatedConvexQuery(
		api.functions.orgs.getById,
		activeOrgId ? { orgId: activeOrgId } : "skip",
	);
	const { mutateAsync: updateProfile } = useConvexMutationQuery(
		api.functions.orgs.update,
	);

	const form = useForm({
		defaultValues: {
			name: org?.name || "",
			description: org?.description || "",
			phone: org?.phone || "",
			email: org?.email || "",
			website: org?.website || "",
			street: org?.address?.street || "",
			city: org?.address?.city || "",
			postalCode: org?.address?.postalCode || "",
			country: org?.address?.country || "",
			workingHours: org?.settings?.workingHours || {},
			appointmentBuffer: org?.settings?.appointmentBuffer || 30,
			requestAssignment:
				(org?.settings?.requestAssignment as string) || "manual",
			defaultProcessingDays: org?.settings?.defaultProcessingDays || 15,
			aiAnalysisEnabled: org?.settings?.aiAnalysisEnabled !== false,
		},
		onSubmit: async ({ value }) => {
			if (!activeOrgId) return;

			try {
				await updateProfile({
					orgId: activeOrgId,
					name: value.name || undefined,
					description: value.description || undefined,
					phone: value.phone || undefined,
					email: value.email || undefined,
					website: value.website || undefined,
					address: {
						street: value.street,
						city: value.city,
						postalCode: value.postalCode,
						country: value.country as any,
					},
					settings: {
						workingHours: value.workingHours,
						appointmentBuffer: Number(value.appointmentBuffer),
						maxActiveRequests: org?.settings?.maxActiveRequests || 10,
						requestAssignment: value.requestAssignment as "manual" | "auto",
						defaultProcessingDays: Number(value.defaultProcessingDays),
						aiAnalysisEnabled: value.aiAnalysisEnabled,
					},
				});
				toast.success(t("dashboard.settings.updateSuccess"));
				setIsEditing(false);
			} catch (error) {
				toast.error(t("dashboard.settings.updateError"));
			}
		},
	});

	const handleEdit = () => {
		if (org) {
			form.setFieldValue("name", org.name || "");
			form.setFieldValue("description", org.description || "");
			form.setFieldValue("phone", org.phone || "");
			form.setFieldValue("email", org.email || "");
			form.setFieldValue("website", org.website || "");
			form.setFieldValue("street", org.address?.street || "");
			form.setFieldValue("city", org.address?.city || "");
			form.setFieldValue("postalCode", org.address?.postalCode || "");
			form.setFieldValue("country", org.address?.country || "");
			form.setFieldValue("workingHours", org?.settings?.workingHours || {});
			form.setFieldValue(
				"appointmentBuffer",
				org?.settings?.appointmentBuffer || 30,
			);
			form.setFieldValue(
				"requestAssignment",
				(org?.settings?.requestAssignment as string) || "manual",
			);
			form.setFieldValue(
				"defaultProcessingDays",
				org?.settings?.defaultProcessingDays || 15,
			);
			form.setFieldValue(
				"aiAnalysisEnabled",
				org?.settings?.aiAnalysisEnabled !== false,
			);
			setIsEditing(true);
		}
	};

	if (org === undefined || !permissionsReady) {
		return (
			<div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
				<Skeleton className="h-8 w-64" />
				<div className="grid gap-4 md:grid-cols-2">
					<Skeleton className="h-[200px]" />
					<Skeleton className="h-[200px]" />
				</div>
			</div>
		);
	}

	if (!org) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center p-4">
				<p className="text-muted-foreground">
					{t("dashboard.settings.notFound")}
				</p>
			</div>
		);
	}

	const getOrgTypeLabel = (type: string) => {
		const types: Record<string, string> = {
			embassy: t("dashboard.settings.orgTypes.embassy"),
			high_representation: t("dashboard.settings.orgTypes.highRepresentation"),
			general_consulate: t("dashboard.settings.orgTypes.generalConsulate"),
			high_commission: t("dashboard.settings.orgTypes.highCommission"),
			permanent_mission: t("dashboard.settings.orgTypes.permanentMission"),
			third_party: t("dashboard.settings.orgTypes.thirdParty"),
		};
		return types[type] || type;
	};

	const TABS: SettingsTab[] = [
		...(canViewOrgSettings
			? [
					{
						id: "profile",
						label: t("dashboard.settings.orgProfile"),
						icon: <Building2 className="size-4" />,
					},
					{
						id: "hours",
						label: t("dashboard.settings.workingHours"),
						icon: <Clock className="size-4" />,
					},
					{
						id: "requestProcessing",
						label: t("dashboard.settings.requestProcessing.title"),
						icon: <Settings2 className="size-4" />,
					},
				]
			: []),
		{
			id: "preferences",
			label: t("settings.memberPreferences.title"),
			icon: <Bell className="size-4" />,
		},
		{
			id: "appearance",
			label: t("settings.display.title"),
			icon: <Palette className="size-4" />,
		},
		{
			id: "accountSecurity",
			label: t("settings.account.title"),
			icon: <KeyRound className="size-4" />,
		},
	];

	return (
		<>
			<SettingsLayout
				title={t("dashboard.settings.title")}
				description={t("dashboard.settings.description")}
				tabs={TABS}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			>
				<div className="flex justify-end mb-6">
					{canManageSettings &&
						!isEditing &&
						activeTab in { profile: 1, hours: 1, requestProcessing: 1 } && (
							<Button onClick={handleEdit}>
								<Edit className="mr-2 h-4 w-4" />
								{t("dashboard.settings.edit")}
							</Button>
						)}
					{isEditing && (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								type="button"
								onClick={() => setIsEditing(false)}
							>
								<X className="mr-2 h-4 w-4" />
								{t("common.cancel")}
							</Button>
							<Button type="submit" form="settings-form">
								<Save className="mr-2 h-4 w-4" />
								{t("dashboard.settings.save")}
							</Button>
						</div>
					)}
				</div>

				<form
					id="settings-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					{/* Org Settings */}
					{canViewOrgSettings && (
						<>
							<div
								className={cn(
									"space-y-8 animate-in fade-in duration-300",
									activeTab !== "profile" && "hidden",
								)}
							>
								<div>
									<SettingsSectionHeader
										title={t("dashboard.settings.orgProfile")}
										description={t("dashboard.settings.orgProfileDescription")}
									/>
									<div className="max-w-2xl px-1">
										<FieldGroup>
											{isEditing ? (
												<>
													<form.Field
														name="name"
														children={(field) => {
															const isInvalid =
																field.state.meta.isTouched &&
																!field.state.meta.isValid;
															return (
																<Field data-invalid={isInvalid}>
																	<FieldLabel htmlFor={field.name}>
																		{t("dashboard.settings.name")}
																	</FieldLabel>
																	<Input
																		id={field.name}
																		value={field.state.value}
																		onBlur={field.handleBlur}
																		onChange={(e) =>
																			field.handleChange(e.target.value)
																		}
																	/>
																	{isInvalid && (
																		<FieldError
																			errors={field.state.meta.errors}
																		/>
																	)}
																</Field>
															);
														}}
													/>
													<div>
														<FieldLabel>
															{t("dashboard.settings.type")}
														</FieldLabel>
														<Badge variant="secondary">
															{getOrgTypeLabel(org.type)}
														</Badge>
													</div>
													<form.Field
														name="description"
														children={(field) => {
															const isInvalid =
																field.state.meta.isTouched &&
																!field.state.meta.isValid;
															return (
																<Field data-invalid={isInvalid}>
																	<FieldLabel htmlFor={field.name}>
																		{t("dashboard.settings.descriptionLabel")}
																	</FieldLabel>
																	<Textarea
																		id={field.name}
																		value={field.state.value}
																		onBlur={field.handleBlur}
																		onChange={(e) =>
																			field.handleChange(e.target.value)
																		}
																		rows={3}
																	/>
																	{isInvalid && (
																		<FieldError
																			errors={field.state.meta.errors}
																		/>
																	)}
																</Field>
															);
														}}
													/>
												</>
											) : (
												<>
													<div>
														<p className="text-sm text-muted-foreground">
															{t("dashboard.settings.name")}
														</p>
														<p className="font-medium">{org.name}</p>
													</div>
													<div>
														<p className="text-sm text-muted-foreground">
															{t("dashboard.settings.type")}
														</p>
														<Badge variant="secondary">
															{getOrgTypeLabel(org.type)}
														</Badge>
													</div>
													{org.description && (
														<div>
															<p className="text-sm text-muted-foreground">
																{t("dashboard.settings.descriptionLabel")}
															</p>
															<p className="text-sm">{org.description}</p>
														</div>
													)}
												</>
											)}
										</FieldGroup>
									</div>
								</div>

								<div className="mt-8">
									<SettingsSectionHeader
										title={t("dashboard.settings.address")}
									/>
									<div className="max-w-2xl px-1">
										<FieldGroup>
											{isEditing ? (
												<>
													<form.Field
														name="street"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t("dashboard.settings.street")}
																</FieldLabel>
																<Input
																	id={field.name}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																/>
															</Field>
														)}
													/>
													<form.Field
														name="city"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t("dashboard.settings.city")}
																</FieldLabel>
																<Input
																	id={field.name}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																/>
															</Field>
														)}
													/>
													<form.Field
														name="postalCode"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t("dashboard.settings.postalCode")}
																</FieldLabel>
																<Input
																	id={field.name}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																/>
															</Field>
														)}
													/>
													<form.Field
														name="country"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t("dashboard.settings.country")}
																</FieldLabel>
																<Input
																	id={field.name}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																/>
															</Field>
														)}
													/>
												</>
											) : org.address ? (
												<>
													{org.address.street && <p>{org.address.street}</p>}
													<p>
														{org.address.city}
														{org.address.postalCode &&
															`, ${org.address.postalCode}`}
													</p>
													<p>{org.address.country}</p>
												</>
											) : (
												<p className="text-muted-foreground">
													{t("dashboard.settings.noAddress")}
												</p>
											)}
										</FieldGroup>
									</div>
								</div>

								<div className="mt-8">
									<SettingsSectionHeader
										title={t("dashboard.settings.contact")}
									/>
									<div className="max-w-2xl px-1">
										<FieldGroup>
											{isEditing ? (
												<>
													<form.Field
														name="phone"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t("dashboard.settings.phone")}
																</FieldLabel>
																<Input
																	id={field.name}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																/>
															</Field>
														)}
													/>
													<form.Field
														name="email"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t("dashboard.settings.email")}
																</FieldLabel>
																<Input
																	id={field.name}
																	type="email"
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																/>
															</Field>
														)}
													/>
													<form.Field
														name="website"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t("dashboard.settings.website")}
																</FieldLabel>
																<Input
																	id={field.name}
																	value={field.state.value}
																	onChange={(e) =>
																		field.handleChange(e.target.value)
																	}
																/>
															</Field>
														)}
													/>
												</>
											) : (
												<>
													{org.phone && (
														<div className="flex items-center gap-2">
															<Phone className="h-4 w-4 text-muted-foreground" />
															<span>{org.phone}</span>
														</div>
													)}
													{org.email && (
														<div className="flex items-center gap-2">
															<Mail className="h-4 w-4 text-muted-foreground" />
															<span>{org.email}</span>
														</div>
													)}
													{org.website && (
														<div className="flex items-center gap-2">
															<Globe className="h-4 w-4 text-muted-foreground" />
															<a
																href={org.website}
																target="_blank"
																rel="noopener noreferrer"
																className="text-primary hover:underline"
															>
																{org.website}
															</a>
														</div>
													)}
													{!org.phone && !org.email && !org.website && (
														<p className="text-muted-foreground">
															{t("dashboard.settings.noContact")}
														</p>
													)}
												</>
											)}
										</FieldGroup>
									</div>
								</div>
							</div>

							<div
								className={cn(
									"space-y-8 animate-in fade-in duration-300",
									activeTab !== "hours" && "hidden",
								)}
							>
								<div>
									<SettingsSectionHeader
										title={t("dashboard.settings.workingHours")}
									/>
									<div className="max-w-2xl px-1">
										{isEditing ? (
											<div className="space-y-4">
												<form.Field
													name="appointmentBuffer"
													children={(field) => (
														<div className="flex items-center gap-4 max-w-sm">
															<FieldLabel className="whitespace-nowrap">
																{t("dashboard.settings.appointmentBuffer")}
															</FieldLabel>
															<Input
																type="number"
																min="0"
																value={field.state.value}
																onChange={(e) =>
																	field.handleChange(Number(e.target.value))
																}
																className="w-24"
															/>
															<span className="text-sm text-muted-foreground">
																min
															</span>
														</div>
													)}
												/>

												<div className="grid gap-4">
													{DAYS_OF_WEEK.map((day) => (
														<div
															key={day}
															className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-lg"
														>
															<div className="w-32 font-medium capitalize">
																{t(`dashboard.settings.days.${day}`)}
															</div>
															<form.Field
																name={`workingHours.${day}` as any}
																children={(field) => {
																	const slots =
																		(field.state.value as any[]) || [];
																	return (
																		<div className="flex-1 space-y-2">
																			{slots.map((slot: any, index: number) => (
																				<div
																					key={index}
																					className="flex items-center gap-2"
																				>
																					<Input
																						type="time"
																						value={slot.start}
																						onChange={(e) => {
																							const newSlots = [...slots];
																							newSlots[index] = {
																								...slot,
																								start: e.target.value,
																							};
																							field.handleChange(
																								newSlots as any,
																							);
																						}}
																						className="w-32"
																					/>
																					<span>-</span>
																					<Input
																						type="time"
																						value={slot.end}
																						onChange={(e) => {
																							const newSlots = [...slots];
																							newSlots[index] = {
																								...slot,
																								end: e.target.value,
																							};
																							field.handleChange(
																								newSlots as any,
																							);
																						}}
																						className="w-32"
																					/>
																					<Button
																						variant="ghost"
																						size="icon"
																						type="button"
																						onClick={() => {
																							const newSlots = slots.filter(
																								(_, i) => i !== index,
																							);
																							field.handleChange(
																								newSlots as any,
																							);
																						}}
																					>
																						<Trash2 className="h-4 w-4 text-destructive" />
																					</Button>
																				</div>
																			))}
																			<Button
																				variant="outline"
																				size="sm"
																				type="button"
																				onClick={() => {
																					field.handleChange([
																						...slots,
																						{
																							start: "09:00",
																							end: "17:00",
																							isOpen: true,
																						},
																					] as any);
																				}}
																			>
																				<Plus className="mr-2 h-4 w-4" />
																				{t("dashboard.settings.addSlot")}
																			</Button>
																		</div>
																	);
																}}
															/>
														</div>
													))}
												</div>
											</div>
										) : (
											<div className="grid gap-2">
												<div className="flex gap-2 text-sm text-muted-foreground mb-2">
													<span>
														{t("dashboard.settings.appointmentBuffer")}:
													</span>
													<span className="font-medium text-foreground">
														{org.settings?.appointmentBuffer || 30} min
													</span>
												</div>
												{DAYS_OF_WEEK.map((day) => {
													const slots = org.settings?.workingHours?.[day] || [];
													return (
														<div
															key={day}
															className="flex justify-between items-center py-2 border-b last:border-0"
														>
															<span className="capitalize">
																{t(`dashboard.settings.days.${day}`)}
															</span>
															<div className="text-right">
																{slots.length > 0 ? (
																	slots.map((slot: any, idx: number) => (
																		<div key={idx} className="text-sm">
																			{slot.start} - {slot.end}
																		</div>
																	))
																) : (
																	<span className="text-sm text-muted-foreground">
																		{t("dashboard.settings.closed")}
																	</span>
																)}
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								</div>
							</div>

							<div
								className={cn(
									"space-y-8 animate-in fade-in duration-300",
									activeTab !== "requestProcessing" && "hidden",
								)}
							>
								<div>
									<SettingsSectionHeader
										title={t("dashboard.settings.requestProcessing.title")}
										description={t(
											"dashboard.settings.requestProcessing.description",
										)}
									/>
									<div className="max-w-2xl px-1">
										<FieldGroup>
											{isEditing ? (
												<div className="space-y-4">
													{/* Assignment mode */}
													<form.Field
														name="requestAssignment"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t(
																		"dashboard.settings.requestProcessing.assignmentMode",
																	)}
																</FieldLabel>
																<Select
																	value={field.state.value}
																	onValueChange={(val) =>
																		field.handleChange(val)
																	}
																>
																	<SelectTrigger>
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="manual">
																			{t(
																				"dashboard.settings.requestProcessing.manual",
																			)}
																		</SelectItem>
																		<SelectItem value="auto">
																			{t(
																				"dashboard.settings.requestProcessing.auto",
																			)}
																		</SelectItem>
																	</SelectContent>
																</Select>
																<p className="text-xs text-muted-foreground">
																	{field.state.value === "auto"
																		? t(
																				"dashboard.settings.requestProcessing.autoDesc",
																			)
																		: t(
																				"dashboard.settings.requestProcessing.manualDesc",
																			)}
																</p>
															</Field>
														)}
													/>

													{/* Default processing days */}
													<form.Field
														name="defaultProcessingDays"
														children={(field) => (
															<Field>
																<FieldLabel htmlFor={field.name}>
																	{t(
																		"dashboard.settings.requestProcessing.processingDays",
																	)}
																</FieldLabel>
																<div className="flex items-center gap-2">
																	<Input
																		id={field.name}
																		type="number"
																		min={1}
																		max={365}
																		value={field.state.value}
																		onChange={(e) =>
																			field.handleChange(Number(e.target.value))
																		}
																		className="w-24"
																	/>
																	<span className="text-sm text-muted-foreground">
																		{t(
																			"dashboard.settings.requestProcessing.days",
																		)}
																	</span>
																</div>
															</Field>
														)}
													/>

													{/* AI Analysis toggle */}
													<form.Field
														name="aiAnalysisEnabled"
														children={(field) => (
															<div className="flex items-center justify-between">
																<div className="space-y-0.5">
																	<Label className="flex items-center gap-2">
																		<Bot className="h-4 w-4" />
																		{t(
																			"dashboard.settings.requestProcessing.aiAnalysis",
																		)}
																	</Label>
																	<p className="text-xs text-muted-foreground">
																		{t(
																			"dashboard.settings.requestProcessing.aiAnalysisDesc",
																		)}
																	</p>
																</div>
																<Switch
																	checked={field.state.value}
																	onCheckedChange={(checked) =>
																		field.handleChange(checked)
																	}
																/>
															</div>
														)}
													/>
												</div>
											) : (
												<div className="space-y-3">
													<div className="flex justify-between items-center">
														<span className="text-sm text-muted-foreground">
															{t(
																"dashboard.settings.requestProcessing.assignmentMode",
															)}
														</span>
														<Badge variant="secondary">
															{org.settings?.requestAssignment === "auto"
																? t("dashboard.settings.requestProcessing.auto")
																: t(
																		"dashboard.settings.requestProcessing.manual",
																	)}
														</Badge>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-sm text-muted-foreground">
															{t(
																"dashboard.settings.requestProcessing.processingDays",
															)}
														</span>
														<span className="font-medium text-sm">
															{org.settings?.defaultProcessingDays || 15}{" "}
															{t("dashboard.settings.requestProcessing.days")}
														</span>
													</div>
													<div className="flex justify-between items-center">
														<span className="text-sm text-muted-foreground flex items-center gap-1">
															<Bot className="h-3.5 w-3.5" />
															{t(
																"dashboard.settings.requestProcessing.aiAnalysis",
															)}
														</span>
														<Badge
															variant={
																org.settings?.aiAnalysisEnabled !== false
																	? "default"
																	: "outline"
															}
														>
															{org.settings?.aiAnalysisEnabled !== false
																? t("common.enabled")
																: t("common.disabled")}
														</Badge>
													</div>
												</div>
											)}
										</FieldGroup>
									</div>
								</div>
							</div>
						</>
					)}
				</form>

				{/* ─── Personal settings (visible to everyone) ─── */}

				<div
					className={cn(
						"space-y-8 animate-in fade-in duration-300",
						activeTab !== "preferences" && "hidden",
					)}
				>
					{activeOrgId && <MemberPreferencesCard orgId={activeOrgId} />}
				</div>

				<div
					className={cn(
						"animate-in fade-in duration-300",
						activeTab !== "accountSecurity" && "hidden",
					)}
				>
					{/* User account info */}
					<SettingsSectionHeader
						title={t("settings.security.accountInfo")}
						description={t("settings.security.accountInfoDesc")}
					/>
					<div>
						<SettingsRow
							title={t("common.name")}
							value={session?.user?.name || "—"}
						/>
						<SettingsRow
							title={t("common.email")}
							value={session?.user?.email || "—"}
						/>
					</div>

					<SettingsDivider />

					{/* Password section */}
					<div className="max-w-2xl">
						<SettingsSectionHeader
							title={t("settings.security.changePassword")}
							description={t("settings.security.changePasswordDesc")}
						/>
						<div className="max-w-md space-y-3">
							{resetError && (
								<div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{resetError}
								</div>
							)}
							{resetSuccess && (
								<div className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary flex items-center gap-2">
									<Check className="size-4" />
									{t("settings.security.resetSuccess")}
								</div>
							)}

							{resetStep === "idle" && (
								<Button
									variant="outline"
									onClick={handleSendResetOtp}
									disabled={resetLoading || !session?.user?.email}
								>
									{resetLoading ? (
										<Loader2 className="mr-2 size-4 animate-spin" />
									) : (
										<Mail className="mr-2 size-4" />
									)}
									{t("settings.security.sendResetCode")}
								</Button>
							)}

							{resetStep === "otp_sent" && (
								<form onSubmit={handleResetWithOtp} className="space-y-4">
									<p className="text-sm text-muted-foreground">
										{t("settings.security.otpSentTo", {
											email: session?.user?.email,
										})}
									</p>
									<div className="space-y-2">
										<Label>{t("settings.security.otpCode")}</Label>
										<Input
											value={resetOtp}
											onChange={(e) => setResetOtp(e.target.value)}
											placeholder="123456"
											required
											autoComplete="one-time-code"
										/>
									</div>
									<div className="space-y-2">
										<Label>{t("settings.security.newPassword")}</Label>
										<Input
											type="password"
											value={resetNewPassword}
											onChange={(e) => setResetNewPassword(e.target.value)}
											required
											minLength={8}
											autoComplete="new-password"
										/>
									</div>
									<div className="space-y-2">
										<Label>{t("settings.security.confirmPassword")}</Label>
										<Input
											type="password"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											required
											minLength={8}
											autoComplete="new-password"
										/>
									</div>
									<div className="flex gap-2">
										<Button
											type="submit"
											disabled={
												resetLoading ||
												!resetOtp ||
												!resetNewPassword ||
												!confirmPassword ||
												resetNewPassword !== confirmPassword
											}
										>
											{resetLoading && (
												<Loader2 className="mr-2 size-4 animate-spin" />
											)}
											{t("settings.security.resetPassword")}
										</Button>
										<Button
											type="button"
											variant="ghost"
											onClick={() => {
												setResetStep("idle");
												setResetError(null);
												setResetOtp("");
												setResetNewPassword("");
												setConfirmPassword("");
											}}
										>
											{t("common.cancel")}
										</Button>
									</div>
								</form>
							)}
						</div>
					</div>

					<SettingsDivider />

					{/* Logout section */}
					<SettingsSectionHeader
						title={t("settings.account.title")}
						description={t("settings.account.description")}
					/>
					<div>
						<SettingsRow
							title={t("common.logout")}
							description={t(
								"common.logoutConfirmDescription",
								"Vous allez être déconnecté de votre session.",
							)}
							action={
								<Button
									variant="destructive"
									type="button"
									onClick={() => setShowLogoutDialog(true)}
								>
									<LogOut className="mr-2 h-4 w-4" />
									{t("common.logout")}
								</Button>
							}
						/>
					</div>
				</div>

				<div
					className={cn(
						"space-y-8 animate-in fade-in duration-300",
						activeTab !== "appearance" && "hidden",
					)}
				>
					<div>
						<SettingsSectionHeader
							title={t("settings.display.title")}
							description={t("settings.display.description")}
						/>
						<DarkModeToggle />
					</div>

					<div className="mt-8">
						<SettingsSectionHeader
							title={t("settings.consularTheme.title")}
							description={t("settings.consularTheme.description")}
						/>
						<ThemeSwitcher />
					</div>
				</div>
			</SettingsLayout>

			<AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("common.logoutConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t(
								"common.logoutConfirmDescription",
								"Vous allez être déconnecté de votre session. Vous devrez vous reconnecter pour accéder à votre espace.",
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								await authClient.signOut();
								window.location.href = "/";
							}}
						>
							{t("common.logout")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

/* -------------------------------------------------- */
/*  Dark Mode Toggle                                  */
/* -------------------------------------------------- */
function DarkModeToggle() {
	const { t } = useTranslation();
	const { theme, setTheme } = useTheme();
	return (
		<div className="flex items-center justify-between">
			<div className="space-y-0.5">
				<label className="text-sm font-medium">
					{t("settings.display.darkMode")}
				</label>
				<p className="text-sm text-muted-foreground">
					{t("settings.display.darkModeDesc")}
				</p>
			</div>
			<Switch
				checked={theme === "dark"}
				onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
			/>
		</div>
	);
}

/* -------------------------------------------------- */
/*  Theme Switcher (Classique / Homorphisme)           */
/* -------------------------------------------------- */
function ThemePreview({
	themeId,
	label,
	description,
	isActive,
	onClick,
}: {
	themeId: ConsularTheme;
	label: string;
	description: string;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer w-full text-left",
				isActive
					? "border-primary bg-primary/5 ring-2 ring-primary/20"
					: "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
			)}
		>
			<div
				className={cn(
					"w-16 h-12 rounded-lg overflow-hidden relative shrink-0",
					themeId === "default"
						? "bg-card border border-border"
						: "bg-[oklch(0.92_0.005_250)]",
				)}
			>
				{themeId === "default" ? (
					<div className="p-1.5 space-y-1">
						<div className="h-1.5 w-5 bg-primary/20 rounded" />
						<div className="h-2.5 bg-muted rounded border border-border" />
						<div className="flex gap-0.5">
							<div className="h-2 flex-1 bg-muted rounded border border-border" />
							<div className="h-2 flex-1 bg-muted rounded border border-border" />
						</div>
					</div>
				) : (
					<div className="p-1.5 space-y-1">
						<div className="h-1.5 w-5 bg-primary/20 rounded" />
						<div className="h-2.5 rounded neu-preview-element" />
						<div className="flex gap-0.5">
							<div className="h-2 flex-1 rounded neu-preview-element" />
							<div className="h-2 flex-1 rounded neu-preview-element" />
						</div>
					</div>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold">{label}</p>
				<p className="text-xs text-muted-foreground leading-tight truncate">
					{description}
				</p>
			</div>
			{isActive && <div className="w-3 h-3 rounded-full bg-primary shrink-0" />}
		</button>
	);
}

/* -------------------------------------------------- */
/*  Member Preferences Card                           */
/* -------------------------------------------------- */
function MemberPreferencesCard({ orgId }: { orgId: string }) {
	const { t } = useTranslation();

	const { data: memberSettings } = useAuthenticatedConvexQuery(
		api.functions.userPreferences.getMyMembershipSettings,
		{ orgId: orgId as any },
	);
	const { mutateAsync: updateSettings } = useConvexMutationQuery(
		api.functions.userPreferences.updateMyMembershipSettings,
	);

	const handleToggle = async (key: string, value: boolean) => {
		try {
			await updateSettings({
				orgId: orgId as any,
				[key]: value,
			});
			toast.success(t("settings.memberPreferences.updateSuccess"));
		} catch {
			toast.error(t("settings.memberPreferences.updateError"));
		}
	};

	if (memberSettings === undefined) {
		return (
			<div className="py-6 border rounded-xl bg-card p-6">
				<Skeleton className="h-[120px]" />
			</div>
		);
	}

	if (memberSettings === null) return null;

	const settings = memberSettings.settings;

	const toggleItems = [
		{
			key: "notifyOnNewRequest",
			label: t("settings.memberPreferences.notifyOnNewRequest"),
			desc: t("settings.memberPreferences.notifyOnNewRequestDesc"),
			value: settings.notifyOnNewRequest ?? true,
		},
		{
			key: "notifyOnAssignment",
			label: t("settings.memberPreferences.notifyOnAssignment"),
			desc: t("settings.memberPreferences.notifyOnAssignmentDesc"),
			value: settings.notifyOnAssignment ?? true,
		},
		{
			key: "dailyDigest",
			label: t("settings.memberPreferences.dailyDigest"),
			desc: t("settings.memberPreferences.dailyDigestDesc"),
			value: settings.dailyDigest ?? false,
		},
	];

	return (
		<div>
			<SettingsSectionHeader
				title={t("settings.memberPreferences.title")}
				description={t("settings.memberPreferences.description")}
			/>
			<div className="space-y-0 max-w-xl">
				{toggleItems.map((item) => (
					<div
						key={item.key}
						className="flex items-center justify-between py-4 border-b last:border-0"
					>
						<div className="space-y-0.5">
							<Label className="text-sm font-medium">{item.label}</Label>
							<p className="text-xs text-muted-foreground">{item.desc}</p>
						</div>
						<Switch
							checked={item.value}
							onCheckedChange={(checked) => handleToggle(item.key, checked)}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

function ThemeSwitcher() {
	const { t } = useTranslation();
	const { consularTheme, setConsularTheme } = useConsularTheme();
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<ThemePreview
				themeId="default"
				label={t("settings.consularTheme.default")}
				description={t("settings.consularTheme.defaultDesc")}
				isActive={consularTheme === "default"}
				onClick={() => setConsularTheme("default")}
			/>
			<ThemePreview
				themeId="homeomorphism"
				label={t("settings.consularTheme.homeomorphism")}
				description={t("settings.consularTheme.homeomorphismDesc")}
				isActive={consularTheme === "homeomorphism"}
				onClick={() => setConsularTheme("homeomorphism")}
			/>
		</div>
	);
}
