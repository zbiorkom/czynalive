import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cityGet } from "@/api/client";
import { EItineraryStop, ERouteTuple, EStopTuple, ETripTuple, type ItineraryStop, type TripTuple, type TripTupleDetailed } from "@/api/types";
import { useApi } from "@/api/useApi";
import { RouteBadge } from "@/components/RouteBadge";
import { delayClass, formatDelayShort, formatTime, parseVehicleId } from "@/lib/transit";
import { formatDuration, formatKm, tripEnd, tripStart } from "./format";
import type { LiveVehicle } from "./useBrigadeLive";

type TripDetails = { trip: TripTuple; stops: [...ItineraryStop, number, number][] };

export type ScheduleRow = { trip: TripTupleDetailed; vehicle: LiveVehicle | null; active: boolean };

const TIME_COLUMN = 52;

export const DelayChip = ({ delay }: { delay: number | null }) => {
    if (delay === null) return null;
    const cls = delayClass(delay);
    return (
        <Chip
            size="small"
            label={formatDelayShort(delay)}
            sx={{ height: 20, fontWeight: 700, color: "#fff", background: `var(--${cls})`, "& .MuiChip-label": { px: 0.75 } }}
        />
    );
};

export const VehicleLink = ({ city, vehicle, translationKey }: { city: string; vehicle: LiveVehicle; translationKey: string }) => {
    const { t } = useTranslation();
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="caption" sx={{ textAlign: "center", fontWeight: 500 }}>
                <Link to={`/${city}?pojazd=${encodeURIComponent(vehicle.vehicleId)}`} className="text-primary">
                    {t(translationKey, { vehicle_id: parseVehicleId(vehicle.vehicleId).number })}
                </Link>
            </Typography>
            <DelayChip delay={vehicle.delay} />
        </Box>
    );
};

const TimelineRow = ({ time, children, dot = "filled", line = "both" }: { time?: string; children: React.ReactNode; dot?: "filled" | "small" | "none"; line?: "top" | "bottom" | "both" | "none" }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: `${TIME_COLUMN}px 20px 1fr`, columnGap: 1, minHeight: 28 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "right", pt: "4px", fontVariantNumeric: "tabular-nums" }}>
            {time}
        </Typography>
        <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
            {line !== "none" && (
                <Box
                    sx={{
                        position: "absolute",
                        left: "50%",
                        width: 2,
                        ml: "-1px",
                        top: line === "bottom" ? 12 : 0,
                        bottom: line === "top" ? "calc(100% - 12px)" : 0,
                        background: "var(--primary)",
                        opacity: 0.6,
                    }}
                />
            )}
            {dot !== "none" && (
                <Box
                    sx={{
                        position: "relative",
                        mt: dot === "small" ? "8px" : "6px",
                        width: dot === "small" ? 8 : 12,
                        height: dot === "small" ? 8 : 12,
                        borderRadius: "50%",
                        background: dot === "small" ? "var(--default-bg)" : "var(--primary)",
                        border: "2px solid var(--primary)",
                        boxSizing: "border-box",
                    }}
                />
            )}
        </Box>
        <Box sx={{ minWidth: 0, pb: 0.5 }}>{children}</Box>
    </Box>
);

const StopName = ({ city, stopId, name }: { city: string; stopId?: string; name: string }) =>
    stopId ? (
        <Link to={`/${city}/rozklad-jazdy/przystanek/${encodeURIComponent(stopId)}`} className="link-unstyled">
            <Typography variant="body2" component="span" sx={{ fontWeight: 500, "&:hover": { textDecoration: "underline" } }}>
                {name}
            </Typography>
        </Link>
    ) : (
        <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
            {name}
        </Typography>
    );

