import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import SignpostIcon from "@mui/icons-material/Signpost";
import TrainIcon from "@mui/icons-material/Train";
import { Box, CircularProgress, ClickAwayListener, IconButton, InputBase, List, ListItemButton, ListSubheader, Paper, Typography } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cityGet } from "@/api/client";
import { ERouteTuple, EStopTuple, type RouteTuple, type StopTupleDetailed } from "@/api/types";
import { RouteChip } from "@/components/departures/RouteChip";
import { formatTime, parseVehicleId } from "@/lib/transit";

type SearchVehicle = [vehicleId: string, route: RouteTuple, brigade: string, headsign: string | null, model: string | null];
type SearchStop = [firstStopId: string, city: string, groupName: string, stops: StopTupleDetailed[]];
type SearchStation = [stopId: string, city: string, name: string];
type SearchRelation = [tripRef: string, route: RouteTuple, shortName: string, departure: number, arrival: number, headsign: string];
type SearchItem = { vehicle?: SearchVehicle; stop?: SearchStop; station?: SearchStation; route?: RouteTuple; relation?: SearchRelation };
type SearchResponse = { results: SearchItem[]; groups: number[]; groupNames: string[] };

type Props = {
    city: string;
    onVehicle: (vehicleId: string, city: string) => void;
    onStop: (stopId: string, city: string) => void;
    onRoute: (route: RouteTuple) => void;
    onRouteTimetable: (route: RouteTuple) => void;
    onTrip: (tripRef: string, city: string) => void;
};

const SECTION_LABELS: Record<string, string> = {
    vehicles: "global.vehicles",
    stops: "global.stops",
    stations: "Stacje kolejowe",
    routes: "global.lines",
    relations: "global.trains",
};

