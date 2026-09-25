import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type PunctualityResponse = {
    month: string;
    thresholds: number[];
    agencies: { agency: string; stops: number; totalAbsDelay: number; buckets: Record<string, number> }[];
};

const BUCKET_CLASSES = ["on-time", "delayed-slight", "delayed-minor", "delayed-moderate", "delayed-critical"];

const cssVar = (name: string, fallback: string) =>
    (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()) || fallback;

// Share of stop calls per |delay| bucket and operator for one month (/history/punctuality).
export const PunctualityChart = ({ data, agencyNames }: { data: PunctualityResponse; agencyNames: Record<string, string> }) => {
    const labels = useMemo(() => {
        const bounds = data.thresholds;
        return [
            `do ${bounds[0]} min`,
            ...bounds.slice(1).map((bound, index) => `${bounds[index]}–${bound} min`),
            `ponad ${bounds[bounds.length - 1]} min`,
        ];
    }, [data.thresholds]);

    const rows = useMemo(
        () =>
            data.agencies
                .filter((agency) => agency.stops > 0)
                .sort((a, b) => b.stops - a.stops)
                .slice(0, 12)
                .map((agency) => {
                    const row: Record<string, string | number> = {
                        name: agencyNames[agency.agency] ?? agency.agency,
                        stops: agency.stops,
                        avg: Math.round((agency.totalAbsDelay / agency.stops / 60) * 10) / 10,
                    };
                    labels.forEach((label, index) => {
                        row[label] = Math.round(((agency.buckets[`threshold${index}`] ?? 0) / agency.stops) * 1000) / 10;
                    });
                    return row;
                }),
        [data, labels, agencyNames],
    );

    if (rows.length === 0) return <Typography variant="body2">Brak danych o punktualności w tym miesiącu.</Typography>;

    return (
        <Box>
            <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 44 + 80)}>
                <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 5 }} stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value: number) => `${Math.round(value * 100)}%`} tick={{ fill: "var(--default-text)", fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: "var(--default-text)", fontSize: 11 }} />
                    <Tooltip
                        formatter={(value: number, name: string) => [`${value}%`, name]}
                        contentStyle={{ background: "var(--default-bg)", color: "var(--default-text)", border: "1px solid var(--neutral-light)", fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {labels.map((label, index) => (
                        <Bar key={label} dataKey={label} stackId="a" fill={cssVar(BUCKET_CLASSES[Math.min(index, BUCKET_CLASSES.length - 1)], "#888")} isAnimationActive={false} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {rows.map((row) => (
                    <li key={row.name as string}>
                        <Typography variant="caption">
                            <strong>{row.name}</strong>: średnio {String(row.avg).replace(".", ",")} min odchyłki, {(row.stops as number).toLocaleString("pl-PL")} odjazdów z przystanków
                        </Typography>
                    </li>
                ))}
            </Box>
        </Box>
    );
};
