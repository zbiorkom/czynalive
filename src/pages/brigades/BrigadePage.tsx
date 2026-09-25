import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { ERouteTuple, ETripTuple, RouteType, type RouteTuple } from "@/api/types";
import { useApi } from "@/api/useApi";
import { ErrorBox, Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { RouteBadge } from "@/components/RouteBadge";
import { BrigadeData, BrigadeTable } from "@/components/brigades/BrigadeData";
import { BrigadeSchedule, VehicleLink, type ScheduleRow } from "@/components/brigades/BrigadeSchedule";
import { fetchBrigadeTrips } from "@/components/brigades/data";
import { DateTabs, formatDateLong, useBrigadeDate } from "@/components/brigades/DateTabs";
import { tripEnd } from "@/components/brigades/format";
import { ShareLink } from "@/components/brigades/ShareButton";
import { useBrigadeLive } from "@/components/brigades/useBrigadeLive";
import { VehicleTypeIcon } from "@/components/brigades/VehicleTypeIcon";

const LINE_LABELS: Record<number, string> = {
    [RouteType.Tram]: "global.lineTram",
    [RouteType.Subway]: "global.subway",
    [RouteType.Bus]: "global.lineBus",
    [RouteType.Rail]: "global.train",
    [RouteType.Ferry]: "global.lineFerry",
    [RouteType.Trolleybus]: "global.lineTrolleybus",
};

type TabKey = "schedule" | "brigade-data" | "brigade-table";
const TABS: TabKey[] = ["schedule", "brigade-data", "brigade-table"];

export default function BrigadePage({ multi = false }: { multi?: boolean }) {
    const { city = "", routeId = "", brigade = "" } = useParams();
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const [tab, setTab] = useState<TabKey>("schedule");
    const [now, setNow] = useState(Date.now());
    const { dates, selected, setDate, isToday, timeZone, loading: datesLoading } = useBrigadeDate(city);
    const trips = useApi((signal) => fetchBrigadeTrips(city, routeId, brigade, selected, signal), [city, routeId, brigade, selected]);
    const tripList = trips.data ?? [];
    const tripIds = useMemo(() => tripList.map((trip) => trip[ETripTuple.tripId]), [trips.data]);
    const vehicles = useBrigadeLive(city, routeId, brigade, tripIds, isToday && tripList.length > 0);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const ownRoute: RouteTuple | undefined =
        tripList.find((trip) => trip[ETripTuple.route][ERouteTuple.routeId] === routeId)?.[ETripTuple.route] ?? tripList[0]?.[ETripTuple.route];
    const lines = useMemo(() => {
        const map = new Map<string, RouteTuple>();
        for (const trip of tripList) map.set(trip[ETripTuple.route][ERouteTuple.routeId], trip[ETripTuple.route]);
        return [...map.values()].sort((a, b) => a[ERouteTuple.routeName].localeCompare(b[ERouteTuple.routeName], undefined, { numeric: true }));
    }, [trips.data]);
    const isMulti = lines.length > 1;

    const rows: ScheduleRow[] = useMemo(() => {
        const byTrip = new Map(vehicles.filter((vehicle) => vehicle.tripId).map((vehicle) => [vehicle.tripId!, vehicle]));
        const base = tripList.map((trip) => ({ trip, vehicle: byTrip.get(trip[ETripTuple.tripId]) ?? null, active: false }));
        if (!isToday) return base;
        const withVehicle = base.filter((row) => row.vehicle);
        if (withVehicle.length) {
            for (const row of withVehicle) row.active = true;
            return base;
        }
        const closest = base.findIndex((row) => now < tripEnd(row.trip));
        if (closest !== -1) base[closest].active = true;
        return base;
    }, [trips.data, vehicles, isToday, now]);
    const unmatchedVehicles = vehicles.filter((vehicle) => !rows.some((row) => row.vehicle?.vehicleId === vehicle.vehicleId));

    const lineName = ownRoute?.[ERouteTuple.routeName] ?? routeId;
    const agency = ownRoute ? cityInfo?.agencies?.[ownRoute[ERouteTuple.routeAgency]]?.name ?? cityInfo?.agencies?.default?.name : cityInfo?.agencies?.default?.name;
    const type = ownRoute?.[ERouteTuple.routeType] ?? RouteType.Bus;
    const title = `${t("global.route_id")} ${lineName}, ${t("global.brigade").toLowerCase()} ${brigade}`;

    return (
        <>
            <PageHeader
                title={title}
                back={multi ? `/${city}/laczony-rozklad-jazdy-brygady` : `/${city}/rozklad-jazdy-brygady`}
                documentTitle={`${t("brigadeSchedule.pageTitleBrigadeSchedule", { route_id: lineName, brigade })} ${cityInfo?.name ?? city}`}
            />
            <div className="page">
                <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: 1.25 }}>
                    <VehicleTypeIcon type={type} size={48} />
                    <div>
                        <Typography variant="h6">
                            <strong>
                                {t(LINE_LABELS[type] ?? "global.lineBus")} {lineName}
                            </strong>
                            {agency ? ` - ${agency}` : ""}
                        </Typography>
                        <Typography variant="h5">
                            <strong>
                                {t("global.brigade")} {brigade}
                            </strong>
                        </Typography>
                    </div>
                </Box>
                {isMulti && (
                    <Box sx={{ display: "flex", gap: 1, flexDirection: "column", mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {t("brigadeSchedule.mergedWithLines")}:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {lines.map((line) => (
                                <RouteBadge key={line[ERouteTuple.routeId]} route={line} />
                            ))}
                        </Box>
                    </Box>
                )}
                <ShareLink title={`${cityInfo?.name ?? ""} ${t("brigadeSchedule.shareUrlDescription", { route_id: lineName, brigade })}`} />

                {!(datesLoading && !dates.length) && <DateTabs dates={dates} selected={selected} onChange={setDate} />}

                {trips.loading && !trips.data ? (
                    <Loading />
                ) : trips.error ? (
                    <ErrorBox error={trips.error} onRetry={trips.reload} />
                ) : tripList.length === 0 ? (
                    <Box sx={{ my: 1.25 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {t("global.nothingFound")}
                        </Typography>
                        <Typography variant="subtitle2">
                            {t("global.route_id")}: {lineName}
                        </Typography>
                        <Typography variant="subtitle2">
                            {t("global.brigade")}: {brigade}
                        </Typography>
                        <Typography variant="subtitle2">
                            {t("global.date")}: {formatDateLong(selected)}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Tabs
                            value={tab}
                            onChange={(_, value) => setTab(value)}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                        >
                            {TABS.map((key) => (
                                <Tab
                                    key={key}
                                    value={key}
                                    label={t(
                                        key === "schedule"
                                            ? "brigadeSchedule.tabBrigadeSchedule"
                                            : key === "brigade-data"
                                              ? "brigadeSchedule.tabBrigadeData"
                                              : "brigadeSchedule.tabBrigadeSimplified",
                                    )}
                                />
                            ))}
                        </Tabs>
                        {unmatchedVehicles.length > 0 && tab === "schedule" && (
                            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography variant="body2" sx={{ textAlign: "center", fontWeight: 500 }}>
                                    {t("brigadeSchedule.vehicleOnBrigade")}:
                                </Typography>
                                {unmatchedVehicles.map((vehicle) => (
                                    <VehicleLink key={vehicle.vehicleId} city={city} vehicle={vehicle} translationKey="brigadeSchedule.goToVehicleFromBrigade" />
                                ))}
                            </Box>
                        )}
                        {tab === "schedule" && <BrigadeSchedule city={city} rows={rows} timeZone={timeZone} multi={isMulti} />}
                        {tab === "brigade-data" && <BrigadeData city={city} rows={rows} lines={lines} timeZone={timeZone} />}
                        {tab === "brigade-table" && <BrigadeTable rows={rows} multi={isMulti} timeZone={timeZone} />}
                    </>
                )}
            </div>
        </>
    );
}
