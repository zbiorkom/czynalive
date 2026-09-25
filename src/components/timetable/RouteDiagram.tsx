import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SensorsIcon from "@mui/icons-material/Sensors";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { Box, IconButton, List, ListItem, ListItemButton, Typography } from "@mui/material";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EGraphPlacement, EStopTuple, EVehiclePosition, type StopTuple, type VehiclePosition } from "@/api/types";
import { VehicleTypeIcon, vehicleTypeName } from "@/components/departures/VehicleTypeIcon";
import { parseVehicleId } from "@/lib/transit";
import type { VehiclePlacement } from "./useRouteVehicles";

export type RouteBranch = { from: number; to: number; stops: StopTuple[]; collapse: [number, number] | null };
export type RouteDirection = { headsign: string; trunk: StopTuple[]; branches: RouteBranch[] };

type Row =
    | { kind: "stop"; key: string; stop: StopTuple; branch: number; position: number; number?: number; trunkAbove: boolean; trunkBelow: boolean }
    | { kind: "collapsed"; key: string; branch: number; count: number; trunkAbove: boolean; trunkBelow: boolean };

const CIRCLE = 22;
const BORDER = 2;
const LINE = 2;

export const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}h${rest > 0 ? ` ${rest}min` : ""}` : `${rest}min`;
};

const buildRows = (direction: RouteDirection, expanded: Set<number>): Row[] => {
    const rows: Row[] = [];
    const trunkCount = direction.trunk.length;
    const pushBranch = (branchIndex: number, trunkAbove: boolean, trunkBelow: boolean) => {
        const branch = direction.branches[branchIndex];
        const collapse = branch.collapse && !expanded.has(branchIndex) ? branch.collapse : null;
        branch.stops.forEach((stop, position) => {
            if (collapse && position >= collapse[0] && position <= collapse[1]) {
                if (position === collapse[0]) rows.push({ kind: "collapsed", key: `c${branchIndex}`, branch: branchIndex, count: collapse[1] - collapse[0] + 1, trunkAbove, trunkBelow });
                return;
            }
            rows.push({ kind: "stop", key: `${branchIndex}:${position}`, stop, branch: branchIndex, position, trunkAbove, trunkBelow });
        });
    };
    direction.trunk.forEach((stop, position) => {
        direction.branches.forEach((branch, index) => {
            if (branch.from === -1 && (branch.to === position || (branch.to === -1 && position === 0))) pushBranch(index, position > 0, true);
        });
        rows.push({ kind: "stop", key: `-1:${position}`, stop, branch: -1, position, number: position + 1, trunkAbove: position > 0, trunkBelow: position < trunkCount - 1 });
        direction.branches.forEach((branch, index) => {
            if (branch.from === position) pushBranch(index, true, position < trunkCount - 1);
        });
    });
    return rows;
};

type Props = {
    city: string;
    dataCity: string;
    routeId: string;
    routeType: number;
    direction: RouteDirection;
    minutes?: Map<string, number>;
    positions: VehiclePosition[];
    placements: VehiclePlacement[];
    showVehicles: boolean;
    activeStopId?: string;
    onStopClick?: (stop: StopTuple) => void;
    stopLinkFor: (stop: StopTuple) => string;
};

export const RouteDiagram = ({ city, routeType, direction, minutes, positions, placements, showVehicles, activeStopId, onStopClick, stopLinkFor }: Props) => {
    const { t } = useTranslation();
    const typeName = vehicleTypeName(routeType);
    const color = `var(--${typeName})`;
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const rows = useMemo(() => buildRows(direction, expanded), [direction, expanded]);
    const rowRefs = useRef(new Map<string, HTMLLIElement>());
    const listRef = useRef<HTMLUListElement>(null);
    const [offsets, setOffsets] = useState<Map<string, [top: number, height: number]>>(new Map());

    useLayoutEffect(() => {
        const measure = () => {
            const next = new Map<string, [number, number]>();
            rowRefs.current.forEach((element, key) => next.set(key, [element.offsetTop, element.offsetHeight]));
            setOffsets(next);
        };
        measure();
        if (!listRef.current || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(measure);
        observer.observe(listRef.current);
        return () => observer.disconnect();
    }, [rows]);

    useEffect(() => {
        if (!activeStopId) return;
        const row = rows.find((entry) => entry.kind === "stop" && entry.stop[EStopTuple.stopId] === activeStopId);
        const element = row ? rowRefs.current.get(row.key) : undefined;
        const scroller = listRef.current?.parentElement;
        if (!element || !scroller) return;
        const top = element.offsetTop - scroller.clientHeight / 2 + element.offsetHeight / 2;
        scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, [activeStopId]);

    const vehicleMarkers = useMemo(() => {
        if (!showVehicles) return [];
        const byId = new Map(positions.map((position) => [position[EVehiclePosition.id], position]));
        const markers: { id: string; top: number; onBranch: boolean; vehicle?: VehiclePosition }[] = [];
        for (const [vehicleId, , placement] of placements) {
            const from = offsets.get(`${placement[EGraphPlacement.fromBranch]}:${placement[EGraphPlacement.fromPosition]}`);
            const to = offsets.get(`${placement[EGraphPlacement.toBranch]}:${placement[EGraphPlacement.toPosition]}`) ?? from;
            const start = from ?? to;
            if (!start || !to) continue;
            const a = start[0] + start[1] / 2;
            const b = to[0] + to[1] / 2;
            markers.push({
                id: vehicleId,
                top: a + ((b - a) * placement[EGraphPlacement.percent]) / 100,
                onBranch: placement[EGraphPlacement.fromBranch] >= 0 && placement[EGraphPlacement.toBranch] >= 0,
                vehicle: byId.get(vehicleId),
            });
        }
        return markers;
    }, [placements, positions, offsets, showVehicles]);

    return (
        <List component="nav" ref={listRef} sx={{ p: 0, mt: 1, position: "relative", overflowX: "hidden" }}>
            {vehicleMarkers.map((marker) => (
                <IconButton
                    key={marker.id}
                    component={Link}
                    to={`/${city}?pojazd=${encodeURIComponent(marker.id)}`}
                    title={marker.vehicle ? `${t("global.vehicleNo")}: ${parseVehicleId(marker.id).number}` : marker.id}
                    size="small"
                    sx={{
                        position: "absolute",
                        top: marker.top - 17,
                        left: 50 + CIRCLE / 2 - 17 + (marker.onBranch ? 24 : 0),
                        width: 34,
                        height: 34,
                        p: "3px",
                        border: "2px solid",
                        borderColor: color,
                        color,
                        backgroundColor: "var(--white)",
                        zIndex: 3,
                        transition: "top 700ms",
                        "&:hover, &:focus": { backgroundColor: "var(--white)" },
                    }}
                >
                    <VehicleTypeIcon routeType={routeType} sx={{ fontSize: "1.2rem", color }} />
                </IconButton>
            ))}
            {rows.map((row) => {
                const isBranch = row.branch >= 0;
                const lineLeft = 50 + CIRCLE / 2 - LINE / 2;
                const trunkLine =
                    row.trunkAbove || row.trunkBelow ? (
                        <Box
                            sx={{
                                position: "absolute",
                                left: lineLeft - LINE / 2,
                                width: LINE * 2,
                                top: row.trunkAbove ? 0 : "50%",
                                bottom: row.trunkBelow ? "-1px" : "50%",
                                backgroundColor: color,
                                zIndex: 1,
                            }}
                        />
                    ) : null;
                if (row.kind === "collapsed") {
                    return (
                        <ListItem key={row.key} disablePadding dense divider sx={{ position: "relative" }}>
                            {trunkLine}
                            <Box sx={{ position: "absolute", left: lineLeft + 24, top: 0, bottom: 0, borderLeft: `${LINE}px dashed ${color}` }} />
                            <ListItemButton sx={{ py: 0.5, pl: `${50 + CIRCLE + 36}px` }} onClick={() => setExpanded((prev) => new Set(prev).add(row.branch))}>
                                <UnfoldMoreIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="caption">{t("plural.stop", { count: row.count })}</Typography>
                            </ListItemButton>
                        </ListItem>
                    );
                }
                const stop = row.stop;
                const active = activeStopId === stop[EStopTuple.stopId];
                const offset = minutes?.get(stop[EStopTuple.stopId]);
                const name = `${stop[EStopTuple.stopName]}${stop[EStopTuple.stopCode] ? ` ${stop[EStopTuple.stopCode]}` : ""}`;
                return (
                    <ListItem
                        key={row.key}
                        ref={(element: HTMLLIElement | null) => {
                            if (element) rowRefs.current.set(row.key, element);
                            else rowRefs.current.delete(row.key);
                        }}
                        disablePadding
                        dense
                        divider
                        sx={{ position: "relative" }}
                    >
                        {trunkLine}
                        {isBranch && <Box sx={{ position: "absolute", left: lineLeft + 24, top: 0, bottom: 0, borderLeft: `${LINE}px dashed ${color}` }} />}
                        <ListItemButton sx={{ py: 0.5, pl: 0, pr: 1, alignItems: "center" }} onClick={() => onStopClick?.(stop)}>
                            <Typography variant="caption" sx={{ wordBreak: "break-word", width: 50, minWidth: 50, textAlign: "center", zIndex: 2 }}>
                                {offset !== undefined ? formatMinutes(offset) : ""}
                            </Typography>
                            <Box sx={{ width: CIRCLE, minWidth: CIRCLE, display: "flex", justifyContent: "center", mr: 1, zIndex: 2, ml: isBranch ? "24px" : 0 }}>
                                {isBranch ? (
                                    <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "var(--default-bg)", border: `3px solid ${color}` }} />
                                ) : (
                                    <Box
                                        sx={{
                                            width: CIRCLE,
                                            height: CIRCLE,
                                            borderRadius: "50%",
                                            backgroundColor: color,
                                            color: "#fff",
                                            border: `${BORDER}px solid var(--default-bg)`,
                                            fontSize: "0.75rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxSizing: "content-box",
                                        }}
                                    >
                                        {row.number}
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1, minWidth: 0, gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: active ? "bold" : "initial", wordBreak: "break-word", fontStyle: isBranch ? "italic" : undefined }}>
                                    {name}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }} onClick={(event) => event.stopPropagation()}>
                                    <IconButton
                                        component={Link}
                                        to={stopLinkFor(stop)}
                                        size="small"
                                        aria-label={t("stopDetails.schedule")}
                                        sx={{ display: "flex", flexDirection: "column", p: 0, mr: 1, color: "var(--default-text)", borderRadius: 1 }}
                                    >
                                        <AccessTimeIcon fontSize="inherit" />
                                        <Typography variant="caption" sx={{ lineHeight: 1 }}>
                                            {t("stopDetails.schedule")}
                                        </Typography>
                                    </IconButton>
                                    <IconButton
                                        component={Link}
                                        to={`/${city}?przystanek=${encodeURIComponent(stop[EStopTuple.stopId])}`}
                                        size="small"
                                        aria-label={t("stopDetails.departures")}
                                        sx={{ display: "flex", flexDirection: "column", p: 0, borderRadius: 1, color: "var(--default-text)" }}
                                    >
                                        <SensorsIcon fontSize="inherit" className="opacity-animate" style={{ color }} />
                                        <Typography variant="caption" sx={{ lineHeight: 1 }}>
                                            {t("stopDetails.departures")}
                                        </Typography>
                                    </IconButton>
                                </Box>
                            </Box>
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
};

export const directionStops = (direction: RouteDirection): StopTuple[] => {
    const stops: StopTuple[] = [...direction.trunk];
    for (const branch of direction.branches) stops.push(...branch.stops);
    return stops;
};

