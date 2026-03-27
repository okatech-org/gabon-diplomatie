import { CountryCode, countryCodes, FamilyLink } from "@convex/lib/constants";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ProfileFormValues } from "@/lib/validation/profile";

interface ContactsStepProps {
	control: Control<ProfileFormValues>;
	errors?: FieldErrors<ProfileFormValues>;
}

function EmergencyContactSection({
	control,
	namePrefix,
	title,
	sectionName,
	t,
}: {
	control: Control<ProfileFormValues>;
	namePrefix: "contacts.emergencyResidence" | "contacts.emergencyHomeland";
	title: string;
	sectionName: "residence" | "homeland";
	t: TFunction<"translation", undefined>;
}) {
	return (
		<FieldSet>
			<FieldLegend>{title}</FieldLegend>
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Controller
					name={`${namePrefix}.firstName` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-firstName-error`;
						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={`${namePrefix}-firstName`}>
									{t("profile.fields.firstName")}
								</FieldLabel>
								<Input
									id={`${namePrefix}-firstName`}
									autoComplete={`section-${sectionName} given-name`}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
									{...field}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
				<Controller
					name={`${namePrefix}.lastName` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-lastName-error`;
						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={`${namePrefix}-lastName`}>
									{t("profile.fields.lastName")}
								</FieldLabel>
								<Input
									id={`${namePrefix}-lastName`}
									autoComplete={`section-${sectionName} family-name`}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
									{...field}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
				<Controller
					name={`${namePrefix}.phone` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-phone-error`;
						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={`${namePrefix}-phone`}>
									{t("profile.fields.phone")}
								</FieldLabel>
								<Input
									id={`${namePrefix}-phone`}
									type="tel"
									autoComplete={`section-${sectionName} tel`}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
									{...field}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
				<Controller
					name={`${namePrefix}.email` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-email-error`;
						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={`${namePrefix}-email`}>
									{t("profile.fields.email")}
								</FieldLabel>
								<Input
									id={`${namePrefix}-email`}
									type="email"
									autoComplete={`section-${sectionName} email`}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
									{...field}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
				<Controller
					name={`${namePrefix}.relationship` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-relationship-error`;
						return (
							<Field
								className="md:col-span-2"
								data-invalid={fieldState.invalid}
							>
								<FieldLabel htmlFor={`${namePrefix}-relationship`}>
									{t("profile.fields.relationship")}
								</FieldLabel>
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger
										id={`${namePrefix}-relationship`}
										aria-invalid={fieldState.invalid}
										aria-describedby={fieldState.invalid ? errorId : undefined}
									>
										<SelectValue
											placeholder={t("registration.labels.selectPlaceholder")}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={FamilyLink.Father}>
											{t("profile.relationship.father")}
										</SelectItem>
										<SelectItem value={FamilyLink.Mother}>
											{t("profile.relationship.mother")}
										</SelectItem>
										<SelectItem value={FamilyLink.Spouse}>
											{t("profile.relationship.spouse")}
										</SelectItem>
										<SelectItem value={FamilyLink.BrotherSister}>
											{t("profile.relationship.brotherSister")}
										</SelectItem>
										<SelectItem value={FamilyLink.Child}>
											{t("profile.relationship.child")}
										</SelectItem>
										<SelectItem value={FamilyLink.LegalGuardian}>
											{t("profile.relationship.legalGuardian")}
										</SelectItem>
										<SelectItem value={FamilyLink.Other}>
											{t("profile.relationship.other")}
										</SelectItem>
									</SelectContent>
								</Select>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
			</FieldGroup>
		</FieldSet>
	);
}

function AddressSection({
	control,
	namePrefix,
	title,
	sectionName,
	countryOptions,
	t,
}: {
	control: Control<ProfileFormValues>;
	namePrefix: "addresses.homeland" | "addresses.residence";
	title: string;
	sectionName: "homeland" | "residence";
	countryOptions: Array<{ value: string; label: string }>;
	t: TFunction<"translation", undefined>;
}) {
	return (
		<FieldSet>
			<FieldLegend>{title}</FieldLegend>
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Controller
					name={`${namePrefix}.country` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-country-error`;
						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={`${namePrefix}-country`}>
									{t("profile.fields.country")}
								</FieldLabel>
								<Combobox
									options={countryOptions}
									value={field.value}
									onValueChange={field.onChange}
									placeholder={t("registration.labels.selectPlaceholder")}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
				<Controller
					name={`${namePrefix}.city` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-city-error`;
						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={`${namePrefix}-city`}>
									{t("profile.fields.city")}
								</FieldLabel>
								<Input
									id={`${namePrefix}-city`}
									autoComplete={`section-${sectionName} address-level2`}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
									{...field}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
				<Controller
					name={`${namePrefix}.postalCode` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-postalCode-error`;
						return (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={`${namePrefix}-postalCode`}>
									{t("common.postalCode")}
								</FieldLabel>
								<Input
									id={`${namePrefix}-postalCode`}
									autoComplete={`section-${sectionName} postal-code`}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
									{...field}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
				<Controller
					name={`${namePrefix}.street` as any}
					control={control}
					render={({ field, fieldState }) => {
						const errorId = `${namePrefix}-street-error`;
						return (
							<Field
								className="md:col-span-2"
								data-invalid={fieldState.invalid}
							>
								<FieldLabel htmlFor={`${namePrefix}-street`}>
									{t("profile.fields.street")}
								</FieldLabel>
								<Input
									id={`${namePrefix}-street`}
									autoComplete={`section-${sectionName} street-address`}
									aria-invalid={fieldState.invalid}
									aria-describedby={fieldState.invalid ? errorId : undefined}
									{...field}
								/>
								{fieldState.invalid && (
									<FieldError id={errorId} errors={[fieldState.error]} />
								)}
							</Field>
						);
					}}
				/>
			</FieldGroup>
		</FieldSet>
	);
}

export function ContactsStep({ control }: ContactsStepProps) {
	const { t } = useTranslation();
	const countryOptions = useMemo(() => {
		return Object.values(CountryCode).map((code) => ({
			value: code,
			label: t(`superadmin.countryCodes.${code}`, code),
		}));
	}, [t]);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("registration.steps.contacts.title")}</CardTitle>
					<CardDescription>
						{t("registration.steps.contacts.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Pays de résidence - champ prioritaire pour les services consulaires */}
					<FieldSet>
						<FieldLegend>{t("profile.sections.residenceCountry")}</FieldLegend>
						<FieldGroup>
							<Controller
								name="countryOfResidence"
								control={control}
								render={({ field, fieldState }) => {
									const errorId = "countryOfResidence-error";
									return (
										<Field
											className="max-w-md"
											data-invalid={fieldState.invalid}
										>
											<FieldLabel htmlFor="countryOfResidence">
												{t("profile.fields.countryOfResidence")}
											</FieldLabel>
											<Combobox
												options={countryOptions}
												value={field.value}
												onValueChange={field.onChange}
												placeholder={t("registration.labels.selectPlaceholder")}
												aria-invalid={fieldState.invalid}
												aria-describedby={
													fieldState.invalid ? errorId : undefined
												}
											/>
											<p className="text-sm text-muted-foreground mt-1">
												{t("profile.fields.countryOfResidenceDesc")}
											</p>
											{fieldState.invalid && (
												<FieldError id={errorId} errors={[fieldState.error]} />
											)}
										</Field>
									);
								}}
							/>
						</FieldGroup>
					</FieldSet>

					<FieldSet>
						<FieldGroup className="grid gap-4 md:grid-cols-2">
							<Controller
								name="contacts.email"
								control={control}
								render={({ field, fieldState }) => {
									const errorId = "contacts-email-error";
									return (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor="contacts-email">
												{t("profile.fields.email")}
											</FieldLabel>
											<Input
												id="contacts-email"
												type="email"
												autoComplete="email"
												aria-invalid={fieldState.invalid}
												aria-describedby={
													fieldState.invalid ? errorId : undefined
												}
												{...field}
											/>
											{fieldState.invalid && (
												<FieldError id={errorId} errors={[fieldState.error]} />
											)}
										</Field>
									);
								}}
							/>
							<Controller
								name="contacts.phone"
								control={control}
								render={({ field, fieldState }) => {
									const errorId = "contacts-phone-error";
									return (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor="contacts-phone">
												{t("profile.fields.phone")}
											</FieldLabel>
											<Input
												id="contacts-phone"
												type="tel"
												autoComplete="tel"
												aria-invalid={fieldState.invalid}
												aria-describedby={
													fieldState.invalid ? errorId : undefined
												}
												{...field}
											/>
											{fieldState.invalid && (
												<FieldError id={errorId} errors={[fieldState.error]} />
											)}
										</Field>
									);
								}}
							/>
						</FieldGroup>
					</FieldSet>

					<AddressSection
						control={control}
						namePrefix="addresses.homeland"
						title={t("profile.sections.addressHome")}
						sectionName="homeland"
						countryOptions={countryOptions}
						t={t}
					/>

					<AddressSection
						control={control}
						namePrefix="addresses.residence"
						title={t("profile.sections.addressAbroad")}
						sectionName="residence"
						countryOptions={countryOptions}
						t={t}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("profile.sections.emergencyContacts")}</CardTitle>
					<CardDescription>
						{t("profile.sections.emergencyContactsDesc")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<EmergencyContactSection
						control={control}
						namePrefix="contacts.emergencyResidence"
						title={t("profile.sections.emergencyResidence")}
						sectionName="residence"
						t={t}
					/>

					<EmergencyContactSection
						control={control}
						namePrefix="contacts.emergencyHomeland"
						title={t("profile.sections.emergencyHomeland")}
						sectionName="homeland"
						t={t}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
