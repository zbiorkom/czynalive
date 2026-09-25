import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MapIcon from "@mui/icons-material/Map";
import {
    Box,
    Button,
    Card,
    CardActionArea,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItemButton,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { cityGet } from "@/api/client";
import { ERouteTuple, EStopTuple, EVehiclePosition, type RouteTuple, type VehiclePosition } from "@/api/types";
import { LiveDepartures } from "@/components/departures/LiveDepartures";
import { RouteChip } from "@/components/departures/RouteChip";
import { PageHeader } from "@/components/PageHeader";
import { ExpandableText, RouteButton, routeLink, ShareLine, sortRoutes, stopLink } from "@/components/timetable/common";
import { RouteAlerts } from "@/components/timetable/RouteAlerts";
import { SearchStatus, StopList, StopSearchField, useDebounced, useStopSearch } from "@/components/timetable/StopSearch";
import { useRouteVehicles } from "@/components/timetable/useRouteVehicles";
import { parseVehicleId } from "@/lib/transit";
import { useFavourites, type CityFavourites, type FavouriteRoute } from "@/store/favourites";

type Kind = keyof CityFavourites;

const ItemActions = ({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void }) => {
    const { t } = useTranslation();
    return (
        <Box sx={{ display: "flex", flexShrink: 0 }} onClick={(event) => event.stopPropagation()}>
            <Tooltip title={t("global.moveUp")}>
                <span>
                    <IconButton size="small" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
                        <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={t("global.moveDown")}>
                <span>
                    <IconButton size="small" disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
                        <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={t("favourites.removeFromFavourites")}>
                <IconButton size="small" onClick={onRemove}>
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

const Section = ({ title, count, children, onAdd }: { title: string; count: number; children: ReactNode; onAdd: () => void }) => {
    const { t } = useTranslation();
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 700 }}>
                    {title} ({count})
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
                    {t("global.add")}
                </Button>
            </Box>
            {children}
        </Box>
    );
};

const FavouriteStopCard = ({ city, stop, actions }: { city: string; stop: { id: string; name: string; code?: string }; actions: ReactNode }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(true);
    return (
        <Card variant="outlined" sx={{ mb: 1, background: "transparent" }}>
            <Box sx={{ display: "flex", alignItems: "center", pl: 1 }}>
                <IconButton size="small" onClick={() => setOpen((value) => !value)} aria-label={open ? t("global.collapse") : t("global.expand")}>
                    {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Typography variant="body1" sx={{ fontWeight: 600, flex: 1, minWidth: 0, cursor: "pointer" }} noWrap onClick={() => setOpen((value) => !value)}>
                    {stop.name} {stop.code}
                </Typography>
                <Tooltip title={t("timetables.timetable")}>
                    <IconButton size="small" component={Link} to={stopLink(city, stop.id)}>
                        <AccessTimeIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t("global.showOnMap")}>
                    <IconButton size="small" component={Link} to={`/${city}?przystanek=${encodeURIComponent(stop.id)}`}>
                        <MapIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                {actions}
            </Box>
            <Collapse in={open} unmountOnExit>
                <Box sx={{ p: 0.5 }}>
                    <LiveDepartures city={city} stopId={stop.id} limit={5} compact showMore={false} />
                </Box>
            </Collapse>
        </Card>
    );
};

type VehicleLookup = [position: VehiclePosition | null, headsign: string, model: string];

const FavouriteVehicleCard = ({ city, vehicleId, actions }: { city: string; vehicleId: string; actions: ReactNode }) => {
    const { t } = useTranslation();
    const [data, setData] = useState<VehicleLookup | null | undefined>();
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const controller = new AbortController();
        const load = () =>
            cityGet<VehicleLookup>(city, `/positions/vehicle/${encodeURIComponent(vehicleId)}`, undefined, controller.signal)
                .then(setData)
                .catch(() => !controller.signal.aborted && setData(null))
                .finally(() => {
                    if (!controller.signal.aborted) timer = setTimeout(load, 30000);
                });
        load();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [city, vehicleId]);
    const position = data?.[0];
    const route = position?.[EVehiclePosition.route];
    const number = parseVehicleId(vehicleId).number;
    return (
        <Card variant="outlined" sx={{ mb: 1, background: "transparent", display: "flex", alignItems: "center" }}>
            <CardActionArea component={Link} to={`/${city}?pojazd=${encodeURIComponent(vehicleId)}`} sx={{ p: 1, display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-start", flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <Typography variant="body2">
                        {t("favourites.vehicleNo")} <strong>{number}</strong>
                        {data?.[2] ? <span style={{ opacity: 0.7 }}> · {data[2]}</span> : null}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, minWidth: 0 }}>
                        {data === undefined ? (
                            <Typography variant="caption">{t("global.loading")}...</Typography>
                        ) : route ? (
                            <>
                                <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} brigade={position[EVehiclePosition.brigade] || undefined} showLiveBadge isLive />
                                <Typography variant="body2" noWrap>
                                    {data?.[1]}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="caption" className="text-error" sx={{ fontWeight: 700 }}>
                                {data === null ? t("vehicleDetails.noVehicleData") : t("global.noGpsSignal")}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </CardActionArea>
            <Box sx={{ pr: 0.5 }}>{actions}</Box>
        </Card>
    );
};

