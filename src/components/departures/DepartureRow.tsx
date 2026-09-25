import MapIcon from "@mui/icons-material/Map";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box, Button, Card, CardActionArea, Chip, Divider, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
    ALIGHT,
    EDeparture,
    ERouteTuple,
    EStopDepartureTuple,
    ETripTuple,
    EVehiclePosition,
    StopDepartureStatus,
    type StopDepartureTuple,
} from "@/api/types";
import { parseVehicleId } from "@/lib/transit";
import { delayClassName, delayMinutes, hhmm, isLiveStatus } from "./departureUtils";
import { RouteChip } from "./RouteChip";
import { vehicleTypeName } from "./VehicleTypeIcon";

export const MinutesRemaining = ({ minutes }: { minutes: number }) => {
    const { t } = useTranslation();
    const big = (value: ReactNode) => (
        <Typography component="span" variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
            {value}
        </Typography>
    );
    if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return (
            <Typography component="span" variant="body2" sx={{ whiteSpace: "nowrap" }}>
                {big(h)} h{m > 0 && <> {big(m)} min</>}
            </Typography>
        );
    }
    if (minutes >= 0) {
        return (
            <Typography component="span" variant="body2" sx={{ whiteSpace: "nowrap" }}>
                {big(minutes === 0 ? "<1" : minutes)} min
            </Typography>
        );
    }
    return (
        <Typography component="span" variant="body2" sx={{ whiteSpace: "nowrap" }}>
            {big(Math.abs(minutes))} min {t("stopDetails.ago")}
        </Typography>
    );
};

export const DepartureTime = ({ scheduled, delayMs, live, now }: { scheduled: number; delayMs: number; live: boolean; now: number }) => {
    const delayMin = live ? delayMinutes(delayMs) : undefined;
    const expected = scheduled + (live ? delayMs : 0);
    const minutes = Math.round((expected - now) / 60000);
    const cls = delayMin !== undefined ? `bg-${delayClassName(delayMin)}` : "";
    const delayed = delayMin !== undefined && Math.abs(delayMin) >= 1;
    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
            <MinutesRemaining minutes={minutes} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {delayed ? (
                    <>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            <s>{hhmm(scheduled)}</s>
                        </Typography>
                        <Chip size="small" label={hhmm(expected)} className={`${cls} text-white`} sx={{ height: 20, borderRadius: "8px", color: "#fff", "& span": { color: "#fff !important" } }} />
                    </>
                ) : (
                    <Chip
                        size="small"
                        label={hhmm(scheduled)}
                        variant={live ? "filled" : "outlined"}
                        className={live ? `${cls} text-white` : ""}
                        sx={{ height: 20, borderRadius: "8px", ...(live ? { color: "#fff", "& span": { color: "#fff !important" } } : {}) }}
                    />
                )}
            </Box>
        </Box>
    );
};

export const departureLink = (city: string, departure: StopDepartureTuple) => {
    const vehicle = departure[EStopDepartureTuple.vehicle];
    if (vehicle) return `/${city}?pojazd=${encodeURIComponent(vehicle[EVehiclePosition.id])}`;
    return `/${city}?kurs=${encodeURIComponent(departure[EStopDepartureTuple.trip][ETripTuple.tripId])}`;
};

type Props = {
    city: string;
    departure: StopDepartureTuple;
    now: number;
    compact?: boolean;
    active?: boolean;
    showBrigade?: boolean;
    showVehicleNo?: boolean;
    onSelect?: (departure: StopDepartureTuple) => void;
};

