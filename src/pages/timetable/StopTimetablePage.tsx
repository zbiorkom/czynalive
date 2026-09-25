import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MapIcon from "@mui/icons-material/Map";
import PlaceIcon from "@mui/icons-material/Place";
import TimelineIcon from "@mui/icons-material/Timeline";
import { Box, Divider, IconButton, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { cityGet } from "@/api/client";
import { ERouteTuple, EStopTuple, type RouteTuple, type StopTupleDetailed } from "@/api/types";
import { useApi } from "@/api/useApi";
import { LiveDepartures } from "@/components/departures/LiveDepartures";
import { PageHeader } from "@/components/PageHeader";
import { ExpandableText, RouteGrid, routeLink, ShareLine, SmallAction, sortRoutes, sortTypes, stopLink, TypeCircles, typeReadableKey } from "@/components/timetable/common";
import { StopTimetable, type StopTimetableResponse } from "@/components/timetable/StopTimetable";
import { useRecentStops } from "@/components/timetable/recentStops";
import { useFavourites } from "@/store/favourites";

type DirectionsResponse = { stop: StopTupleDetailed; directions: [route: RouteTuple, direction: number, headsign: string, terminus: boolean][] };

const Title = ({ children }: { children: React.ReactNode }) => (
    <Typography sx={{ mt: 3 }} variant="h5" gutterBottom>
        {children}
    </Typography>
);

export default function StopTimetablePage() {
    const { city = "", stopId = "", routeId } = useParams();
    const [params, setParams] = useSearchParams();
    const dataCity = params.get("miasto") || city;
    const tab = params.get("zakladka") === "odjazdy" ? "departures" : "schedule";
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const { has, toggle } = useFavourites(city);
    const { add: addRecent } = useRecentStops(city);
    const agencyName = cityInfo?.agencies?.default?.name ?? cityInfo?.name ?? "";
    const cityName = cityInfo?.name ?? city;

    const meta = useApi((signal) => cityGet<DirectionsResponse>(dataCity, `/stops/${encodeURIComponent(stopId)}/directions`, undefined, signal), [dataCity, stopId]);
    const timetable = useApi(
        routeId ? (signal) => cityGet<StopTimetableResponse>(dataCity, `/stops/${encodeURIComponent(stopId)}/timetable/${encodeURIComponent(routeId)}`, undefined, signal) : null,
        [dataCity, stopId, routeId],
    );

    const stop = meta.data?.stop;
    const routes = sortRoutes((stop?.[EStopTuple.routes] as RouteTuple[] | undefined) ?? []);
    const route = routeId ? routes.find((entry) => entry[ERouteTuple.routeId] === routeId) : undefined;
    const stopName = stop ? `${stop[EStopTuple.stopName]}${stop[EStopTuple.stopCode] ? ` ${stop[EStopTuple.stopCode]}` : ""}` : "";

    useEffect(() => {
        if (stop) addRecent(stop as unknown as Parameters<typeof addRecent>[0]);
    }, [stop?.[EStopTuple.stopId]]);

    const headerTitle = `${t("timetables.timetable")} ${agencyName}`;
    const documentTitle = stop
        ? t("timetables.pageTitleStopRoute_id", { stopName, agencyName, rest: route ? `, ${t("global.route_id")} ${t(typeReadableKey(route[ERouteTuple.routeType]))} ${route[ERouteTuple.routeName]}` : "" })
        : headerTitle;

    if (meta.error) {
        return (
            <>
                <PageHeader title={headerTitle} back documentTitle={documentTitle} />
                <Box className="page" sx={{ p: 2 }}>
                    <Typography variant="body1">{meta.error.message === "STOP_NOT_FOUND" ? t("timetables.stopNotFound", { id: stopId }) : t("global.error")}</Typography>
                </Box>
            </>
        );
    }

    if (!stop) {
        return (
            <>
                <PageHeader title={headerTitle} back documentTitle={documentTitle} />
                <Box className="page" sx={{ p: 2 }}>
                    <Title>{t("global.loading")}...</Title>
                </Box>
            </>
        );
    }

    const types = stop[EStopTuple.vehicleTypes];
    const countsByType = new Map<number, number>();
    for (const entry of routes) countsByType.set(entry[ERouteTuple.routeType], (countsByType.get(entry[ERouteTuple.routeType]) ?? 0) + 1);
    const typeList = sortTypes([...countsByType.keys()]);
    const favourite = has("stops", stop[EStopTuple.stopId]);
    const direction = stop[EStopTuple.direction];

    return (
        <>
            <PageHeader title={headerTitle} back documentTitle={documentTitle} />
            <Box className="page" sx={{ p: 2, pb: 10 }}>
                <Box sx={{ display: "flex", placeItems: "center", gap: "10px", mb: "10px" }}>
                    <TypeCircles types={types} size={40} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h5">
                            <strong>
                                {t("global.stop")} {stopName}
                            </strong>{" "}
                            - {agencyName}
                        </Typography>
                        {direction && (
                            <Typography variant="caption" color="textSecondary">
                                → {direction}
                            </Typography>
                        )}
                        {route && (
                            <Typography variant="h5">
                                <strong>
                                    {t(typeReadableKey(route[ERouteTuple.routeType]))} {t("global.route_id")} {route[ERouteTuple.routeName]}
                                </strong>
                            </Typography>
                        )}
                    </Box>
                    <Tooltip title={favourite ? t("favourites.removeFromFavourites") : t("favourites.addToFavourites")}>
                        <IconButton
                            color="primary"
                            onClick={() => toggle("stops", { id: stop[EStopTuple.stopId], name: stop[EStopTuple.stopName], code: stop[EStopTuple.stopCode] || undefined })}
                        >
                            {favourite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                    <ExpandableText>
                        <Typography variant="caption" gutterBottom>
                            <Trans i18nKey="timetables.stopDescription" values={{ url_stop_name: stopName, agencyName }} components={[<strong key="1" />]} />{" "}
                            {typeList.map((type, index) => (
                                <span key={type}>
                                    {t("plural.route_id", { count: countsByType.get(type) ?? 0 })}
                                    {t("delays.basedOnNumberOfVehiclesPart2")}
                                    <strong>{t(typeReadableKey(type))}</strong>
                                    {index < typeList.length - 1 ? ", " : "."}
                                </span>
                            ))}
                        </Typography>
                    </ExpandableText>
                </Box>
                <ShareLine text={t("timetables.shareScheduleDescription", { city: cityName, url_stop_name: stopName, agencyName })}>
                    {route && (
                        <>
                            <SmallAction to={stopLink(city, stopId, undefined, dataCity)} icon={<PlaceIcon fontSize="small" />} label={t("global.stop")} />
                            <SmallAction to={routeLink(city, route[ERouteTuple.routeId], route[ERouteTuple.city])} icon={<TimelineIcon fontSize="small" />} label={t("timetables.route")} />
                        </>
                    )}
                    <SmallAction to={`/${city}?przystanek=${encodeURIComponent(stopId)}`} icon={<MapIcon fontSize="small" />} label={t("map.map")} />
                </ShareLine>
                <Divider sx={{ my: "10px" }} />
                <Tabs
                    value={tab}
                    onChange={(_, value) => {
                        const next = new URLSearchParams(params);
                        if (value === "departures") next.set("zakladka", "odjazdy");
                        else next.delete("zakladka");
                        setParams(next, { replace: true });
                    }}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    sx={{ mb: 1 }}
                >
                    <Tab value="schedule" label={t("timetables.timetable")} />
                    <Tab value="departures" label={t("stopDetails.departures")} />
                </Tabs>
                {tab === "departures" ? (
                    <Box sx={{ mt: 1 }}>
                        <LiveDepartures city={dataCity} mapCity={city} stopId={stopId} routes={routeId ? [routeId] : undefined} />
                    </Box>
                ) : !routeId ? (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body1">
                            <Trans i18nKey="timetables.chooseRouteHeader" values={{ url_stop_name: stopName }} components={[<strong key="1" />]} />
                        </Typography>
                        <Box sx={{ p: "10px" }}>
                            {routes.length === 0 ? (
                                <Typography variant="subtitle2" sx={{ my: "10px" }}>
                                    <Trans i18nKey="timetables.noRouteOnStop" values={{ stopName }} components={[<strong key="1" />]} />
                                </Typography>
                            ) : (
                                <RouteGrid routes={routes} linkFor={(entry) => stopLink(city, stopId, entry[ERouteTuple.routeId], dataCity)} />
                            )}
                        </Box>
                    </Box>
                ) : !route && !timetable.data ? (
                    timetable.error ? (
                        <Typography variant="body1">{t("timetables.routeIdNotFoundWithRoute", { route_id: routeId, stop_name: stopName })}</Typography>
                    ) : (
                        <Title>{t("global.loading")}...</Title>
                    )
                ) : timetable.error ? (
                    <Typography variant="body1">{t("global.error")}</Typography>
                ) : !timetable.data ? (
                    <Title>{t("global.loading")}...</Title>
                ) : (
                    <StopTimetable
                        city={city}
                        data={timetable.data}
                        routeName={route?.[ERouteTuple.routeName] ?? routeId}
                        routeType={route?.[ERouteTuple.routeType] ?? 3}
                        stopName={stopName}
                        cityName={cityName}
                        timeZone={cityInfo?.timezone}
                    />
                )}
            </Box>
        </>
    );
}
