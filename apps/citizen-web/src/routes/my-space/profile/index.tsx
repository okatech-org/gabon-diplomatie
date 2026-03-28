import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
	Briefcase,
	Download,
	Edit,
	FileText,
	Loader2,
	Mail,
	MapPin,
	Phone,
	User,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PageHeader } from "@/components/my-space/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthenticatedConvexQuery } from "@/integrations/convex/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-space/profile/")({
	component: ProfileViewPage,
});

// Label mappings
const GENDER_LABELS: Record<string, string> = {
	male: "Masculin",
	female: "Féminin",
	other: "Autre",
};

const COUNTRY_LABELS: Record<string, string> = {
	GA: "Gabon",
	FR: "France",
	CM: "Cameroun",
	CG: "Congo",
	CD: "RD Congo",
	SN: "Sénégal",
	CI: "Côte d'Ivoire",
	MA: "Maroc",
	TN: "Tunisie",
	DZ: "Algérie",
	BE: "Belgique",
	CH: "Suisse",
	CA: "Canada",
	US: "États-Unis",
};

const MARITAL_STATUS_LABELS: Record<string, string> = {
	single: "Célibataire",
	married: "Marié(e)",
	divorced: "Divorcé(e)",
	widowed: "Veuf/Veuve",
	pacs: "Pacsé(e)",
};

const PROFESSION_STATUS_LABELS: Record<string, string> = {
	employed: "Salarié(e)",
	self_employed: "Indépendant(e)",
	unemployed: "Sans emploi",
	student: "Étudiant(e)",
	retired: "Retraité(e)",
};

function ProfileViewPage() {
	const { t } = useTranslation();
	const {
		data: profile,
		isPending,
		isError,
	} = useAuthenticatedConvexQuery(api.functions.profiles.getMine, {});

	if (isPending) {
		return (
			<div className="p-8 flex justify-center">
				<Loader2 className="animate-spin text-primary" />
			</div>
		);
	}

	if (isError || !profile)
		return <div className="p-8">{t("profile.notFound")}</div>;

	return <ProfileView profile={profile} />;
}

function ProfileView({ profile }: { profile: Doc<"profiles"> }) {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState("identity");

	const formatDate = (timestamp?: number) => {
		if (!timestamp) return "—";
		return format(new Date(timestamp), "dd MMMM yyyy", { locale: fr });
	};

	const getLabel = (
		map: Record<string, string>,
		code?: string,
	): string | undefined => {
		return code ? map[code] || code : undefined;
	};

	const tabs = [
		{
			id: "identity",
			label: t("profile.tabs.personal"),
			icon: User,
		},
		{
			id: "contacts",
			label: t("profile.tabs.contacts"),
			icon: Phone,
		},
		{ id: "family", label: t("profile.tabs.family"), icon: Users },
		{
			id: "passport",
			label: t("profile.tabs.passport"),
			icon: FileText,
		},
		{
			id: "profession",
			label: t("profile.tabs.profession"),
			icon: Briefcase,
		},
	];

	return (
		<div className="space-y-6 pb-20 p-1">
			{/* Header */}
			<PageHeader
				title={t("mySpace.screens.profile.heading")}
				subtitle={t("mySpace.screens.profile.subtitle")}
				actions={
					<Button asChild>
						<Link to="/my-space/profile/edit">
							<Edit className="h-4 w-4 mr-2" />
							{t("common.edit")}
						</Link>
					</Button>
				}
			/>

			{/* Completion Score */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2, delay: 0.05 }}
			>
				<Card>
					<CardContent className="pt-4">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">
								{t("profile.completion")}
							</span>
							<Badge
								variant={
									profile.completionScore >= 80 ? "default" : "secondary"
								}
							>
								{profile.completionScore}%
							</Badge>
						</div>
						<Progress value={profile.completionScore} className="h-2" />
					</CardContent>
				</Card>
			</motion.div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Documents */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2, delay: 0.15 }}
					className="lg:col-span-1"
				>
					<DocumentsSection profile={profile} />
				</motion.div>

				{/* Right Column: Tabs for Profile Sections */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2, delay: 0.1 }}
					className="lg:col-span-2"
				>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="w-full flex overflow-x-auto h-auto p-1 flex-wrap justify-start gap-1 bg-transparent">
							{tabs.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-grow sm:flex-grow-0"
								>
									<tab.icon className="h-4 w-4" />
									<span className="">{tab.label}</span>
								</TabsTrigger>
							))}
						</TabsList>

						<div className="mt-4">
							<TabsContent value="identity" className="mt-0">
								<IdentitySection
									profile={profile}
									formatDate={formatDate}
									getLabel={getLabel}
								/>
							</TabsContent>

							<TabsContent value="contacts" className="mt-0">
								<ContactsSection profile={profile} getLabel={getLabel} />
							</TabsContent>

							<TabsContent value="family" className="mt-0">
								<FamilySection profile={profile} getLabel={getLabel} />
							</TabsContent>

							<TabsContent value="passport" className="mt-0">
								<PassportSection profile={profile} formatDate={formatDate} />
							</TabsContent>

							<TabsContent value="profession" className="mt-0">
								<ProfessionSection profile={profile} getLabel={getLabel} />
							</TabsContent>
						</div>
					</Tabs>
				</motion.div>
			</div>
		</div>
	);
}

