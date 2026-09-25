import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box, Divider, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tooltip, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ERouteTuple, ETripTuple, type RouteTuple, type TripTupleDetailed } from "@/api/types";
import { RouteBadge } from "@/components/RouteBadge";
import { formatTime } from "@/lib/transit";
import { VehicleLink, type ScheduleRow } from "./BrigadeSchedule";
import { formatDuration, formatKm, tripEnd, tripStart } from "./format";
import type { LiveVehicle } from "./useBrigadeLive";

type Extreme = { value: number; count: number };

const extremes = (values: number[]): { max: Extreme; min: Extreme } | null => {
    if (!values.length) return null;
    const max = Math.max(...values);
    const min = Math.min(...values);
    return { max: { value: max, count: values.filter((value) => value === max).length }, min: { value: min, count: values.filter((value) => value === min).length } };
};

const StatRow = ({ label, info, children }: { label: string; info?: string; children: ReactNode }) => (
    <Box sx={{ py: 0.75 }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {label}
            {info && (
                <Tooltip title={info} enterTouchDelay={0}>
                    <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                </Tooltip>
            )}
        </Typography>
        <Typography variant="body1" component="div" sx={{ fontWeight: 600 }}>
            {children}
        </Typography>
    </Box>
);

const Stats = ({ city, trips, vehicles, timeZone }: { city: string; trips: TripTupleDetailed[]; vehicles: LiveVehicle[]; timeZone: string }) => {
    const { t } = useTranslation();
    if (!trips.length) return null;
    const rides = trips.map((trip) => tripEnd(trip) - tripStart(trip));
    const breaks = trips.slice(1).map((trip, index) => Math.max(0, tripStart(trip) - tripEnd(trips[index])));
    const distances = trips.map((trip) => trip[ETripTuple.totalDistance]).filter((value) => value > 0);
    const ride = extremes(rides);
    const pause = extremes(breaks);
    const distance = extremes(distances);
    const first = tripStart(trips[0]);
    const last = tripEnd(trips[trips.length - 1]);
    const countText = (extreme: Extreme, key: "plural.trip" | "plural.break") =>
        extreme.count > 1 ? ` (${t(key, { count: extreme.count })} ${t("brigadeSchedule.thisDistance")})` : "";

    return (
        <Box sx={{ mt: 1.25, px: 0.5 }}>
            <Typography variant="body1" gutterBottom>
                {t("brigadeSchedule.tripCount")}: <b>{trips.length}</b>
            </Typography>
            <Divider sx={{ my: 1.25 }} />
            {vehicles.length > 0 && (
                <>
                    <Typography variant="body1">{t("brigadeSchedule.vehicleOnBrigade")}:</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, my: 1 }}>
                        {vehicles.map((vehicle) => (
                            <VehicleLink key={vehicle.vehicleId} city={city} vehicle={vehicle} translationKey="brigadeSchedule.goToVehicleFromBrigade" />
                        ))}
                    </Box>
                    <Divider sx={{ my: 1.25 }} />
                </>
            )}
            <StatRow label={t("brigadeSchedule.totalBrigadeTime")} info={t("brigadeSchedule.totalBrigadeTimeDescription")}>
                {formatDuration(last - first)}{" "}
                <Typography component="span" variant="body2" color="text.secondary">
                    ({t("global.from").toLowerCase()} {formatTime(first, timeZone)} {t("global.to").toLowerCase()} {formatTime(last, timeZone)})
                </Typography>
            </StatRow>
            <StatRow label={t("brigadeSchedule.totalRideTime")} info={t("brigadeSchedule.totalRideTimeDescription")}>
                {formatDuration(rides.reduce((sum, value) => sum + value, 0))}
            </StatRow>
            {ride && (
                <>
                    <StatRow label={t("brigadeSchedule.longestRide")}>
                        {formatDuration(ride.max.value)}
                        {countText(ride.max, "plural.trip")}
                    </StatRow>
                    <StatRow label={t("brigadeSchedule.shortestRide")}>
                        {formatDuration(ride.min.value)}
                        {countText(ride.min, "plural.trip")}
                    </StatRow>
                </>
            )}
            <StatRow label={t("brigadeSchedule.totalBreakTime")}>{formatDuration(breaks.reduce((sum, value) => sum + value, 0))}</StatRow>
            {pause && (
                <>
                    <StatRow label={t("brigadeSchedule.longestBreakTime")}>
                        {formatDuration(pause.max.value)}
                        {countText(pause.max, "plural.break")}
                    </StatRow>
                    <StatRow label={t("brigadeSchedule.shortestBreakTime")}>
                        {formatDuration(pause.min.value)}
                        {countText(pause.min, "plural.break")}
                    </StatRow>
                </>
            )}
            {distance && (
                <>
                    <StatRow label={t("brigadeSchedule.totalDistance")} info={t("brigadeSchedule.totalDistanceDescription")}>
                        {formatKm(distances.reduce((sum, value) => sum + value, 0))}
                    </StatRow>
                    <StatRow label={t("brigadeSchedule.longestRideByDistance")}>
                        {formatKm(distance.max.value)}
                        {countText(distance.max, "plural.trip")}
                    </StatRow>
                    <StatRow label={t("brigadeSchedule.shortestRideByDistance")}>
                        {formatKm(distance.min.value)}
                        {countText(distance.min, "plural.trip")}
                    </StatRow>
                </>
            )}
            <Divider sx={{ my: 2.5 }} />
        </Box>
    );
};

