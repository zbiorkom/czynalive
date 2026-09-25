import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClearIcon from "@mui/icons-material/Clear";
import { Box, Divider, IconButton, InputAdornment, List, ListItemButton, TextField, Typography } from "@mui/material";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cityGet } from "@/api/client";
import { ERouteTuple, EStopTuple, type RouteTuple, type StopTuple, type StopTupleDetailed } from "@/api/types";
import { RouteChip } from "@/components/departures/RouteChip";
import { sortRoutes, TypeCircles } from "./common";

export type SearchStopResult = [firstStopId: string, city: string, groupName: string, stops: StopTupleDetailed[]];
type RawSearch = { stops: SearchStopResult[]; stations: [stopId: string, city: string, name: string][] };

export const MIN_QUERY = 3;

export const useDebounced = <T,>(value: T, delay = 500) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
};

// Stops (posts) matching the query via global search, flattened to detailed tuples.
export const useStopSearch = (city: string, query: string) => {
    const [state, setState] = useState<{ results?: StopTuple[]; loading: boolean; error?: boolean }>({ loading: false });
    useEffect(() => {
        if (query.trim().length < MIN_QUERY) {
            setState({ loading: false });
            return;
        }
        const controller = new AbortController();
        setState({ loading: true });
        cityGet<RawSearch>(city, "/search", { query: query.trim(), raw: true }, controller.signal)
            .then((response) => {
                const results: StopTuple[] = [];
                for (const group of response.stops ?? []) results.push(...(group[3] as unknown as StopTuple[]));
                for (const [stopId, stationCity, name] of response.stations ?? []) {
                    if (!results.some((stop) => stop[EStopTuple.stopId] === stopId)) results.push([stopId, stationCity, name, "", [0, 0], [2], null]);
                }
                setState({ results, loading: false });
            })
            .catch(() => {
                if (!controller.signal.aborted) setState({ loading: false, error: true });
            });
        return () => controller.abort();
    }, [city, query]);
    return state;
};

const MAX_CHIPS = 10;

export const StopItemContent = ({ stop }: { stop: StopTuple | StopTupleDetailed }) => {
    const [expanded, setExpanded] = useState(false);
    const direction = (stop as StopTupleDetailed)[EStopTuple.direction] as string | undefined;
    const routes = sortRoutes(((stop as StopTupleDetailed)[EStopTuple.routes] as RouteTuple[] | undefined) ?? []);
    const shown = expanded ? routes : routes.slice(0, MAX_CHIPS);
    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5, maxWidth: "100%", minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, maxWidth: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, border: "1px solid var(--neutral-light)", borderRadius: "14px", pr: 1.25, height: 28 }}>
                    <TypeCircles types={stop[EStopTuple.vehicleTypes]} size={26} />
                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: "uppercase" }} noWrap>
                        {stop[EStopTuple.stopName]} {stop[EStopTuple.stopCode]}
                    </Typography>
                </Box>
                {direction ? (
                    <Typography variant="body2" color="textSecondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ArrowForwardIcon fontSize="inherit" /> {direction}
                    </Typography>
                ) : null}
            </Box>
            {routes.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5, alignItems: "center" }}>
                    {shown.map((route) => (
                        <RouteChip key={`${route[ERouteTuple.city]}/${route[ERouteTuple.routeId]}`} name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} sx={{ height: 22 }} />
                    ))}
                    {routes.length > MAX_CHIPS && (
                        <Typography
                            variant="caption"
                            component="span"
                            sx={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setExpanded((value) => !value);
                            }}
                        >
                            {expanded ? "mniej" : `+${routes.length - MAX_CHIPS}`}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

export const StopList = ({ stops, linkFor, onSelect, trailing }: { stops: StopTuple[]; linkFor?: (stop: StopTuple) => string; onSelect?: (stop: StopTuple) => void; trailing?: (stop: StopTuple) => ReactNode }) => (
    <List disablePadding>
        {stops.map((stop) => {
            const props = linkFor ? { component: Link, to: linkFor(stop), onClick: () => onSelect?.(stop) } : { onClick: () => onSelect?.(stop) };
            return (
                <Fragment key={`${stop[EStopTuple.city]}/${stop[EStopTuple.stopId]}`}>
                    <ListItemButton {...(props as object)} sx={{ py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <StopItemContent stop={stop} />
                        </Box>
                        {trailing ? trailing(stop) : <ChevronRightIcon color="action" />}
                    </ListItemButton>
                    <Divider sx={{ opacity: 0.6 }} />
                </Fragment>
            );
        })}
    </List>
);

export const StopSearchField = ({ value, onChange, label, placeholder }: { value: string; onChange: (value: string) => void; label?: string; placeholder?: string }) => {
    const { t } = useTranslation();
    return (
        <form autoComplete="off" noValidate onSubmit={(event) => event.preventDefault()}>
            <TextField
                label={label ?? t("global.stops")}
                placeholder={placeholder ?? t("favourites.searchStop")}
                margin="normal"
                type="search"
                value={value}
                variant="outlined"
                onChange={(event) => onChange(event.target.value)}
                size="small"
                fullWidth
                slotProps={{
                    input: {
                        endAdornment: value ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => onChange("")} aria-label={t("global.clear")}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : undefined,
                    },
                    inputLabel: { shrink: true },
                }}
            />
        </form>
    );
};

export const SearchStatus = ({ query, loading, error, empty }: { query: string; loading: boolean; error?: boolean; empty: boolean }) => {
    const { t } = useTranslation();
    const style = { margin: "10px 0 5px" };
    if (query.length > 0 && query.length < MIN_QUERY)
        return (
            <Typography variant="subtitle2" noWrap style={style}>
                {t("global.atLeastXChars", { count: MIN_QUERY })}
            </Typography>
        );
    if (loading)
        return (
            <Typography variant="subtitle2" noWrap style={style}>
                {t("global.searching")}...
            </Typography>
        );
    if (error)
        return (
            <Typography variant="body2" noWrap style={{ margin: "5px 0" }}>
                {t("global.error")}
            </Typography>
        );
    if (empty && query.length >= MIN_QUERY)
        return (
            <Typography variant="subtitle2" noWrap style={style}>
                {t("global.nothingFound")}
            </Typography>
        );
    return null;
};
