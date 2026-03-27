import { AlertTriangle, ShieldX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@workspace/ui/components/card";

function getConvexErrorCode(error: Error): string | undefined {
	const maybeConvex = error as Error & { data?: unknown };
	if ("data" in error && typeof maybeConvex.data === "string") {
		return maybeConvex.data;
	}
	return undefined;
}

interface QueryErrorProps {
	error: Error;
	className?: string;
}

export function QueryError({ error, className }: QueryErrorProps) {
	const { t } = useTranslation();

	const errorCode = getConvexErrorCode(error);
	const isPermissionError =
		errorCode === "INSUFFICIENT_PERMISSIONS" ||
		error.message?.includes("INSUFFICIENT_PERMISSIONS");

	if (isPermissionError) {
		return (
			<div
				className={`flex flex-1 items-center justify-center p-6 ${className ?? ""}`}
			>
				<Card className="max-w-md w-full border-amber-500/30">
					<CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
							<ShieldX className="h-7 w-7 text-amber-500" />
						</div>
						<div>
							<h3 className="text-lg font-semibold">
								{t("errors.insufficientPermissions")}
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								{t("errors.insufficientPermissionsDesc")}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div
			className={`flex flex-1 items-center justify-center p-6 ${className ?? ""}`}
		>
			<Card className="max-w-md w-full border-destructive/30">
				<CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-7 w-7 text-destructive" />
					</div>
					<div>
						<h3 className="text-lg font-semibold">
							{t("errors.genericError")}
						</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{error.message}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
