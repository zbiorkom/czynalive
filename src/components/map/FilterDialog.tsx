import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ShareIcon from "@mui/icons-material/Share";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cityGet } from "@/api/client";
import { ERouteTuple, EVehiclePosition, RouteType, type RouteTuple, type VehiclePosition } from "@/api/types";
import { useApi } from "@/api/useApi";
import { RouteChip } from "@/components/departures/RouteChip";
import { parseVehicleId } from "@/lib/transit";
import { typeClass } from "./icons";
import { shareLink } from "./share";

export type MapFilter = { routes: string[]; vehicleTypes: number[]; vehicles: string[] };

type Props = { open: boolean; city: string; value: MapFilter; onClose: () => void; onApply: (value: MapFilter) => void; onToast: (text: string) => void };

const TYPE_ORDER = [RouteType.Tram, RouteType.Bus, RouteType.Trolleybus, RouteType.Subway, RouteType.Rail, RouteType.Ferry];
const TYPE_LABELS: Record<number, string> = {
    [RouteType.Tram]: "global.trams",
    [RouteType.Bus]: "global.buses",
    [RouteType.Trolleybus]: "global.trolleybuses",
    [RouteType.Subway]: "global.subway",
    [RouteType.Rail]: "global.trains",
    [RouteType.Ferry]: "global.ferries",
};

const collator = new Intl.Collator("pl", { numeric: true });
const sortRoutes = (routes: RouteTuple[]) =>
    [...routes].sort(
        (a, b) =>
            Number(b[ERouteTuple.routeAgency] === "default") - Number(a[ERouteTuple.routeAgency] === "default") ||
            collator.compare(a[ERouteTuple.routeAgency], b[ERouteTuple.routeAgency]) ||
            a[ERouteTuple.routeType] - b[ERouteTuple.routeType] ||
            collator.compare(a[ERouteTuple.routeName], b[ERouteTuple.routeName]),
    );

type PositionSearch = [VehiclePosition, string, string][];

