import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { Badge, Box, Divider, Fab, FormControl, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { cityGet } from "@/api/client";
import { ALIGHT, ERouteTuple, EStopTuple, type Point, type RouteTuple, type StopTuple } from "@/api/types";
import { useApi } from "@/api/useApi";
import { VehicleTypeIcon, vehicleTypeName } from "@/components/departures/VehicleTypeIcon";
import { PageHeader } from "@/components/PageHeader";
import { ExpandableText, ShareLine, stopLink, TypeCircles, typeReadableKey } from "@/components/timetable/common";
import { RouteAlerts } from "@/components/timetable/RouteAlerts";
import { directionStops, RouteDiagram, type RouteDirection } from "@/components/timetable/RouteDiagram";
import { RouteMinimap } from "@/components/timetable/RouteMinimap";
import type { StopTimetableResponse } from "@/components/timetable/StopTimetable";
import { useRouteVehicles } from "@/components/timetable/useRouteVehicles";
import { formatDateIndex, routeColor, todayDateIndex } from "@/lib/transit";
import { useFavourites } from "@/store/favourites";

type RouteDetails = { route: RouteTuple; graph: RouteDirection[]; shapes: string[][] };
type TripDetails = { stops: [...unknown[], number, number][] };

const MINIMAP_AREA = "calc(100dvh - 48px - 56px - 24px)";

export default function RouteTimetablePage() {
    const { city = "", routeId = "" } = useParams();
    const [params, setParams] = useSearchParams();
    const dataCity = params.get("miasto") || city;
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const { has, toggle } = useFavourites(city);
    const agencyName = cityInfo?.agencies?.default?.name ?? cityInfo?.name ?? "";
    const timeZone = cityInfo?.timezone ?? "Europe/Warsaw";

    const details = useApi((signal) => cityGet<RouteDetails>(dataCity, `/routes/${encodeURIComponent(routeId)}`, undefined, signal), [dataCity, routeId]);
    const dates = useApi((signal) => cityGet<number[]>(dataCity, "/dates", { route: routeId }, signal), [dataCity, routeId]);

    const directionIndex = Math.min(Number(params.get("kierunek") ?? 0) || 0, Math.max((details.data?.graph.length ?? 1) - 1, 0));
    const direction = details.data?.graph[directionIndex];
    const today = todayDateIndex(timeZone);
    const [pickedDate, setPickedDate] = useState<number | null>(null);
    const date = pickedDate ?? (dates.data?.includes(today) ? today : (dates.data?.find((d) => d >= today) ?? dates.data?.[0] ?? today));
    const [activeStop, setActiveStop] = useState<StopTuple>();
    const [showVehicles, setShowVehicles] = useState(true);
    const [fitKey, setFitKey] = useState(0);

    const vehicles = useRouteVehicles(dataCity, routeId ? [routeId] : [], directionIndex, !!details.data);

    const firstStopId = direction?.trunk[0]?.[EStopTuple.stopId];
    const firstStopTimetable = useApi(
        firstStopId ? (signal) => cityGet<StopTimetableResponse>(dataCity, `/stops/${encodeURIComponent(firstStopId)}/timetable/${encodeURIComponent(routeId)}`, undefined, signal) : null,
        [dataCity, firstStopId, routeId],
    );
    const tripRef = useMemo(() => {
        const rows = firstStopTimetable.data?.timetable[String(date)];
        if (!rows?.length) return undefined;
        const usable = rows.filter((row) => (row[2] & (ALIGHT.AlightOnly | ALIGHT.IsLastStop)) === 0);
        const pool = usable.length ? usable : rows;
        const now = Date.now();
        return (pool.find((row) => row[1] >= now) ?? pool[0])[0];
    }, [firstStopTimetable.data, date]);
    const trip = useApi(tripRef ? (signal) => cityGet<TripDetails>(dataCity, `/trips/${encodeURIComponent(tripRef)}`, undefined, signal) : null, [dataCity, tripRef]);
    const minutes = useMemo(() => {
        const stops = trip.data?.stops;
        if (!stops?.length) return undefined;
        const origin = stops.find((entry) => (entry[0] as StopTuple)[EStopTuple.stopId] === firstStopId) ?? stops[0];
        const start = origin[origin.length - 1] as number;
        const map = new Map<string, number>();
        for (const entry of stops) {
            const stop = entry[0] as StopTuple;
            const departure = entry[entry.length - 1] as number;
            if (departure >= start && !map.has(stop[EStopTuple.stopId])) map.set(stop[EStopTuple.stopId], Math.round((departure - start) / 60000));
        }
        return map;
    }, [trip.data, firstStopId]);

    const route = details.data?.route;
    const routeName = route?.[ERouteTuple.routeName] ?? routeId;
    const routeType = route?.[ERouteTuple.routeType] ?? 3;
    const typeLabel = t(typeReadableKey(routeType));
    const headerTitle = `${t("timetables.timetable")} ${agencyName}`;
    const documentTitle = t("timetables.pageTitleRouteId", { route_id: routeName, type: typeLabel, agencyName });
    const stops = useMemo(() => (direction ? directionStops(direction) : []), [direction]);
    const favourite = has("routes", routeId);
    const color = route ? routeColor(route) : `var(--${vehicleTypeName(routeType)})`;

    if (details.error || (!details.data && !details.loading)) {
        return (
            <>
                <PageHeader title={headerTitle} back documentTitle={documentTitle} />
                <Box className="page" sx={{ p: 2 }}>
                    <Typography sx={{ mt: 3 }} variant="h5" gutterBottom>
                        {details.error?.message === "ROUTE_NOT_FOUND" ? t("timetables.routeIdNotFound") : t("global.error")}
                    </Typography>
                </Box>
            </>
        );
    }

    if (!details.data || !direction) {
        return (
            <>
                <PageHeader title={headerTitle} back documentTitle={documentTitle} />
                <Box className="page" sx={{ p: 2 }}>
                    <Typography sx={{ mt: 3 }} variant="h5" gutterBottom>
                        {details.data ? t("timetables.timetableNotFound") : `${t("global.loading")}...`}
                    </Typography>
                </Box>
            </>
        );
    }

    const headsign = direction.headsign;
    const trunk = direction.trunk;
    const center: Point = (trunk[Math.floor(trunk.length / 2)]?.[EStopTuple.location] as Point | undefined) ?? (cityInfo?.location as Point) ?? [19, 52];
    const shapes = details.data.shapes[directionIndex] ?? [];

    return (
        <>
            <PageHeader title={headerTitle} back documentTitle={documentTitle} />
            <Box className="page" sx={{ p: 2, pb: 10 }}>
                <Box sx={{ display: "flex", placeItems: "center", gap: "10px", mb: "10px" }}>
                    <TypeCircles types={[routeType]} size={50} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h5">
                            <strong>
                                {typeLabel} {t("global.route_id")} {routeName}
                            </strong>{" "}
                            - {agencyName}
                        </Typography>
                        <Typography variant="h5">
                            <strong>{headsign}</strong> - {t("timetables.timetable")}
                        </Typography>
                    </Box>
                    <Tooltip title={favourite ? t("favourites.removeFromFavourites") : t("favourites.addToFavourites")}>
                        <IconButton color="primary" onClick={() => toggle("routes", { id: routeId, name: routeName, type: routeType, color: route ? routeColor(route) : undefined })}>
                            {favourite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                    <ExpandableText>
                        <Typography variant="caption" gutterBottom>
                            <Trans
                                i18nKey="timetables.routeIdDescription"
                                values={{
                                    route_id: routeName,
                                    agencyName,
                                    trip_headsign: headsign,
                                    stopsCount: trunk.length,
                                    startStop: trunk[0]?.[EStopTuple.stopName] ?? "",
                                    endStop: trunk[trunk.length - 1]?.[EStopTuple.stopName] ?? "",
                                }}
                                components={[<strong key="1" />]}
                            />
                        </Typography>
                    </ExpandableText>
                    <ShareLine text={`${cityInfo?.name ?? city} ${t("timetables.timetable")} ${t("global.route_id")} ${typeLabel} ${routeName}`} />
                </Box>
                <Divider sx={{ my: "10px" }} />
                <Box id="scroll" sx={{ height: MINIMAP_AREA, minHeight: 480, display: "flex", flexDirection: "column", scrollMarginTop: 60 }}>
                    {vehicles.alerts && <RouteAlerts alerts={vehicles.alerts} routeName={routeName} />}
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>{t("global.tripHeadsign")}</InputLabel>
                            <Select
                                value={directionIndex}
                                label={t("global.tripHeadsign")}
                                onChange={(event) => {
                                    const next = new URLSearchParams(params);
                                    if (Number(event.target.value)) next.set("kierunek", String(event.target.value));
                                    else next.delete("kierunek");
                                    setParams(next, { replace: true });
                                    setActiveStop(undefined);
                                }}
                            >
                                {details.data.graph.map((entry, index) => (
                                    <MenuItem key={index} value={index} dense>
                                        {entry.headsign}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {dates.data && dates.data.length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>{t("global.date")}</InputLabel>
                                <Select value={dates.data.includes(date) ? date : ""} label={t("global.date")} onChange={(event) => setPickedDate(Number(event.target.value))}>
                                    {dates.data.map((index) => (
                                        <MenuItem key={index} value={index} dense>
                                            {formatDateIndex(index)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    <Box sx={{ mt: 2, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <Box sx={{ height: "40%", border: "2px solid #29a847", borderBottomWidth: 0, borderRadius: "6px 6px 0 0", overflow: "hidden" }}>
                            <RouteMinimap
                                shapes={shapes}
                                stops={stops}
                                vehicles={vehicles.positions}
                                showVehicles={showVehicles}
                                color={color}
                                routeType={routeType}
                                center={center}
                                activeStop={activeStop}
                                fitKey={fitKey}
                                onStopClick={setActiveStop}
                            />
                        </Box>
                        <Box sx={{ position: "relative", height: 0, zIndex: 10 }}>
                            <Box sx={{ position: "absolute", top: -17, right: 50, display: "flex" }}>
                                <Fab color="secondary" size="small" sx={{ width: 30, height: 30, minHeight: 30, mr: "10px" }} onClick={() => setFitKey((value) => value + 1)} aria-label="Pokaż całą trasę">
                                    <ZoomOutMapIcon sx={{ fontSize: 18 }} />
                                </Fab>
                                <Fab
                                    color="secondary"
                                    size="small"
                                    sx={{ width: 30, height: 30, minHeight: 30, ...(showVehicles ? {} : { backgroundColor: "var(--neutral-light)", border: "1px solid var(--white)" }) }}
                                    onClick={() => setShowVehicles((value) => !value)}
                                    aria-label={t("global.vehicles")}
                                >
                                    <Badge
                                        badgeContent={`${vehicles.positions.length}`}
                                        showZero
                                        sx={{ "& .MuiBadge-badge": { color: "var(--white)", backgroundColor: showVehicles ? `var(--${vehicleTypeName(routeType)})` : "var(--neutral-light)", height: 20, minWidth: 20 } }}
                                    >
                                        <VehicleTypeIcon routeType={routeType} sx={{ color: "#fff", fontSize: 18 }} />
                                    </Badge>
                                </Fab>
                            </Box>
                        </Box>
                        <Box sx={{ height: "60%", overflow: "auto", overflowX: "hidden", border: "2px solid #29a847", borderRadius: "0 0 6px 6px", backgroundColor: "var(--default-bg)", position: "relative" }}>
                            <RouteDiagram
                                city={city}
                                dataCity={dataCity}
                                routeId={routeId}
                                routeType={routeType}
                                direction={direction}
                                minutes={minutes}
                                positions={vehicles.positions}
                                placements={vehicles.placements}
                                showVehicles={showVehicles}
                                activeStopId={activeStop?.[EStopTuple.stopId]}
                                onStopClick={setActiveStop}
                                stopLinkFor={(stop) => stopLink(city, stop[EStopTuple.stopId], routeId, dataCity)}
                            />
                        </Box>
                    </Box>
                </Box>
                {formatDateIndex(date) && trip.data && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1 }}>
                        Czasy przejazdu według rozkładu na {formatDateIndex(date)}.
                    </Typography>
                )}
            </Box>
        </>
    );
}
