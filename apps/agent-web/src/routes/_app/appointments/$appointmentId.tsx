import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { RequestStatus } from "@convex/lib/constants";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	Clock,
	FileText,
	Link as LinkIcon,
	User,
	X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CallButton } from "@/components/meetings/call-button";
import { useOrg } from "@/components/org/org-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useAuthenticatedConvexQuery,
	useConvexMutationQuery,
} from "@/integrations/convex/hooks";

export const Route = createFileRoute("/_app/appointments/$appointmentId")({
	component: AppointmentDetail,
});

function AppointmentDetail() {
	const { appointmentId } = Route.useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { activeOrgId } = useOrg();

	const { data: appointment } = useAuthenticatedConvexQuery(
		api.functions.slots.getAppointmentById,
		{
			appointmentId: appointmentId as Id<"appointments">,
		},
	);

	const { mutateAsync: cancelMutation } = useConvexMutationQuery(
		api.functions.slots.cancelAppointment,
	);
	const { mutateAsync: completeMutation } = useConvexMutationQuery(
		api.functions.slots.completeAppointment,
	);
	const { mutateAsync: noShowMutation } = useConvexMutationQuery(
		api.functions.slots.markNoShow,
	);

	const handleCancel = async () => {
		try {
			await cancelMutation({
				appointmentId: appointmentId as Id<"appointments">,
			});
			toast.success(t("dashboard.appointments.success.cancelled"));
		} catch {
			toast.error(t("dashboard.appointments.error.cancel"));
		}
	};

	const handleComplete = async () => {
		try {
			await completeMutation({
				appointmentId: appointmentId as Id<"appointments">,
			});
			toast.success(t("dashboard.appointments.success.completed"));
		} catch {
			toast.error(t("dashboard.appointments.error.complete"));
		}
	};

	const handleNoShow = async () => {
		try {
			await noShowMutation({
				appointmentId: appointmentId as Id<"appointments">,
			});
			toast.success(t("dashboard.appointments.success.noShow"));
		} catch {
			toast.error(t("dashboard.appointments.error.noShow"));
		}
	};

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case "confirmed":
				return "default";
			case "scheduled":
				return "secondary";
			case "completed":
				return "default";
			case "cancelled":
				return "destructive";
			case "no_show":
				return "destructive";
			default:
				return "outline";
		}
	};

	if (appointment === undefined) {
		return (
			<div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-[400px] w-full" />
			</div>
		);
	}

	if (!appointment) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
				<AlertCircle className="h-12 w-12 text-muted-foreground" />
				<p className="text-muted-foreground">
					{t("dashboard.appointments.notFound")}
				</p>
				<Button onClick={() => navigate({ to: "/appointments" })}>
					{t("common.back")}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/appointments" })}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold tracking-tight">
						{t("dashboard.appointments.detail.title")}
					</h1>
					<p className="text-muted-foreground">{appointment.date}</p>
				</div>
				{appointment.status === "confirmed" ? (
					<Badge
						variant={getStatusBadgeVariant(appointment.status)}
						className="text-sm"
					>
						{t(`dashboard.appointments.statuses.${appointment.status}`)}
					</Badge>
				) : (
					<Badge
						variant={getStatusBadgeVariant(appointment.status)}
						className="text-sm"
					>
						{t(`dashboard.appointments.statuses.${appointment.status}`)}
					</Badge>
				)}
				{/* Appel vidéo — si RDV confirmé/planifié */}
				{activeOrgId &&
					appointment.attendee?.userId &&
					appointment.status === "confirmed" && (
						<CallButton
							orgId={activeOrgId}
							participantUserId={appointment.attendee.userId}
							appointmentId={appointmentId as Id<"appointments">}
							label={t("meetings.startVideoCall")}
							variant="default"
							size="sm"
						/>
					)}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							{t("dashboard.appointments.detail.dateTime")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center gap-2">
							<span className="font-medium">
								{t("dashboard.appointments.detail.date")}:
							</span>
							<span>{appointment.date}</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span>
								{appointment.time} - {appointment.endTime}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-5 w-5" />
							{t("dashboard.appointments.detail.user")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{appointment.attendee ? (
							<>
								<p className="font-medium">
									{appointment.attendee.firstName}{" "}
									{appointment.attendee.lastName}
								</p>
								<p className="text-sm text-muted-foreground">
									{appointment.attendee.email}
								</p>
							</>
						) : (
							<p className="text-muted-foreground">-</p>
						)}
					</CardContent>
				</Card>

				{appointment.service && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								{t("dashboard.appointments.detail.service")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-medium">
								{appointment.service.name?.fr || "-"}
							</p>
						</CardContent>
					</Card>
				)}

				{appointment.request && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<LinkIcon className="h-5 w-5" />
								{t(
									"dashboard.appointments.detail.linkedRequest",
									"Demande associée",
								)}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="font-medium font-mono text-sm">
									{appointment.request.reference}
								</span>
								<Badge variant="outline" className="text-[10px]">
									{t(
										`fields.requestStatus.options.${appointment.request.status}`,
									)}
								</Badge>
							</div>
							<Button
								variant="secondary"
								className="w-full text-xs h-8"
								onClick={() =>
									navigate({
										to: `/requests/${appointment.request?.reference}`,
									})
								}
							>
								{t(
									"dashboard.appointments.detail.viewRequest",
									"Voir la demande",
								)}
							</Button>
						</CardContent>
					</Card>
				)}

				{appointment.notes && (
					<Card>
						<CardHeader>
							<CardTitle>{t("dashboard.appointments.detail.notes")}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm">{appointment.notes}</p>
						</CardContent>
					</Card>
				)}
			</div>

			{appointment.status === RequestStatus.Completed && (
				<Card>
					<CardHeader>
						<CardTitle>{t("dashboard.appointments.detail.actions")}</CardTitle>
						<CardDescription>
							{t("dashboard.appointments.detail.actionsDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-2">
						<Button variant="secondary" onClick={handleComplete}>
							<Clock className="mr-2 h-4 w-4" />
							{t("dashboard.appointments.complete")}
						</Button>
						<Button variant="outline" onClick={handleNoShow}>
							<AlertCircle className="mr-2 h-4 w-4" />
							{t("dashboard.appointments.noShow")}
						</Button>
						{appointment.status === RequestStatus.Completed && (
							<Button variant="destructive" onClick={handleCancel}>
								<X className="mr-2 h-4 w-4" />
								{t("dashboard.appointments.cancel")}
							</Button>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
