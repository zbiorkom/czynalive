import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    Button,
    Checkbox,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
} from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";

export type Column<T> = {
    field: string;
    header: ReactNode;
    value: (row: T) => string | number | null | undefined;
    render?: (row: T) => ReactNode;
    minWidth?: number;
    align?: "left" | "right" | "center";
    sortable?: boolean;
    csv?: (row: T) => string | number;
};

type Props<T> = {
    rows: T[];
    columns: Column<T>[];
    getRowId: (row: T) => string;
    initialSort?: { field: string; direction: "asc" | "desc" };
    height?: number;
    quickFilter?: boolean;
    csvFileName?: string;
    selection?: { selected: Set<string>; onChange: (selected: Set<string>) => void };
    pageSize?: number;
};

const collator = new Intl.Collator("pl", { numeric: true, sensitivity: "base" });

export const compareValues = (a: unknown, b: unknown) => {
    if (a === b) return 0;
    if (a === null || a === undefined || a === "") return 1;
    if (b === null || b === undefined || b === "") return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return collator.compare(String(a), String(b));
};

// Lightweight stand-in for the MUI X DataGrid used by czynaczas: sorting, quick filter, CSV export, row selection.
export function DataTable<T>({ rows, columns, getRowId, initialSort, height = 600, quickFilter = true, csvFileName, selection, pageSize }: Props<T>) {
    const [sort, setSort] = useState(initialSort);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize ?? 0);

    const filtered = useMemo(() => {
        const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        let result = rows;
        if (words.length) {
            result = rows.filter((row) => {
                const text = columns.map((column) => String(column.value(row) ?? "")).join(" ").toLowerCase();
                return words.every((word) => text.includes(word));
            });
        }
        if (sort) {
            const column = columns.find((entry) => entry.field === sort.field);
            if (column) {
                const direction = sort.direction === "asc" ? 1 : -1;
                result = [...result].sort((a, b) => {
                    const av = column.value(a);
                    const bv = column.value(b);
                    if (av === null || av === undefined || av === "") return 1;
                    if (bv === null || bv === undefined || bv === "") return -1;
                    return compareValues(av, bv) * direction;
                });
            }
        }
        return result;
    }, [rows, columns, query, sort]);

    const visible = rowsPerPage ? filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage) : filtered;

    const exportCsv = () => {
        const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const header = columns.map((column) => escape(typeof column.header === "string" ? column.header : column.field)).join(",");
        const lines = filtered.map((row) => columns.map((column) => escape(column.csv ? column.csv(row) : column.value(row))).join(","));
        const blob = new Blob(["﻿" + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${csvFileName}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const allSelected = !!selection && filtered.length > 0 && filtered.every((row) => selection.selected.has(getRowId(row)));

    return (
        <Paper variant="outlined" sx={{ display: "flex", flexDirection: "column", maxHeight: rowsPerPage ? undefined : height, overflow: "hidden" }}>
            {(quickFilter || csvFileName) && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, flexWrap: "wrap" }}>
                    {csvFileName && (
                        <Button size="small" startIcon={<FileDownloadIcon />} onClick={exportCsv}>
                            Eksportuj
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    {quickFilter && (
                        <TextField
                            size="small"
                            variant="standard"
                            placeholder="Szukaj…"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(0);
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    )}
                </Box>
            )}
            <TableContainer sx={{ flex: 1, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            {selection && (
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        size="small"
                                        checked={allSelected}
                                        indeterminate={!allSelected && selection.selected.size > 0}
                                        onChange={() => selection.onChange(allSelected ? new Set() : new Set(filtered.map(getRowId)))}
                                    />
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell key={column.field} align={column.align} sx={{ minWidth: column.minWidth, fontWeight: 500, whiteSpace: "nowrap" }}>
                                    {column.sortable === false ? (
                                        column.header
                                    ) : (
                                        <TableSortLabel
                                            active={sort?.field === column.field}
                                            direction={sort?.field === column.field ? sort.direction : "asc"}
                                            onClick={() =>
                                                setSort((prev) =>
                                                    prev?.field === column.field
                                                        ? { field: column.field, direction: prev.direction === "asc" ? "desc" : "asc" }
                                                        : { field: column.field, direction: "asc" },
                                                )
                                            }
                                        >
                                            {column.header}
                                        </TableSortLabel>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visible.map((row) => {
                            const id = getRowId(row);
                            return (
                                <TableRow key={id} hover>
                                    {selection && (
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                size="small"
                                                checked={selection.selected.has(id)}
                                                onChange={() => {
                                                    const next = new Set(selection.selected);
                                                    if (next.has(id)) next.delete(id);
                                                    else next.add(id);
                                                    selection.onChange(next);
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    {columns.map((column) => (
                                        <TableCell key={column.field} align={column.align} sx={{ minWidth: column.minWidth }}>
                                            {column.render ? column.render(row) : column.value(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })}
                        {visible.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length + (selection ? 1 : 0)} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                    Brak wierszy
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {!!rowsPerPage && (
                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={Math.min(page, Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1))}
                    onPageChange={(_, next) => setPage(next)}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10, 20, 50]}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(+event.target.value);
                        setPage(0);
                    }}
                />
            )}
        </Paper>
    );
}
