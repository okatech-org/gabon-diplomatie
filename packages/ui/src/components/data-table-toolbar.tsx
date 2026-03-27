"use client";

import type { Table } from "@tanstack/react-table";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	searchKey?: string;
	searchPlaceholder?: string;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	useGlobalSearch?: boolean;
	globalFilter?: string;
	onGlobalFilterChange?: (value: string) => void;
	filterableColumns?: {
		id: string;
		title: string;
		options: { label: string; value: string }[];
	}[];
}

export function DataTableToolbar<TData>({
	table,
	searchKey,
	searchPlaceholder,
	searchValue,
	onSearchChange,
	useGlobalSearch = false,
	globalFilter = "",
	onGlobalFilterChange,
	filterableColumns = [],
}: DataTableToolbarProps<TData>) {
	const { t } = useTranslation();
	const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;

	const isServerSearch =
		searchValue !== undefined && onSearchChange !== undefined;

	const currentSearchValue = isServerSearch
		? searchValue
		: useGlobalSearch
			? globalFilter
			: ((table.getColumn(searchKey || "")?.getFilterValue() as string) ?? "");

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (isServerSearch) {
			onSearchChange(event.target.value);
		} else if (useGlobalSearch && onGlobalFilterChange) {
			onGlobalFilterChange(event.target.value);
		} else if (searchKey) {
			table.getColumn(searchKey)?.setFilterValue(event.target.value);
		}
	};

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				{(searchKey || isServerSearch || useGlobalSearch) && (
					<Input
						placeholder={searchPlaceholder || t("superadmin.common.search")}
						value={currentSearchValue}
						onChange={handleSearchChange}
						className="h-8 max-w-[150px] lg:max-w-[250px]"
					/>
				)}
				{filterableColumns.map((column) => {
					const tableColumn = table.getColumn(column.id);
					if (!tableColumn) return null;

					return (
						<Select
							key={column.id}
							value={(tableColumn.getFilterValue() as string) ?? "all"}
							onValueChange={(value) =>
								tableColumn.setFilterValue(value === "all" ? undefined : value)
							}
						>
							<SelectTrigger className="h-8">
								<SelectValue placeholder={column.title} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{column.title}</SelectItem>
								{column.options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					);
				})}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => {
							table.resetColumnFilters();
							if (onGlobalFilterChange) onGlobalFilterChange("");
						}}
						className="h-8 px-2 lg:px-3"
					>
						{t("superadmin.common.reset")}
						<X className="ml-1 h-4 w-4" />
					</Button>
				)}
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" className="ml-auto h-8">
						<SlidersHorizontal className="mr-2 h-4 w-4" />
						{t("superadmin.table.columns")}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{table
						.getAllColumns()
						.filter((column) => column.getCanHide())
						.map((column) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
