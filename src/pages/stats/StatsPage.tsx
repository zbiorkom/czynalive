import { Box, Divider, Paper, Tab, Tabs, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { cityGet } from "@/api/client";
import type { RouteTuple } from "@/api/types";
import { useApi } from "@/api/useApi";
import { isMissingEndpoint } from "@/components/alerts/api";
import { VehicleTypeIcon } from "@/components/departures/VehicleTypeIcon";
import { PageHeader } from "@/components/PageHeader";
import { fetchLiveVehicles, sortTypes } from "@/components/stats/api";
import { typePlural } from "@/components/stats/common";
import { PunctualityChart, type PunctualityResponse } from "@/components/stats/PunctualityChart";
import { groupByRoute, RoutesVehiclesGrid } from "@/components/stats/RoutesVehiclesGrid";
import { vehicleType } from "@/lib/transit";

const SummaryTile = ({ label, value }: { label: string; value: number | string }) => (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontSize: "1.6rem", fontWeight: 700 }} className="text-primary">
            {value}
        </Typography>
        <Typography variant="caption">{label}</Typography>
    </Paper>
);

export default function StatsPage() {
    const { city = "" } = useParams();
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const [params, setParams] = useSearchParams();
    const cityName = cityInfo?.name ?? city;
    const month = new Intl.DateTimeFormat("en-CA", { timeZone: cityInfo?.timezone ?? "Europe/Warsaw", year: "numeric", month: "2-digit" }).format(new Date());

    const live = useApi((signal) => fetchLiveVehicles(city, signal), [city], 20_000);
    const routes = useApi((signal) => cityGet<RouteTuple[]>(city, "/routes", undefined, signal), [city]);
    const punctuality = useApi((signal) => cityGet<PunctualityResponse>(city, `/history/punctuality/${month}`, { thresholds: "1,3,5,10" }, signal), [city, month]);
    const selectedByType = useRef(new Map<number, Set<string>>());
    const [, forceRender] = useState(0);

    const grouped = useMemo(() => groupByRoute(live.data?.vehicles ?? []), [live.data]);
    const typeStats = useMemo(() => {
        const types = sortTypes(grouped.map((route) => route.type));
        return types.map((type) => {
            const typeRoutes = grouped.filter((route) => route.type === type);
            return { type, routes: typeRoutes, vehiclesCount: typeRoutes.reduce((sum, route) => sum + route.vehicles.length, 0) };
        });
    }, [grouped]);

    const requested = params.get("rodzaj");
    const current = typeStats.find((entry) => vehicleType(entry.type).key === requested) ?? typeStats[0];
    const selected = current ? (selectedByType.current.get(current.type) ?? new Set(current.routes.map((route) => route.key))) : new Set<string>();

    const agencyNames = useMemo(
        () => Object.fromEntries(Object.entries(cityInfo?.agencies ?? {}).map(([id, agency]) => [id, agency.name])),
        [cityInfo],
    );
    const liveVehiclesCount = live.data?.vehicles.length ?? 0;

    return (
        <>
            <PageHeader title={`${t("stats.pageTitle")} - ${cityName}`} />
            <div className="page" style={{ maxWidth: 1400 }}>
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h3" sx={{ fontSize: "1.6rem", fontWeight: 500, mb: 1 }}>
                        {t("stats.pageTitle")} - {cityName}
                    </Typography>
                    <Typography variant="body1" component="h2">
                        <Trans i18nKey="stats.part1" values={{ city: cityName }} components={[<strong key="1" />]} />
                    </Typography>
                    <Divider style={{ margin: "5px 0" }} />

                    <Grid container spacing={1} sx={{ my: 2 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <SummaryTile label={t("stats.part2")} value={live.data ? liveVehiclesCount : "–"} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <SummaryTile label={t("stats.part3")} value={live.data ? grouped.length : "–"} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <SummaryTile label={t("stats.part4")} value={routes.data ? routes.data.filter((route) => route[1] === city).length : "–"} />
                        </Grid>
                    </Grid>

                    <Typography variant="h4" gutterBottom sx={{ mt: 3, fontSize: "1.3rem", fontWeight: 500 }}>
                        {t("stats.vehiclesOnRoutes")}
                    </Typography>
                    {live.error && !live.data ? (
                        <Typography variant="body1">{isMissingEndpoint(live.error) ? t("global.noData") : t("global.error")}</Typography>
                    ) : live.loading && !live.data ? (
                        <Typography variant="body1">{t("global.loading")}...</Typography>
                    ) : typeStats.length === 0 || !current ? (
                        <Typography variant="body1">{t("global.noData")}</Typography>
                    ) : (
                        <>
                            <Tabs
                                value={current.type}
                                onChange={(_, next: number) => {
                                    const nextParams = new URLSearchParams(params);
                                    nextParams.set("rodzaj", vehicleType(next).key);
                                    setParams(nextParams, { replace: true });
                                }}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                                allowScrollButtonsMobile
                                sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
                            >
                                {typeStats.map((entry) => (
                                    <Tab key={entry.type} value={entry.type} icon={<VehicleTypeIcon routeType={entry.type} />} iconPosition="start" label={typePlural(entry.type)} sx={{ minHeight: "48px" }} />
                                ))}
                            </Tabs>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {typePlural(current.type)}: {t("plural.route_id", { count: current.routes.length })}, {t("plural.vehicle", { count: current.vehiclesCount })}{" "}
                                    {t("global.live").toLowerCase()}
                                </Typography>
                            </Box>
                            <RoutesVehiclesGrid
                                key={current.type}
                                routes={current.routes}
                                city={city}
                                selected={selected}
                                onSelectedChange={(next) => {
                                    selectedByType.current.set(current.type, next);
                                    forceRender((value) => value + 1);
                                }}
                            />
                        </>
                    )}

                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h4" gutterBottom sx={{ fontSize: "1.3rem", fontWeight: 500 }}>
                        Punktualność w bieżącym miesiącu
                    </Typography>
                    <Typography variant="caption" component="p" sx={{ mb: 1 }}>
                        Udział odjazdów z przystanków według odchyłki od rozkładu ({month}), z podziałem na przewoźników.
                    </Typography>
                    {punctuality.data ? (
                        <PunctualityChart data={punctuality.data} agencyNames={agencyNames} />
                    ) : punctuality.error ? (
                        <Typography variant="body2">{t("global.noData")}</Typography>
                    ) : (
                        <Typography variant="body2">{t("global.loading")}...</Typography>
                    )}
                </Box>
            </div>
        </>
    );
}