const TripBlock = ({ city, trip, timeZone, showRoute }: { city: string; trip: TripTupleDetailed; timeZone: string; showRoute: boolean }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const details = useApi(expanded ? (signal) => cityGet<TripDetails>(trip[ETripTuple.city], `/trips/${encodeURIComponent(trip[ETripTuple.tripId])}`, undefined, signal) : null, [expanded, trip[ETripTuple.tripId]]);
    const stops = details.data?.stops ?? [];
    const firstStop = stops[0]?.[EItineraryStop.stop];
    const lastStop = stops[stops.length - 1]?.[EItineraryStop.stop];
    const noStops = details.data && stops.length === 0;

    const toggle = (
        <Button size="small" variant="text" onClick={() => setExpanded((value) => !value)} disabled={details.loading || !!noStops} sx={{ px: 0.5, minWidth: 0 }}>
            {details.loading ? t("global.loading") : noStops ? t("brigadeSchedule.noStopData") : expanded ? `${t("global.collapse")} ▲` : `${t("global.expand")} ▼`}
        </Button>
    );

    return (
        <>
            {showRoute && (
                <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                    <RouteBadge route={trip[ETripTuple.route]} size="small" />
                </Box>
            )}
            <TimelineRow time={formatTime(tripStart(trip), timeZone)} line="bottom">
                <StopName city={city} stopId={firstStop?.[EStopTuple.stopId]} name={trip[ETripTuple.firstStop][0]} />
                <Typography variant="caption" color="text.secondary" component="div">
                    {t("global.tripHeadsign")}: {trip[ETripTuple.headsign]}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                    {t("brigadeSchedule.tripTime")}: {formatDuration(tripEnd(trip) - tripStart(trip))}
                </Typography>
                {trip[ETripTuple.totalDistance] > 0 && (
                    <Typography variant="caption" color="text.secondary" component="div">
                        {t("brigadeSchedule.distance")}: {formatKm(trip[ETripTuple.totalDistance])}
                    </Typography>
                )}
                {trip[ETripTuple.shortName] && (
                    <Typography variant="caption" color="text.secondary" component="div">
                        {t("global.trip")}: {trip[ETripTuple.shortName]}
                    </Typography>
                )}
                {toggle}
            </TimelineRow>
            {expanded &&
                stops.slice(1, -1).map((row, index) => {
                    const stop = row[EItineraryStop.stop];
                    return (
                        <TimelineRow key={`${stop[EStopTuple.stopId]}-${index}`} time={formatTime(row[row.length - 1] as number, timeZone)} dot="small">
                            <StopName city={city} stopId={stop[EStopTuple.stopId]} name={stop[EStopTuple.stopName]} />
                        </TimelineRow>
                    );
                })}
            <TimelineRow time={formatTime(tripEnd(trip), timeZone)} line="top">
                <StopName city={city} stopId={lastStop?.[EStopTuple.stopId]} name={trip[ETripTuple.lastStop][0]} />
                {expanded && stops.length > 2 && <Box>{toggle}</Box>}
            </TimelineRow>
        </>
    );
};

const BreakRow = ({ ms, from, to }: { ms: number; from: TripTupleDetailed; to: TripTupleDetailed }) => {
    const { t } = useTranslation();
    const fromRoute = from[ETripTuple.route];
    const toRoute = to[ETripTuple.route];
    const changesLine = fromRoute[ERouteTuple.routeId] !== toRoute[ERouteTuple.routeId];
    return (
        <Box sx={{ mx: 1, my: 0.5 }}>
            <TimelineRow time={formatDuration(ms)} dot="small" line="none">
                <Typography variant="body2">{t("brigadeSchedule.break")}</Typography>
                {changesLine && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }} aria-label={t("brigadeSchedule.changeLineFromTo", { from: fromRoute[ERouteTuple.routeName], to: toRoute[ERouteTuple.routeName] })}>
                        <Typography variant="caption" color="text.secondary">
                            {t("brigadeSchedule.changeLine")}
                        </Typography>
                        <RouteBadge route={fromRoute} size="small" />
                        <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        <RouteBadge route={toRoute} size="small" />
                    </Box>
                )}
            </TimelineRow>
        </Box>
    );
};

export const BrigadeSchedule = ({ city, rows, timeZone, multi }: { city: string; rows: ScheduleRow[]; timeZone: string; multi: boolean }) => {
    const { t } = useTranslation();
    const activeRef = useRef<HTMLDivElement | null>(null);
    const activeIndex = rows.findIndex((row) => row.active);
    const hasVehicle = activeIndex !== -1 && !!rows[activeIndex].vehicle;

    return (
        <div>
            {activeIndex !== -1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Button variant="contained" size="small" onClick={() => activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                        {t(hasVehicle ? "brigadeSchedule.moveToCurrentTrip" : "brigadeSchedule.moveToClosestTrip")} ↓
                    </Button>
                </Box>
            )}
            {rows.map((row, index) => {
                const next = rows[index + 1];
                return (
                    <div key={row.trip[ETripTuple.tripId]}>
                        <Paper
                            ref={row.active && index === activeIndex ? activeRef : undefined}
                            variant="outlined"
                            className={row.active ? "border-primary" : undefined}
                            sx={{ m: 1, p: 1, background: "transparent", scrollMarginTop: 80 }}
                        >
                            {row.active && (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 1 }}>
                                    <Typography variant="body1" sx={{ p: 0.5, fontWeight: 500 }}>
                                        {t(row.vehicle ? "brigadeSchedule.currentTrip" : "brigadeSchedule.closestTrip")}:
                                    </Typography>
                                    {row.vehicle && <VehicleLink city={city} vehicle={row.vehicle} translationKey="brigadeSchedule.usedVehicle" />}
                                </Box>
                            )}
                            <TripBlock city={city} trip={row.trip} timeZone={timeZone} showRoute={multi} />
                        </Paper>
                        {next && <BreakRow ms={tripStart(next.trip) - tripEnd(row.trip)} from={row.trip} to={next.trip} />}
                    </div>
                );
            })}
        </div>
    );
};