export const BrigadeData = ({ city, rows, lines, timeZone }: { city: string; rows: ScheduleRow[]; lines: RouteTuple[]; timeZone: string }) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState("total");
    const vehicles = [...new Map(rows.filter((row) => row.vehicle).map((row) => [row.vehicle!.vehicleId, row.vehicle!])).values()];
    const trips = rows.map((row) => row.trip);
    if (lines.length < 2) return <Stats city={city} trips={trips} vehicles={vehicles} timeZone={timeZone} />;

    const lineTrips = tab === "total" ? trips : trips.filter((trip) => trip[ETripTuple.route][ERouteTuple.routeId] === tab);
    return (
        <>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                <Tab value="total" label={t("brigadeSchedule.overall")} sx={{ textTransform: "none" }} />
                {lines.map((line) => (
                    <Tab key={line[ERouteTuple.routeId]} value={line[ERouteTuple.routeId]} label={<RouteBadge route={line} size="small" />} sx={{ minWidth: 0 }} />
                ))}
            </Tabs>
            <Stats city={city} trips={lineTrips} vehicles={tab === "total" ? vehicles : []} timeZone={timeZone} />
        </>
    );
};

export const BrigadeTable = ({ rows, multi, timeZone }: { rows: ScheduleRow[]; multi: boolean; timeZone: string }) => {
    const { t } = useTranslation();
    const cell = { p: 0.5, wordWrap: "break-word", whiteSpace: "normal" } as const;
    const head = { ...cell, fontWeight: 700, backgroundColor: "background.paper" } as const;
    return (
        <TableContainer sx={{ width: "100%", overflow: "hidden", mt: 1 }}>
            <Table stickyHeader size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                <TableHead>
                    <TableRow>
                        {multi && (
                            <>
                                <TableCell sx={{ ...head, width: 50 }}>{t("global.route_id")}</TableCell>
                                <TableCell sx={{ ...head, width: 65 }}>{t("global.brigade")}</TableCell>
                            </>
                        )}
                        <TableCell sx={{ ...head, width: 52 }}>{t("brigadeSchedule.simplifiedColumnStart")}</TableCell>
                        <TableCell sx={{ ...head, width: 58 }}>{t("brigadeSchedule.simplifiedColumnEnd")}</TableCell>
                        <TableCell sx={head}>{t("brigadeSchedule.simplifiedColumnFrom")}</TableCell>
                        <TableCell sx={head}>{t("brigadeSchedule.simplifiedColumnTo")}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map(({ trip, active }) => (
                        <TableRow key={trip[ETripTuple.tripId]} selected={active}>
                            {multi && (
                                <>
                                    <TableCell sx={cell}>{trip[ETripTuple.route][ERouteTuple.routeName]}</TableCell>
                                    <TableCell sx={cell}>{trip[ETripTuple.brigade]}</TableCell>
                                </>
                            )}
                            <TableCell sx={cell}>{formatTime(tripStart(trip), timeZone)}</TableCell>
                            <TableCell sx={cell}>{formatTime(tripEnd(trip), timeZone)}</TableCell>
                            <TableCell sx={cell}>{trip[ETripTuple.firstStop][0]}</TableCell>
                            <TableCell sx={cell}>{trip[ETripTuple.lastStop][0]}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
