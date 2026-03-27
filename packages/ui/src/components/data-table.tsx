"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** @deprecated Use searchKeys for multi-column smart search */
	searchKey?: string;
	searchKeys?: string[];
	searchPlaceholder?: string;
	filterableColumns?: {
		id: string;
		title: string;
		options: { label: string; value: string }[];
	}[];
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	isLoading?: boolean;
	isPageTransitioning?: boolean;
	totalRowCount?: number;
	pagination?: PaginationState;
	onPaginationChange?: (state: PaginationState) => void;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchKey,
	searchKeys,
	searchPlaceholder,
	searchValue,
	onSearchChange,
	filterableColumns = [],
	isLoading = false,
	isPageTransitioning = false,
	totalRowCount,
	pagination: controlledPagination,
	onPaginationChange,
}: DataTableProps<TData, TValue>) {
	const { t } = useTranslation();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [internalPagination, setInternalPagination] = useState<PaginationState>(
		{
			pageIndex: 0,
			pageSize: 10,
		},
	);

	const resolvedSearchKeys = searchKeys ?? (searchKey ? [searchKey] : []);
	const useGlobalSearch = resolvedSearchKeys.length > 0;

	const isManualPagination = totalRowCount !== undefined;
	const pagination = controlledPagination ?? internalPagination;

	const globalFilterFn = (row: any, _columnId: string, filterValue: string) => {
		if (!filterValue) return true;
		const search = filterValue.toLowerCase();
		return resolvedSearchKeys.some((key) => {
			const value = row.getValue(key);
			return value != null && String(value).toLowerCase().includes(search);
		});
	};

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...(!isManualPagination && {
			getPaginationRowModel: getPaginationRowModel(),
		}),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn,
		filterFns: {
			fuzzy: (row, columnId, filterValue) => {
				const value = row.getValue(columnId);
				return String(value)
					.toLowerCase()
					.includes(String(filterValue).toLowerCase());
			},
		},
		...(isManualPagination && {
			manualPagination: true,
			rowCount: totalRowCount,
		}),
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
			...(useGlobalSearch && { globalFilter }),
		},
		onPaginationChange: (updater) => {
			const newState =
				typeof updater === "function" ? updater(pagination) : updater;
			if (onPaginationChange) {
				onPaginationChange(newState);
			} else {
				setInternalPagination(newState);
			}
		},
	});

	return (
		<div className="space-y-4">
			<DataTableToolbar
				table={table}
				searchKey={searchKey}
				useGlobalSearch={useGlobalSearch}
				globalFilter={globalFilter}
				onGlobalFilterChange={setGlobalFilter}
				searchPlaceholder={searchPlaceholder}
				searchValue={searchValue}
				onSearchChange={onSearchChange}
				filterableColumns={filterableColumns}
			/>
			<div className="relative rounded-md border overflow-x-auto">
				{isPageTransitioning && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-md transition-opacity duration-200">
						<div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg shadow-lg border">
							<Loader2 className="h-4 w-4 animate-spin text-primary" />
							<span className="text-sm text-muted-foreground font-medium">
								{t("superadmin.common.loading")}
							</span>
						</div>
					</div>
				)}
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody
						className={
							isPageTransitioning
								? "opacity-40 transition-opacity duration-150"
								: "transition-opacity duration-150"
						}
					>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{t("superadmin.common.loading")}
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{t("superadmin.table.noResults")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
