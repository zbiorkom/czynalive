import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, Divider, IconButton, InputAdornment, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { cityGet } from "@/api/client";
import { ERouteTuple, EStopTuple, type RouteTuple, type StopTuple } from "@/api/types";
import { useApi } from "@/api/useApi";
import { VehicleTypeIcon, vehicleTypeName } from "@/components/departures/VehicleTypeIcon";
import { ErrorBox } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { ExpandableText, RouteGrid, routeLink, ShareLine, sortRoutes, sortTypes, stopLink, useThemeMode } from "@/components/timetable/common";
import { SearchStatus, StopList, StopSearchField, useDebounced, useStopSearch } from "@/components/timetable/StopSearch";
import { useRecentStops } from "@/components/timetable/recentStops";

const TypeFilter = ({ types, selected, onToggle }: { types: number[]; selected: number | null; onToggle: (type: number) => void }) => {
    const mode = useThemeMode();
    return (
        <Box sx={{ display: "flex", gap: 1, pt: 1 }}>
            {types.map((type) => {
                const name = vehicleTypeName(type);
                const active = selected === type;
                const className = active
                    ? `border-tiny-${name} bg-${name} text-white`
                    : mode === "dark"
                      ? `border-tiny-${name} text-default-text bg-default-bg`
                      : `border-tiny-${name} text-${name} bg-white`;
                return (
                    <Button key={type} fullWidth variant="outlined" className={className} onClick={() => onToggle(type)} sx={{ flex: 1, minWidth: 0, p: 0.5 }}>
                        <VehicleTypeIcon routeType={type} sx={{ color: active ? "#fff" : mode === "dark" ? "var(--default-text)" : `var(--${name})` }} />
                    </Button>
                );
            })}
        </Box>
    );
};

const RoutesTab = ({ city, routes }: { city: string; routes: RouteTuple[] }) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [type, setType] = useState<number | null>(null);
    const types = useMemo(() => sortTypes(routes.map((route) => route[ERouteTuple.routeType])), [routes]);
    const sorted = useMemo(() => sortRoutes(routes), [routes]);
    const filtered = useMemo(() => {
        const needle = query.trim().toUpperCase();
        if (!needle && type === null) return sorted;
        return sorted.filter((route) => (type === null || route[ERouteTuple.routeType] === type) && route[ERouteTuple.routeName].toUpperCase().includes(needle));
    }, [sorted, query, type]);

    return (
        <div>
            <Typography variant="subtitle2" noWrap sx={{ mt: 1, mb: 2 }}>
                {t("map.filterSearchLine")}:
            </Typography>
            <TextField
                label={t("global.route_ids")}
                placeholder={t("map.filterEnterLine")}
                margin="dense"
                value={query}
                type="search"
                variant="outlined"
                onChange={(event) => setQuery(event.target.value)}
                size="small"
                fullWidth
                autoComplete="off"
                slotProps={{
                    input: {
                        endAdornment: query ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setQuery("")}>
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : undefined,
                    },
                    inputLabel: { shrink: true },
                }}
            />
            {types.length > 1 && <TypeFilter types={types} selected={type} onToggle={(value) => setType((prev) => (prev === value ? null : value))} />}
            <Divider sx={{ my: 2 }} />
            {filtered.length === 0 ? (
                <Typography variant="subtitle2" noWrap sx={{ mt: 2, mx: 0 }}>
                    {t("global.nothingFound")}
                </Typography>
            ) : (
                <RouteGrid routes={filtered} linkFor={(route) => routeLink(city, route[ERouteTuple.routeId], route[ERouteTuple.city])} />
            )}
        </div>
    );
};

const StopsTab = ({ city }: { city: string }) => {
    const { t } = useTranslation();
    const [input, setInput] = useState("");
    const query = useDebounced(input, 500);
    const { results, loading, error } = useStopSearch(city, query);
    const { recent, add, clear } = useRecentStops(city);
    const mode = useThemeMode();
    const linkFor = (stop: StopTuple) => stopLink(city, stop[EStopTuple.stopId], undefined, stop[EStopTuple.city]);

    return (
        <div>
            <Typography variant="subtitle2" noWrap style={{ margin: "10px 0 5px" }}>
                {t("favourites.searchStop")}:
            </Typography>
            <StopSearchField value={input} onChange={setInput} />
            <SearchStatus query={query.trim()} loading={loading} error={error} empty={!!results && results.length === 0} />
            {results && results.length > 0 && (
                <>
                    <Typography variant="subtitle2" noWrap style={{ margin: "10px 0 5px" }}>
                        {t("global.searchResults")}:
                    </Typography>
                    <Box sx={{ mb: 8 }}>
                        <StopList stops={results} linkFor={linkFor} onSelect={add} />
                    </Box>
                </>
            )}
            {!results && !loading && recent.length > 0 && (
                <div>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" noWrap style={{ margin: "10px 0 5px" }}>
                            {t("timetables.lastChosen")}:
                        </Typography>
                        <Button size="small" color="primary" variant={mode === "dark" ? "contained" : "outlined"} onClick={clear}>
                            {t("global.clear")}
                        </Button>
                    </Box>
                    <StopList stops={recent} linkFor={linkFor} onSelect={add} />
                </div>
            )}
        </div>
    );
};

export default function TimetableIndexPage() {
    const { city = "" } = useParams();
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const [params, setParams] = useSearchParams();
    const tab = params.get("zakladka") === "przystanki" ? "stop" : "route_id";
    const routes = useApi((signal) => cityGet<RouteTuple[]>(city, "/routes", undefined, signal), [city]);
    const agencyName = cityInfo?.agencies?.default?.name ?? cityInfo?.name ?? "";
    const cityName = cityInfo?.name ?? city;

    return (
        <>
            <PageHeader title={`${t("timetables.timetable")} ${cityName}`} documentTitle={`${t("timetables.pageTitleMain")} - ${cityName}`} />
            <Box className="page" sx={{ p: 2, pb: 10 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                    <ExpandableText>
                        <Typography variant="caption">
                            <Trans i18nKey="timetables.mainDescriptionPart1" values={{ agencyName }} components={[<strong key="1" />]} />
                        </Typography>
                        <Typography variant="caption">
                            <Trans i18nKey="timetables.mainDescriptionPart2" components={[<strong key="1" />]} />
                        </Typography>
                    </ExpandableText>
                    <ShareLine text={`${cityName} ${t("timetables.shareUrlDescription")}`} />
                </Box>
                <Box sx={{ my: 2 }}>
                    <Tabs
                        value={tab}
                        onChange={(_, value) => setParams(value === "stop" ? { zakladka: "przystanki" } : {}, { replace: true })}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                    >
                        <Tab value="route_id" label={t("global.route_ids")} />
                        <Tab value="stop" label={t("global.stops")} />
                    </Tabs>
                    <Box sx={{ my: 2 }}>
                        {tab === "route_id" ? (
                            routes.error ? (
                                <ErrorBox error={routes.error} onRetry={routes.reload} />
                            ) : !routes.data ? (
                                <Typography sx={{ mt: 3 }} variant="h5" gutterBottom>
                                    {t("global.loading")}...
                                </Typography>
                            ) : (
                                <RoutesTab city={city} routes={routes.data} />
                            )
                        ) : (
                            <StopsTab city={city} />
                        )}
                    </Box>
                </Box>
            </Box>
        </>
    );
}