const AddDialog = ({ city, open, initialTab, onClose }: { city: string; open: boolean; initialTab: Kind; onClose: () => void }) => {
    const { t } = useTranslation();
    const { favourites, toggle, has } = useFavourites(city);
    const [tab, setTab] = useState<Kind>(initialTab);
    const [input, setInput] = useState("");
    const query = useDebounced(input, 400);
    const stopSearch = useStopSearch(city, tab === "stops" ? query : "");
    const [routes, setRoutes] = useState<RouteTuple[]>();
    const [vehicles, setVehicles] = useState<[VehiclePosition, string, string][]>();

    useEffect(() => {
        setTab(initialTab);
        setInput("");
    }, [initialTab, open]);

    useEffect(() => {
        setRoutes(undefined);
        setVehicles(undefined);
        const trimmed = query.trim();
        if (!trimmed || tab === "stops") return;
        const controller = new AbortController();
        if (tab === "routes") {
            cityGet<RouteTuple[]>(city, "/routes/search", { query: trimmed }, controller.signal)
                .then(setRoutes)
                .catch(() => {});
        } else {
            cityGet<[VehiclePosition, string, string][]>(city, "/positions/search", { query: trimmed }, controller.signal)
                .then(setVehicles)
                .catch(() => {});
        }
        return () => controller.abort();
    }, [city, query, tab]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t("favourites.whatToAddToFavourites")}</DialogTitle>
            <DialogContent sx={{ minHeight: 360 }}>
                <Tabs value={tab} onChange={(_, value) => { setTab(value); setInput(""); }} variant="fullWidth">
                    <Tab value="stops" label={t("global.stops")} />
                    <Tab value="routes" label={t("global.lines")} />
                    <Tab value="vehicles" label={t("global.vehicles")} />
                </Tabs>
                {tab === "stops" ? (
                    <>
                        <StopSearchField value={input} onChange={setInput} label={t("favourites.searchAndAddFavouriteStops")} />
                        <SearchStatus query={query.trim()} loading={stopSearch.loading} error={stopSearch.error} empty={!!stopSearch.results && stopSearch.results.length === 0} />
                        {stopSearch.results && (
                            <StopList
                                stops={stopSearch.results}
                                onSelect={(stop) => toggle("stops", { id: stop[EStopTuple.stopId], name: stop[EStopTuple.stopName], code: stop[EStopTuple.stopCode] || undefined })}
                                trailing={(stop) => (has("stops", stop[EStopTuple.stopId]) ? <Typography variant="caption" className="text-primary">✓</Typography> : <AddIcon color="action" />)}
                            />
                        )}
                    </>
                ) : tab === "routes" ? (
                    <>
                        <TextField
                            label={t("favourites.searchRouteId")}
                            placeholder={t("map.filterEnterLine")}
                            margin="normal"
                            size="small"
                            fullWidth
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
                            {sortRoutes(routes ?? []).map((route) => (
                                <RouteButton
                                    key={`${route[ERouteTuple.city]}/${route[ERouteTuple.routeId]}`}
                                    route={route}
                                    selected={has("routes", route[ERouteTuple.routeId])}
                                    onClick={() => toggle("routes", { id: route[ERouteTuple.routeId], name: route[ERouteTuple.routeName], type: route[ERouteTuple.routeType], color: route[ERouteTuple.routeColor] })}
                                />
                            ))}
                        </Box>
                        {routes && routes.length === 0 && <Typography variant="subtitle2">{t("global.nothingFound")}</Typography>}
                    </>
                ) : (
                    <>
                        <TextField
                            label={t("favourites.searchVehiclesByVehicleNo")}
                            placeholder="np. 7809"
                            margin="normal"
                            size="small"
                            fullWidth
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <List disablePadding>
                            {(vehicles ?? []).slice(0, 30).map(([position, headsign, model]) => {
                                const id = position[EVehiclePosition.id];
                                const route = position[EVehiclePosition.route];
                                const selected = has("vehicles", id);
                                return (
                                    <ListItemButton
                                        key={id}
                                        selected={selected}
                                        onClick={() => toggle("vehicles", { id, name: parseVehicleId(id).number, type: route[ERouteTuple.routeType] })}
                                        sx={{ gap: 1 }}
                                    >
                                        <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} brigade={position[EVehiclePosition.brigade] || undefined} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" noWrap>
                                                <strong>{parseVehicleId(id).number}</strong> · {headsign}
                                            </Typography>
                                            {model && (
                                                <Typography variant="caption" noWrap component="div">
                                                    {model}
                                                </Typography>
                                            )}
                                        </Box>
                                        {selected ? <Typography className="text-primary">✓</Typography> : <AddIcon color="action" />}
                                    </ListItemButton>
                                );
                            })}
                        </List>
                        {vehicles && vehicles.length === 0 && <Typography variant="subtitle2">{t("global.nothingFound")}</Typography>}
                    </>
                )}
                <Typography variant="caption" color="textSecondary" component="div" sx={{ mt: 1 }}>
                    {t("favourites.favouriteStops")}: {favourites.stops.length} · {t("favourites.favouritesLines")}: {favourites.routes.length} · {t("favourites.favouriteVehicles")}: {favourites.vehicles.length}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("global.close")}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default function FavouritesPage() {
    const { city = "" } = useParams();
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const { favourites, reorder, toggle } = useFavourites(city);
    const [dialog, setDialog] = useState<Kind | null>(null);
    const routeIds = useMemo(() => favourites.routes.map((route) => route.id), [favourites.routes]);
    const live = useRouteVehicles(city, routeIds, undefined, routeIds.length > 0);
    const counts = useMemo(() => {
        const map = new Map<string, number>();
        for (const position of live.positions) {
            const id = position[EVehiclePosition.route][ERouteTuple.routeId];
            map.set(id, (map.get(id) ?? 0) + 1);
        }
        return map;
    }, [live.positions]);

    const move = <K extends Kind>(kind: K) => (from: number, to: number) => {
        const items = [...favourites[kind]] as CityFavourites[K];
        const [item] = items.splice(from, 1);
        items.splice(to, 0, item as never);
        reorder(kind, items);
    };

    const routeTuple = (route: FavouriteRoute): RouteTuple => [route.id, city, route.name, "", "default", route.type, route.color ?? ""];
    const empty = !favourites.stops.length && !favourites.routes.length && !favourites.vehicles.length;

    return (
        <>
            <PageHeader title={t("favourites.favourites")} documentTitle={t("favourites.pageTitle")} />
            <Box className="page" sx={{ p: 2, pb: 10 }}>
                <ExpandableText>
                    <Typography variant="caption">{t("favourites.description")}</Typography>
                </ExpandableText>
                <ShareLine text={`${cityInfo?.name ?? city} - ${t("favourites.pageTitle")}`} />
                <Divider sx={{ my: 1.5 }} />
                {empty && (
                    <Box sx={{ textAlign: "center", my: 3 }}>
                        <Typography variant="body1" gutterBottom>
                            {t("map.noFavouritesAddThem")}
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog("stops")}>
                            {t("global.add")}
                        </Button>
                    </Box>
                )}
                {live.alerts && live.alerts.length > 0 && (
                    <RouteAlerts alerts={live.alerts} routeName={favourites.routes.map((route) => route.name).join(", ")} title={t("favourites.favouriteLinesAlerts", { count: live.alerts.length }).replace(/ \(\d+\)$/, "")} />
                )}
                <Section title={t("favourites.favouriteStops")} count={favourites.stops.length} onAdd={() => setDialog("stops")}>
                    {favourites.stops.map((stop, index) => (
                        <FavouriteStopCard
                            key={stop.id}
                            city={city}
                            stop={stop}
                            actions={<ItemActions index={index} count={favourites.stops.length} onMove={move("stops")} onRemove={() => toggle("stops", stop)} />}
                        />
                    ))}
                </Section>
                <Section title={t("favourites.favouritesLines")} count={favourites.routes.length} onAdd={() => setDialog("routes")}>
                    {favourites.routes.map((route, index) => (
                        <Card key={route.id} variant="outlined" sx={{ mb: 1, background: "transparent", display: "flex", alignItems: "center", gap: 1, p: 0.5 }}>
                            <Box sx={{ width: 90, flexShrink: 0 }}>
                                <RouteButton route={routeTuple(route)} to={routeLink(city, route.id)} />
                            </Box>
                            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                                {t("plural.vehicle", { count: counts.get(route.id) ?? 0 })} {t("global.live").toLowerCase()}
                            </Typography>
                            <ItemActions index={index} count={favourites.routes.length} onMove={move("routes")} onRemove={() => toggle("routes", route)} />
                        </Card>
                    ))}
                </Section>
                <Section title={t("favourites.favouriteVehicles")} count={favourites.vehicles.length} onAdd={() => setDialog("vehicles")}>
                    {favourites.vehicles.map((vehicle, index) => (
                        <FavouriteVehicleCard
                            key={vehicle.id}
                            city={city}
                            vehicleId={vehicle.id}
                            actions={<ItemActions index={index} count={favourites.vehicles.length} onMove={move("vehicles")} onRemove={() => toggle("vehicles", vehicle)} />}
                        />
                    ))}
                </Section>
            </Box>
            <AddDialog city={city} open={dialog !== null} initialTab={dialog ?? "stops"} onClose={() => setDialog(null)} />
        </>
    );
}