export const DepartureRow = ({ city, departure, now, compact, active, showBrigade, showVehicleNo, onSelect }: Props) => {
    const { t } = useTranslation();
    const trip = departure[EStopDepartureTuple.trip];
    const vehicle = departure[EStopDepartureTuple.vehicle];
    const info = departure[EStopDepartureTuple.departure];
    const route = trip[ETripTuple.route];
    const status = info[EDeparture.status];
    const live = isLiveStatus(status);
    const cancelled = status === StopDepartureStatus.Cancelled;
    const departed = !!info[EDeparture.departed];
    const alight = info[EDeparture.alight] ?? 0;
    const platform = info[EDeparture.platform];
    const brigade = showBrigade ? trip[ETripTuple.brigade] || vehicle?.[EVehiclePosition.brigade] || undefined : undefined;
    const vehicleNo = showVehicleNo && vehicle ? parseVehicleId(vehicle[EVehiclePosition.id]).number : undefined;
    const shortName = trip[ETripTuple.shortName];
    const type = route[ERouteTuple.routeType];
    const link = departureLink(city, departure);
    const expected = info[EDeparture.scheduledDeparture] + (live ? info[EDeparture.delay] : 0);
    const past = departed || expected < now - 30000;

    let caption: ReactNode = null;
    if (status === StopDepartureStatus.OnPreviousTrip) caption = <>{t("stopDetails.inPreviousTripTo").replace(/ do$/, "")}</>;
    const extras: string[] = [];
    if (shortName) extras.push(shortName);
    if (platform) extras.push(`${type === 2 ? "peron" : "stanowisko"} ${platform}`);

    const actionProps = onSelect ? { onClick: () => onSelect(departure) } : { component: Link, to: link };

    return (
        <Card
            variant="outlined"
            data-departure
            sx={{
                position: "relative",
                overflow: "hidden",
                opacity: past ? 0.5 : 1,
                border: active ? "1px solid var(--default-text)" : undefined,
                background: "transparent",
                flexShrink: 0,
            }}
        >
            <CardActionArea {...(actionProps as object)} sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", p: 0.5, gap: 0.5 }}>
                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 0.5, minWidth: 0 }}>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5, alignItems: "center", minWidth: 0 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mr: "2px", flexShrink: 0 }}>
                            {vehicleNo && (
                                <Tooltip title={`${t("global.vehicleNo")}: ${vehicleNo}`}>
                                    <Typography variant="caption" sx={{ lineHeight: 1, fontSize: "0.8125rem" }}>
                                        {vehicleNo}
                                    </Typography>
                                </Tooltip>
                            )}
                            <RouteChip name={route[ERouteTuple.routeName]} type={type} brigade={brigade} showLiveBadge isLive={!!vehicle && live} />
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ lineHeight: "normal" }}>
                                {cancelled ? <s>{trip[ETripTuple.headsign]}</s> : trip[ETripTuple.headsign]}
                            </Typography>
                            {(caption || extras.length > 0) && (
                                <Typography variant="caption" noWrap sx={{ lineHeight: "normal", opacity: 0.8 }}>
                                    {caption && <i>{caption}</i>}
                                    {caption && extras.length > 0 && " · "}
                                    {extras.join(" · ")}
                                </Typography>
                            )}
                            {cancelled && (
                                <Box sx={{ display: "flex", mt: 0.5 }}>
                                    <Chip size="small" component="span" className="bg-error" label={<span className="text-white">{t("stopDetails.tripCancelled")}</span>} sx={{ maxHeight: 17 }} />
                                </Box>
                            )}
                        </Box>
                    </Box>
                    {!compact && (!vehicle || (alight & (ALIGHT.OnDemand | ALIGHT.AlightOnly)) !== 0) && (
                        <>
                            <Divider />
                            <Box sx={{ display: "flex", gap: 1, pt: 0.5, alignItems: "center", minHeight: 24 }}>
                                {(alight & ALIGHT.OnDemand) !== 0 && (
                                    <Tooltip title={`${t("global.stop")} ${t("global.onDemand").toLowerCase()}`}>
                                        <TouchAppIcon sx={{ fontSize: "1em", color: "var(--opposite-bg)" }} />
                                    </Tooltip>
                                )}
                                {(alight & ALIGHT.AlightOnly) !== 0 && (
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        {t("timetables.exitOnly")}
                                    </Typography>
                                )}
                                {!vehicle && (
                                    <Button
                                        component="span"
                                        size="small"
                                        variant="outlined"
                                        startIcon={<MapIcon sx={{ fontSize: "0.9375rem !important" }} />}
                                        className={`border-tiny-${vehicleTypeName(type)} text-${vehicleTypeName(type)}`}
                                        sx={{ textTransform: "none", px: 1, py: 0, minWidth: 0, pointerEvents: "none" }}
                                    >
                                        {t("stopDetails.tripOnMap")}
                                    </Button>
                                )}
                            </Box>
                        </>
                    )}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
                    <DepartureTime scheduled={info[EDeparture.scheduledDeparture]} delayMs={info[EDeparture.delay]} live={live} now={now} />
                </Box>
            </CardActionArea>
        </Card>
    );
};