// Global search at the top of the map (§9): vehicles, stops, stations, lines, train relations.
export const SearchBar = ({ city, onVehicle, onStop, onRoute, onRouteTimetable, onTrip }: Props) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        const text = query.trim();
        if (text.length < 1) {
            setResults(null);
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => {
            setLoading(true);
            cityGet<SearchResponse>(city, "/search", { query: text }, controller.signal)
                .then(setResults)
                .catch(() => !controller.signal.aborted && setResults({ results: [], groups: [], groupNames: [] }))
                .finally(() => !controller.signal.aborted && setLoading(false));
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, city]);

    const close = () => {
        setOpen(false);
        setExpanded(null);
    };
    const pick = (action: () => void) => {
        action();
        close();
        (document.activeElement as HTMLElement | null)?.blur();
    };

    const sections: { name: string; items: SearchItem[] }[] = [];
    if (results) {
        let offset = 0;
        results.groups.forEach((count, index) => {
            sections.push({ name: results.groupNames[index], items: results.results.slice(offset, offset + count) });
            offset += count;
        });
    }

    const row = (key: string, content: ReactNode, onClick: () => void, extra?: ReactNode) => (
        <ListItemButton key={key} onClick={onClick} sx={{ gap: 1, py: 0.75 }}>
            {content}
            {extra}
        </ListItemButton>
    );

    const renderItem = (item: SearchItem, index: number) => {
        if (item.vehicle) {
            const [vehicleId, route, brigade, headsign, model] = item.vehicle;
            return row(
                `v${vehicleId}`,
                <>
                    <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} brigade={brigade || undefined} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                            #{parseVehicleId(vehicleId).number} {headsign ? `→ ${headsign}` : ""}
                        </Typography>
                        {model && (
                            <Typography variant="caption" noWrap component="div" sx={{ opacity: 0.75 }}>
                                {model}
                            </Typography>
                        )}
                    </Box>
                </>,
                () => pick(() => onVehicle(vehicleId, route[ERouteTuple.city])),
            );
        }
        if (item.stop) {
            const [firstStopId, stopCity, groupName, stops] = item.stop;
            const key = `s${firstStopId}`;
            const isExpanded = expanded === key;
            return (
                <Box key={key}>
                    {row(
                        key,
                        <>
                            <SignpostIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
                                {groupName}
                            </Typography>
                            {stops.length > 1 && (
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                    {t("plural.stop", { count: stops.length })}
                                </Typography>
                            )}
                        </>,
                        () => (stops.length === 1 ? pick(() => onStop(stops[0][EStopTuple.stopId], stops[0][EStopTuple.city] || stopCity)) : setExpanded(isExpanded ? null : key)),
                    )}
                    {isExpanded &&
                        stops.map((stop) =>
                            row(
                                `${key}-${stop[EStopTuple.stopId]}`,
                                <Box sx={{ pl: 4, minWidth: 0 }}>
                                    <Typography variant="body2" noWrap>
                                        {stop[EStopTuple.stopName]} <b>{stop[EStopTuple.stopCode]}</b>
                                    </Typography>
                                    {(stop[EStopTuple.direction] || stop[EStopTuple.routes]?.length) && (
                                        <Typography variant="caption" component="div" noWrap sx={{ opacity: 0.75 }}>
                                            {stop[EStopTuple.direction] ? `→ ${stop[EStopTuple.direction]} · ` : ""}
                                            {(stop[EStopTuple.routes] ?? []).map((route) => route[ERouteTuple.routeName]).join(", ")}
                                        </Typography>
                                    )}
                                </Box>,
                                () => pick(() => onStop(stop[EStopTuple.stopId], stop[EStopTuple.city] || stopCity)),
                            ),
                        )}
                </Box>
            );
        }
        if (item.station) {
            const [stopId, stationCity, name] = item.station;
            return row(
                `st${stopId}`,
                <>
                    <TrainIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {name}
                    </Typography>
                </>,
                () => pick(() => onStop(stopId, stationCity)),
            );
        }
        if (item.route) {
            const route = item.route;
            return row(
                `r${route[ERouteTuple.city]}${route[ERouteTuple.routeId]}`,
                <>
                    <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" noWrap>
                            {route[ERouteTuple.routeLongName]}
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ opacity: 0.75 }} noWrap>
                            {t("search.showLineVehicles")}
                        </Typography>
                    </Box>
                </>,
                () => pick(() => onRoute(route)),
                <IconButton
                    size="small"
                    aria-label={t("timetables.timetable")}
                    title={t("timetables.timetable")}
                    onClick={(event) => {
                        event.stopPropagation();
                        pick(() => onRouteTimetable(route));
                    }}
                >
                    <CalendarMonthIcon fontSize="small" />
                </IconButton>,
            );
        }
        if (item.relation) {
            const [tripRef, route, shortName, departure, arrival, headsign] = item.relation;
            return row(
                `rel${tripRef}${index}`,
                <>
                    <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                            {shortName} → {headsign}
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ opacity: 0.75 }}>
                            {formatTime(departure)} – {formatTime(arrival)}
                        </Typography>
                    </Box>
                </>,
                () => pick(() => onTrip(tripRef, route[ERouteTuple.city])),
            );
        }
        return null;
    };

    const showResults = open && query.trim().length > 0;

    return (
        <ClickAwayListener onClickAway={close}>
            <Box sx={{ position: "absolute", top: "calc(10px + var(--sat))", left: 10, right: 10, zIndex: 1100, maxWidth: 520 }}>
                <Paper elevation={3} sx={{ display: "flex", alignItems: "center", px: 1, borderRadius: "24px", height: 44 }}>
                    <SearchIcon sx={{ mx: 1, opacity: 0.7 }} />
                    <InputBase
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={(event) => event.key === "Escape" && close()}
                        placeholder={t("search.searchPlaceholder5")}
                        inputProps={{ "aria-label": t("search.search"), type: "search", enterKeyHint: "search" }}
                        sx={{ flex: 1, fontSize: "0.95rem" }}
                    />
                    {loading && <CircularProgress size={18} sx={{ mx: 1 }} />}
                    {query && (
                        <IconButton size="small" aria-label={t("global.clear")} onClick={() => setQuery("")}>
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    )}
                </Paper>
                {showResults && results && (
                    <Paper elevation={4} sx={{ mt: 1, maxHeight: "60dvh", overflowY: "auto", borderRadius: 2 }}>
                        {sections.length === 0 ? (
                            <Typography sx={{ p: 2 }} variant="body2">
                                {t("global.nothingFound")}
                            </Typography>
                        ) : (
                            <List dense disablePadding>
                                {sections.map((section) => (
                                    <Box key={section.name}>
                                        <ListSubheader sx={{ lineHeight: "32px", bgcolor: "background.paper" }}>{t(SECTION_LABELS[section.name] ?? section.name)}</ListSubheader>
                                        {section.items.map(renderItem)}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Paper>
                )}
            </Box>
        </ClickAwayListener>
    );
};