// Info row component
function InfoRow({
	label,
	value,
	icon,
}: {
	label: string;
	value?: string | null;
	icon?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col py-2">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="flex items-center gap-2 font-medium">
				{icon}
				{value || "—"}
			</span>
		</div>
	);
}

// Identity Section
function IdentitySection({
	profile,
	formatDate,
	getLabel,
}: {
	profile: Doc<"profiles">;
	formatDate: (timestamp?: number) => string;
	getLabel: (map: Record<string, string>, code?: string) => string | undefined;
}) {
	const { t } = useTranslation();
	const { identity } = profile;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<User className="h-5 w-5 text-primary" />
					{t("profile.sections.identity")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
					<InfoRow
						label={t("profile.fields.lastName")}
						value={identity?.lastName}
					/>
					<InfoRow
						label={t("profile.fields.firstName")}
						value={identity?.firstName}
					/>
					<InfoRow
						label={t("profile.fields.birthDate")}
						value={formatDate(identity?.birthDate)}
					/>
					<InfoRow
						label={t("profile.fields.birthPlace")}
						value={identity?.birthPlace}
					/>
					<InfoRow
						label={t("profile.fields.birthCountry")}
						value={getLabel(COUNTRY_LABELS, identity?.birthCountry)}
					/>
					<InfoRow
						label={t("profile.fields.gender")}
						value={getLabel(GENDER_LABELS, identity?.gender)}
					/>
					<InfoRow
						label={t("profile.fields.nationality")}
						value={getLabel(COUNTRY_LABELS, identity?.nationality)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

// Contacts Section
function ContactsSection({
	profile,
	getLabel,
}: {
	profile: Doc<"profiles">;
	getLabel: (map: Record<string, string>, code?: string) => string | undefined;
}) {
	const { t } = useTranslation();
	const { contacts, addresses, countryOfResidence } = profile;

	return (
		<div className="space-y-4">
			{/* Contact Info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Phone className="h-5 w-5 text-primary" />
						{t("profile.sections.contact")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
						<InfoRow
							label={t("profile.fields.email")}
							value={contacts?.email}
							icon={<Mail className="h-4 w-4 text-muted-foreground" />}
						/>
						<InfoRow
							label={t("profile.fields.phone")}
							value={contacts?.phone}
							icon={<Phone className="h-4 w-4 text-muted-foreground" />}
						/>
						<InfoRow
							label={t("profile.fields.countryOfResidence")}
							value={getLabel(COUNTRY_LABELS, countryOfResidence)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Addresses */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<MapPin className="h-5 w-5 text-primary" />
						{t("profile.sections.addresses")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{addresses?.residence && (
						<div>
							<h4 className="text-sm font-medium text-muted-foreground mb-2">
								{t("profile.addresses.residence")}
							</h4>
							<p className="font-medium">
								{[
									addresses.residence.street,
									addresses.residence.postalCode,
									addresses.residence.city,
									getLabel(COUNTRY_LABELS, addresses.residence.country),
								]
									.filter(Boolean)
									.join(", ") || "—"}
							</p>
						</div>
					)}
					{addresses?.homeland && (
						<>
							<Separator />
							<div>
								<h4 className="text-sm font-medium text-muted-foreground mb-2">
									{t("profile.addresses.homeland")}
								</h4>
								<p className="font-medium">
									{[
										addresses.homeland.street,
										addresses.homeland.postalCode,
										addresses.homeland.city,
										getLabel(COUNTRY_LABELS, addresses.homeland.country),
									]
										.filter(Boolean)
										.join(", ") || "—"}
								</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Emergency Contacts */}
			{(contacts?.emergencyResidence || contacts?.emergencyHomeland) && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Users className="h-5 w-5 text-primary" />
							{t("profile.sections.emergencyContacts")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{contacts?.emergencyResidence && (
							<div>
								<h4 className="text-sm font-medium text-muted-foreground mb-2">
									{t("profile.emergency.residence")}
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
									<InfoRow
										label={t("common.name")}
										value={[
											contacts.emergencyResidence.firstName,
											contacts.emergencyResidence.lastName,
										]
											.filter(Boolean)
											.join(" ")}
									/>
									<InfoRow
										label={t("profile.fields.phone")}
										value={contacts.emergencyResidence.phone}
									/>
									<InfoRow
										label={t("profile.fields.relationship")}
										value={contacts.emergencyResidence.relationship}
									/>
								</div>
							</div>
						)}
						{contacts?.emergencyHomeland && (
							<>
								<Separator />
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-2">
										{t("profile.emergency.homeland")}
									</h4>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
										<InfoRow
											label={t("common.name")}
											value={[
												contacts.emergencyHomeland.firstName,
												contacts.emergencyHomeland.lastName,
											]
												.filter(Boolean)
												.join(" ")}
										/>
										<InfoRow
											label={t("profile.fields.phone")}
											value={contacts.emergencyHomeland.phone}
										/>
										<InfoRow
											label={t("profile.fields.relationship")}
											value={contacts.emergencyHomeland.relationship}
										/>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// Family Section
function FamilySection({
	profile,
	getLabel,
}: {
	profile: Doc<"profiles">;
	getLabel: (map: Record<string, string>, code?: string) => string | undefined;
}) {
	const { t } = useTranslation();
	const { family } = profile;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Users className="h-5 w-5 text-primary" />
					{t("profile.sections.family")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<InfoRow
					label={t("profile.fields.maritalStatus")}
					value={getLabel(MARITAL_STATUS_LABELS, family?.maritalStatus)}
				/>

				{family?.spouse &&
					(family.spouse.firstName || family.spouse.lastName) && (
						<>
							<Separator />
							<div>
								<h4 className="text-sm font-medium text-muted-foreground mb-2">
									{t("profile.family.spouse")}
								</h4>
								<p className="font-medium">
									{[family.spouse.firstName, family.spouse.lastName]
										.filter(Boolean)
										.join(" ") || "—"}
								</p>
							</div>
						</>
					)}

				<Separator />
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<h4 className="text-sm font-medium text-muted-foreground mb-2">
							{t("profile.family.father")}
						</h4>
						<p className="font-medium">
							{[family?.father?.firstName, family?.father?.lastName]
								.filter(Boolean)
								.join(" ") || "—"}
						</p>
					</div>
					<div>
						<h4 className="text-sm font-medium text-muted-foreground mb-2">
							{t("profile.family.mother")}
						</h4>
						<p className="font-medium">
							{[family?.mother?.firstName, family?.mother?.lastName]
								.filter(Boolean)
								.join(" ") || "—"}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Passport Section
function PassportSection({
	profile,
	formatDate,
}: {
	profile: Doc<"profiles">;
	formatDate: (timestamp?: number) => string;
}) {
	const { t } = useTranslation();
	const { passportInfo } = profile;

	const isExpired =
		passportInfo?.expiryDate && passportInfo.expiryDate < Date.now();
	const isExpiringSoon =
		passportInfo?.expiryDate &&
		passportInfo.expiryDate < Date.now() + 90 * 24 * 60 * 60 * 1000 &&
		!isExpired;

	return (
		<Card
			className={cn(
				isExpired && "border-rose-300 dark:border-rose-700",
				isExpiringSoon &&
					!isExpired &&
					"border-amber-300 dark:border-amber-700",
			)}
		>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FileText className="h-5 w-5 text-primary" />
					{t("profile.sections.passport")}
					{isExpired && (
						<Badge variant="destructive" className="ml-1">
							{t("profile.passport.expired")}
						</Badge>
					)}
					{isExpiringSoon && !isExpired && (
						<Badge
							variant="secondary"
							className="ml-1 bg-amber-100 text-amber-700"
						>
							{t("profile.passport.expiringSoon")}
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{passportInfo?.number ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
						<InfoRow
							label={t("profile.passport.number")}
							value={passportInfo.number}
						/>
						<InfoRow
							label={t("profile.passport.authority")}
							value={passportInfo.issuingAuthority}
						/>
						<InfoRow
							label={t("profile.passport.issueDate")}
							value={formatDate(passportInfo.issueDate)}
						/>
						<InfoRow
							label={t("profile.passport.expiryDate")}
							value={formatDate(passportInfo.expiryDate)}
						/>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("profile.passport.notProvided")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

// Profession Section
function ProfessionSection({
	profile,
	getLabel,
}: {
	profile: Doc<"profiles">;
	getLabel: (map: Record<string, string>, code?: string) => string | undefined;
}) {
	const { t } = useTranslation();
	const { profession } = profile;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Briefcase className="h-5 w-5 text-primary" />
					{t("profile.sections.profession")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{profession?.status || profession?.title ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
						<InfoRow
							label={t("profile.profession.status")}
							value={getLabel(PROFESSION_STATUS_LABELS, profession?.status)}
						/>
						<InfoRow
							label={t("profile.profession.title")}
							value={profession?.title}
						/>
						<InfoRow
							label={t("profile.profession.employer")}
							value={profession?.employer}
						/>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("profile.profession.notProvided")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

// Documents Section
function DocumentsSection({ profile }: { profile: Doc<"profiles"> }) {
	const { t } = useTranslation();
	const convex = useConvex();

	const documentIds = (() => {
		const docs = profile.documents;
		if (!docs) return [];
		if (Array.isArray(docs)) return docs as Id<"documents">[];
		return Object.values(docs).filter(
			(id): id is Id<"documents"> => typeof id === "string",
		);
	})();

	const { data: documents } = useAuthenticatedConvexQuery(
		api.functions.documents.getDocumentsByIds,
		{ ids: documentIds },
	);

	const handleDownload = async (storageId: Id<"_storage">) => {
		try {
			const url = await convex.query(api.functions.documents.getUrl, {
				storageId,
			});
			if (url) {
				window.open(url, "_blank");
			}
		} catch {
			toast.error(t("common.error"));
		}
	};

	const getDocumentLabel = (type: string) => {
		const labels: Record<string, string> = {
			birthCertificate: t("documents.birthCertificate"),
			identityPhoto: t("documents.identityPhoto"),
			passport: t("documents.passport"),
			proofOfAddress: t("documents.proofOfAddress"),
			proofOfResidency: t("documents.proofOfResidency"),
			consularCard: t("documents.consularCard"),
		};
		return labels[type] || type;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<FileText className="h-5 w-5 text-primary" />
					{t("profile.sections.documents")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{documents && documents.length > 0 ? (
					<div className="space-y-3">
						{documents.map((doc) => {
							if (!doc) return null;
							return (
								<div
									key={doc._id}
									className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
								>
									<div className="flex items-center gap-3 overflow-hidden">
										<div className="p-2 rounded-lg bg-primary/10 shrink-0">
											<FileText className="h-4 w-4 text-primary" />
										</div>
										<div className="min-w-0">
											<p className="font-medium text-sm truncate">
												{doc.documentType
													? getDocumentLabel(doc.documentType)
													: doc.filename}
											</p>
											{doc.filename && doc.documentType && (
												<p className="text-xs text-muted-foreground truncate">
													{doc.filename}
												</p>
											)}
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="shrink-0"
										onClick={() => handleDownload(doc.storageId)}
									>
										<Download className="h-4 w-4" />
									</Button>
								</div>
							);
						})}
					</div>
				) : (
					<p className="text-muted-foreground text-sm text-center py-4">
						{t("profile.documents.empty")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
