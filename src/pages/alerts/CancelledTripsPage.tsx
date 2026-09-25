import BlockIcon from "@mui/icons-material/Block";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import { Box, Chip, CircularProgress, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { ERouteTuple, RouteType } from "@/api/types";
import { useApi } from "@/api/useApi";
import { fetchCancelledTrips, isMissingEndpoint, type CancelledTrip } from "@/components/alerts/api";
import { TripOnMapButton } from "@/components/alerts/TripOnMapButton";
import { VehicleTypeIcon } from "@/components/departures/VehicleTypeIcon";
import { PageHeader } from "@/components/PageHeader";
import { compareValues, DataTable, type Column } from "@/components/stats/DataTable";

const TYPE_ORDER = (type: number) => (type === RouteType.Tram ? 0 : type === RouteType.Trolleybus ? 1 : type === RouteType.Bus ? 2 : 3);

const brigadeLink = (city: string, trip: CancelledTrip) =>
    `/${city}/rozklad-jazdy-brygady/linia/${encodeURIComponent(trip.route[ERouteTuple.routeId])}/brygada/${encodeURIComponent(trip.brigade)}`;

export default function CancelledTripsPage() {
    const { city = "" } = useParams();
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const [view, setView] = useState<"list" | "grid">("list");
    const { data, error, loading } = useApi((signal) => fetchCancelledTrips(city, signal), [city], 60_000);
    const timeZone = cityInfo?.timezone ?? "Europe/Warsaw";
    const cityName = cityInfo?.name ?? city;

    const formatTime = (epochMs: number) => {
        const day = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(epochMs));
        const time = new Date(epochMs).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone });
        return data && day !== data.date ? `${day} ${time}` : time;
    };

    const groups = useMemo(() => {
        const byRoute = new Map<string, CancelledTrip[]>();
        for (const trip of data?.trips ?? []) {
            const key = trip.route[ERouteTuple.routeId];
            if (!byRoute.has(key)) byRoute.set(key, []);
            byRoute.get(key)!.push(trip);
        }
        return [...byRoute.values()]
            .map((trips) => trips.sort((a, b) => a.startTime - b.startTime))
            .sort(
                (a, b) =>
                    TYPE_ORDER(a[0].route[ERouteTuple.routeType]) - TYPE_ORDER(b[0].route[ERouteTuple.routeType]) ||
                    compareValues(a[0].route[ERouteTuple.routeName], b[0].route[ERouteTuple.routeName]),
            );
    }, [data]);

    const columns: Column<CancelledTrip>[] = [
        { field: "route", header: t("cancelledTrips.route"), value: (trip) => trip.route[ERouteTuple.routeName], minWidth: 60 },
        {
            field: "brigade",
            header: t("cancelledTrips.brigade"),
            value: (trip) => trip.brigade,
            minWidth: 80,
            render: (trip) =>
                trip.brigade ? (
                    <Link to={brigadeLink(city, trip)} style={{ textDecoration: "none", color: "var(--primary)", fontWeight: 500 }}>
                        {trip.brigade}
                    </Link>
                ) : (
                    "?"
                ),
        },
        { field: "startTime", header: t("cancelledTrips.startTime"), value: (trip) => trip.startTime, render: (trip) => formatTime(trip.startTime), csv: (trip) => formatTime(trip.startTime), minWidth: 110 },
        { field: "endTime", header: t("cancelledTrips.endTime"), value: (trip) => trip.endTime, render: (trip) => formatTime(trip.endTime), csv: (trip) => formatTime(trip.endTime), minWidth: 110 },
        { field: "startStop", header: t("cancelledTrips.startStop"), value: (trip) => trip.startStop, minWidth: 150 },
        { field: "endStop", header: t("cancelledTrips.endStop"), value: (trip) => trip.endStop, minWidth: 150 },
        {
            field: "tripOnMap",
            header: "",
            value: () => "",
            sortable: false,
            minWidth: 150,
            render: (trip) => <TripOnMapButton city={trip.route[ERouteTuple.city]} tripId={trip.tripId} type={trip.route[ERouteTuple.routeType]} />,
        },
    ];

    return (
        <>
            <PageHeader title={t("cancelledTrips.pageTitle", { city: cityName })} />
            <div className="page">
                <Box sx={{ p: { xs: 0, sm: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="h4" sx={{ fontSize: "1.5rem" }}>
                            {t("cancelledTrips.header")}
                            {data?.trips ? ` (${data.trips.length})` : ""}
                        </Typography>
                        <ToggleButtonGroup value={view} exclusive size="small" aria-label="view mode" onChange={(_, next) => next && setView(next)}>
                            <ToggleButton value="list" aria-label="list view">
                                <ViewListIcon />
                            </ToggleButton>
                            <ToggleButton value="grid" aria-label="grid view">
                                <GridViewIcon />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    {data?.date && (
                        <Typography variant="body2" gutterBottom>
                            {t("cancelledTrips.todayIs", { date: data.date })}
                        </Typography>
                    )}
                    <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 1 }}>
                        {t("cancelledTrips.seoMiniText")}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3, fontWeight: "medium" }}>
                        {t("cancelledTrips.incompleteData")}
                    </Typography>
                    {loading && !data && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {error && !data && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Typography>{isMissingEndpoint(error) ? t("global.noData") : t("global.error")}</Typography>
                        </Box>
                    )}
                    {data && data.trips.length === 0 && (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 4 }}>
                            <BlockIcon sx={{ fontSize: 60, color: "text.secondary", opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                                {t("cancelledTrips.noCancelledTrips")}
                            </Typography>
                        </Box>
                    )}
                    {data && data.trips.length > 0 && (
                        <Box sx={{ width: "100%", mt: 2 }}>
                            {view === "grid" ? (
                                <>
                                    <Typography variant="body2" sx={{ textAlign: "center", display: { md: "none" } }}>
                                        {t("delays.tableIsMovable")}
                                    </Typography>
                                    <DataTable
                                        rows={data.trips}
                                        columns={columns}
                                        getRowId={(trip) => trip.tripId}
                                        initialSort={{ field: "startTime", direction: "asc" }}
                                        quickFilter={false}
                                        pageSize={20}
                                    />
                                </>
                            ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", mt: 1 }}>
                                    {groups.map((trips, index) => {
                                        const route = trips[0].route;
                                        return (
                                            <Box
                                                key={route[ERouteTuple.routeId]}
                                                sx={{ display: "flex", flexDirection: "column", borderColor: "divider", py: 2, borderBottom: index < groups.length - 1 ? "1px solid" : "none" }}
                                            >
                                                <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", display: "flex", alignItems: "center", fontSize: "1.15rem" }}>
                                                    <Box component="span" sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                                                        <VehicleTypeIcon routeType={route[ERouteTuple.routeType]} />
                                                    </Box>
                                                    <Link
                                                        to={`/${route[ERouteTuple.city]}/rozklad-jazdy/linia/${encodeURIComponent(route[ERouteTuple.routeId])}`}
                                                        style={{ color: "inherit", textDecoration: "none" }}
                                                    >
                                                        {t("cancelledTrips.route")} {route[ERouteTuple.routeName]}
                                                    </Link>
                                                </Typography>
                                                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                                    {trips.map((trip) => (
                                                        <li key={trip.tripId} style={{ marginBottom: "24px" }}>
                                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                                                <Typography variant="body1" color="textPrimary">
                                                                    <strong>{formatTime(trip.startTime)}</strong> {trip.startStop || "?"} → <strong>{formatTime(trip.endTime)}</strong>{" "}
                                                                    {trip.endStop || "?"}
                                                                </Typography>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                                    {trip.brigade && (
                                                                        <Typography variant="body2">
                                                                            <Link to={brigadeLink(city, trip)} style={{ textDecoration: "none", color: "var(--primary)", fontWeight: 500 }}>
                                                                                {t("cancelledTrips.brigade")} {trip.brigade}
                                                                            </Link>
                                                                        </Typography>
                                                                    )}
                                                                    <TripOnMapButton city={route[ERouteTuple.city]} tripId={trip.tripId} type={route[ERouteTuple.routeType]} />
                                                                    {trip.partial && <Chip size="small" label="Odwołany częściowo" className="bg-warning text-white" />}
                                                                </Box>
                                                            </Box>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </div>
        </>
    );
}
