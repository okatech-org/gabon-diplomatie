"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
	Briefcase,
	Building2,
	Calendar,
	ClipboardList,
	LifeBuoy,
	Lock,
	Mail,
	Menu,
	Plus,
	ScrollText,
	Settings,
	User,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
	title: string;
	url: string;
	icon: React.ElementType;
}

interface NavSection {
	label: string;
	items: NavItem[];
}

export function MobileNavBar() {
	const location = useLocation();
	const { t } = useTranslation();
	const [sheetOpen, setSheetOpen] = useState(false);

	// All links organized in sections for the sheet
	const allSections: NavSection[] = [
		{
			label: t("mySpace.nav.sectionIdentity"),
			items: [
				{
					title: t("mySpace.nav.profile"),
					url: "/my-space",
					icon: User,
				},
				{
					title: t("mySpace.nav.icv"),
					url: "/my-space/cv",
					icon: ScrollText,
				},
				{
					title: t("mySpace.nav.vault"),
					url: "/my-space/vault",
					icon: Lock,
				},
				{
					title: t("mySpace.nav.iboite"),
					url: "/my-space/iboite",
					icon: Mail,
				},
			],
		},
		{
			label: t("mySpace.nav.sectionServices"),
			items: [
				{
					title: t("mySpace.nav.catalog"),
					url: "/my-space/services",
					icon: Briefcase,
				},
				{
					title: t("mySpace.nav.myRequests"),
					url: "/my-space/requests",
					icon: ClipboardList,
				},
				{
					title: t("mySpace.nav.appointments"),
					url: "/my-space/appointments",
					icon: Calendar,
				},
				{
					title: t("mySpace.nav.companies"),
					url: "/my-space/companies",
					icon: Building2,
				},
				{
					title: t("mySpace.nav.associations"),
					url: "/my-space/associations",
					icon: Users,
				},
				{
					title: t("mySpace.nav.support"),
					url: "/my-space/support",
					icon: LifeBuoy,
				},
				{
					title: t("mySpace.nav.settings"),
					url: "/my-space/settings",
					icon: Settings,
				},
			],
		},
	];

	const isActive = (url: string) => {
		if (url === "/my-space") {
			return location.pathname === "/my-space" || location.pathname === "/my-space/";
		}
		return location.pathname.startsWith(url);
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setSheetOpen((prev) => !prev)}
				className={cn(
					"fixed bottom-5 right-4 z-50 md:hidden",
					"flex items-center justify-center",
					"h-12 w-12 rounded-full shadow-lg",
					"bg-primary text-primary-foreground",
					"active:scale-95 transition-all duration-200",
					sheetOpen && "rotate-90",
				)}
				aria-label={t("mySpace.nav.navigation")}
			>
				{sheetOpen ? <X className="size-5" /> : <Menu className="size-5" />}
			</button>

			{/* Navigation sheet */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] px-4">
					<SheetHeader className="pb-3 pt-2">
						<SheetTitle className="text-base">
							{t("mySpace.nav.navigation")}
						</SheetTitle>
					</SheetHeader>
					<div className="overflow-y-auto space-y-5 pb-10">
						{allSections.map((section) => (
							<div key={section.label}>
								<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 mb-2.5">
									{section.label}
								</p>
								<div className="grid grid-cols-3 gap-2.5">
									{section.items.map((item) => (
										<Link
											key={item.url}
											to={item.url}
											onClick={() => setSheetOpen(false)}
											className={cn(
												"flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl transition-all text-center h-auto min-h-[90px]",
												isActive(item.url)
													? "bg-primary/10 text-primary"
													: "bg-muted/50 text-muted-foreground hover:bg-muted",
											)}
										>
											<item.icon className="size-6" />
											<span className="text-[11px] font-medium leading-tight">
												{item.title}
											</span>
										</Link>
									))}
								</div>
							</div>
						))}
					</div>

					{/* Fixed Bottom Action in Menu */}
					<div className="pb-4 mt-auto">
						<Button
							variant="secondary"
							className="w-full h-12 rounded-xl text-base font-medium"
							onClick={() => setSheetOpen(false)}
							asChild
						>
							<Link to="/my-space/services">
								<Plus className="mr-2 h-5 w-5" />
								{t("mySpace.actions.newRequest", "Nouvelle demande")}
							</Link>
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