// "Filtruj mapę": lines + vehicle types (saved per city) and individual vehicles.
export const FilterDialog = ({ open, city, value, onClose, onApply, onToast }: Props) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<"lines" | "vehicles">("lines");
    const [draft, setDraft] = useState<MapFilter>(value);
    const [query, setQuery] = useState("");
    const [vehicleQuery, setVehicleQuery] = useState("");
    const [vehicleResults, setVehicleResults] = useState<PositionSearch>([]);
    const { data: routes } = useApi(open ? (signal) => cityGet<RouteTuple[]>(city, "/routes", undefined, signal) : null, [city, open]);

    useEffect(() => {
        if (open) setDraft(value);
    }, [open]);

    useEffect(() => {
        const text = vehicleQuery.trim();
        if (!text) return setVehicleResults([]);
        const controller = new AbortController();
        const timer = setTimeout(() => {
            cityGet<PositionSearch>(city, "/positions/search", { query: text }, controller.signal)
                .then((result) => setVehicleResults(result.slice(0, 30)))
                .catch(() => {});
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [vehicleQuery, city]);

    const sorted = useMemo(() => sortRoutes(routes ?? []), [routes]);
    const byId = useMemo(() => Object.fromEntries(sorted.map((route) => [route[ERouteTuple.routeId], route])), [sorted]);
    const availableTypes = TYPE_ORDER.filter((type) => sorted.some((route) => route[ERouteTuple.routeType] === type));
    const text = query.trim().toLowerCase();
    const visible = text
        ? sorted.filter(
              (route) => route[ERouteTuple.routeName].toLowerCase().includes(text) || route[ERouteTuple.routeLongName].toLowerCase().includes(text),
          )
        : sorted;
    const groups = TYPE_ORDER.concat([RouteType.AerialLift, RouteType.Funicular, RouteType.Monorail])
        .map((type) => ({ type, routes: visible.filter((route) => route[ERouteTuple.routeType] === type) }))
        .filter((group) => group.routes.length);

    const toggleRoute = (routeId: string) =>
        setDraft((prev) => ({ ...prev, routes: prev.routes.includes(routeId) ? prev.routes.filter((id) => id !== routeId) : [...prev.routes, routeId] }));
    const toggleType = (type: number) =>
        setDraft((prev) => ({ ...prev, vehicleTypes: prev.vehicleTypes.includes(type) ? prev.vehicleTypes.filter((id) => id !== type) : [...prev.vehicleTypes, type] }));
    const toggleVehicle = (vehicleId: string) =>
        setDraft((prev) => ({ ...prev, vehicles: prev.vehicles.includes(vehicleId) ? prev.vehicles.filter((id) => id !== vehicleId) : [...prev.vehicles, vehicleId] }));

    const share = async () => {
        const params = new URLSearchParams();
        if (draft.routes.length) params.set("lines", draft.routes.join(","));
        if (draft.vehicles.length) params.set("vehicles", draft.vehicles.join(","));
        const result = await shareLink(t("map.filterShareDescription"), `${t("map.filterShareDescription")}: `, `${window.location.origin}/${city}?${params}`);
        if (result === "copied") onToast(t("global.copied"));
    };

    return (
        <Dialog open={open} onClose={onClose} fullScreen scroll="paper">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ px: 1.5, py: 0.5 }}>
                    {t("map.filterDialogHeader")}
                </Typography>
                <IconButton onClick={onClose} size="large" aria-label={t("global.close")}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Tabs value={tab} onChange={(_, next) => setTab(next)} aria-label={t("map.filterTabs")} variant="fullWidth">
                <Tab value="lines" label={`${t("map.filterTabLines")}${draft.routes.length ? ` (${draft.routes.length})` : ""}`} />
                <Tab value="vehicles" label={`${t("map.filterTabVehicles")}${draft.vehicles.length ? ` (${draft.vehicles.length})` : ""}`} />
            </Tabs>
            <DialogContent dividers sx={{ p: 2 }}>
                {tab === "lines" ? (
                    <>
                        <Typography variant="body1" sx={{ pb: 1 }}>
                            {t("map.filterHeader")}
                        </Typography>
                        {availableTypes.length > 1 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                                {availableTypes.map((type) => {
                                    const selected = draft.vehicleTypes.includes(type);
                                    return (
                                        <Chip
                                            key={type}
                                            label={t(TYPE_LABELS[type])}
                                            onClick={() => toggleType(type)}
                                            color={selected ? "primary" : "default"}
                                            variant={selected ? "filled" : "outlined"}
                                        />
                                    );
                                })}
                            </Box>
                        )}
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {t("map.filterSelectedLines")}:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2, minHeight: 28 }}>
                            {draft.routes.length === 0 ? (
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                    {t("map.filterNoSelectedLines")}.
                                </Typography>
                            ) : (
                                draft.routes.map((routeId) => {
                                    const route = byId[routeId];
                                    return route ? (
                                        <Chip
                                            key={routeId}
                                            size="small"
                                            className={`bg-${typeClass(route[ERouteTuple.routeType])} text-white`}
                                            label={route[ERouteTuple.routeName]}
                                            onDelete={() => toggleRoute(routeId)}
                                            sx={{ "& .MuiChip-deleteIcon": { color: "#fff" } }}
                                        />
                                    ) : (
                                        <Chip key={routeId} size="small" label={routeId} onDelete={() => toggleRoute(routeId)} />
                                    );
                                })
                            )}
                        </Box>
                        <TextField
                            fullWidth
                            size="small"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t("map.filterSearchLine")}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
                        />
                        {groups.map((group) => (
                            <Box key={group.type} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    {t(TYPE_LABELS[group.type] ?? "global.lines")}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                    {group.routes.map((route) => {
                                        const selected = draft.routes.includes(route[ERouteTuple.routeId]);
                                        return (
                                            <Box
                                                key={`${route[ERouteTuple.city]}-${route[ERouteTuple.routeId]}`}
                                                sx={{ opacity: draft.routes.length && !selected ? 0.45 : 1, outline: selected ? "2px solid var(--primary)" : undefined, borderRadius: "8px" }}
                                            >
                                                <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} onClick={() => toggleRoute(route[ERouteTuple.routeId])} />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        ))}
                    </>
                ) : (
                    <>
                        <Typography variant="body1" sx={{ pb: 1 }}>
                            {t("map.filterVehiclesHeader")}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {t("map.filterSelectedVehicles")}:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2, minHeight: 28 }}>
                            {draft.vehicles.length === 0 ? (
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                    {t("map.filterNoSelectedVehicles")}.
                                </Typography>
                            ) : (
                                draft.vehicles.map((vehicleId) => (
                                    <Chip key={vehicleId} size="small" label={`#${parseVehicleId(vehicleId).number}`} onDelete={() => toggleVehicle(vehicleId)} />
                                ))
                            )}
                        </Box>
                        <TextField
                            fullWidth
                            size="small"
                            value={vehicleQuery}
                            onChange={(event) => setVehicleQuery(event.target.value)}
                            placeholder={`${t("map.filterSearchVehicle")} (${t("map.filterVehicleNoPlaceholder")})`}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
                        />
                        <List dense>
                            {vehicleResults.map(([position, headsign, model]) => {
                                const vehicleId = position[EVehiclePosition.id];
                                const route = position[EVehiclePosition.route];
                                const selected = draft.vehicles.includes(vehicleId);
                                return (
                                    <ListItemButton key={vehicleId} selected={selected} onClick={() => toggleVehicle(vehicleId)} sx={{ gap: 1 }}>
                                        <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} brigade={position[EVehiclePosition.brigade] || undefined} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                                #{parseVehicleId(vehicleId).number} {headsign ? `→ ${headsign}` : ""}
                                            </Typography>
                                            {model && (
                                                <Typography variant="caption" component="div" noWrap sx={{ opacity: 0.75 }}>
                                                    {model}
                                                </Typography>
                                            )}
                                        </Box>
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    </>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ justifyContent: "space-between", pb: "calc(8px + var(--sab))" }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={() => setDraft({ routes: [], vehicleTypes: [], vehicles: [] })} className="text-default-text">
                        {t("global.clear")}
                    </Button>
                    <IconButton onClick={share} aria-label={t("map.filterShareCustomDescription")} title={t("map.filterShareCustomDescription")}>
                        <ShareIcon />
                    </IconButton>
                </Box>
                <Button
                    variant="contained"
                    onClick={() => {
                        onApply(draft);
                        onClose();
                    }}
                >
                    {t("global.save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
