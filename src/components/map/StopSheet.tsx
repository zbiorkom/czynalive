import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import ShareIcon from "@mui/icons-material/Share";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Box, Button, IconButton, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCity } from "@/api/cities";
import { cityGet } from "@/api/client";
import { EDeparture, ERouteTuple, EStopDepartureTuple, EStopTuple, ETripTuple, type RouteTuple, type StopDepartureTuple, type StopTupleDetailed } from "@/api/types";
import { useApi } from "@/api/useApi";
import { DepartureRow } from "@/components/departures/DepartureRow";
import { useNow } from "@/components/departures/departureUtils";
import { MarqueeText, PopupInfo, StopNameBadge } from "@/components/departures/parts";
import { useStopDepartures } from "@/components/departures/useStopDepartures";
import { RouteButton, RouteGrid, sortRoutes, uniqueRoutes } from "@/components/timetable/common";
import { StopTimetable, type StopTimetableResponse } from "@/components/timetable/StopTimetable";
import { CopyRow } from "@/components/vehicle/VehicleSheet";
import { useFavourites } from "@/store/favourites";
import { useSettings } from "@/store/settings";
import { MapSheet, SheetFab, SheetHeaderRow, SheetInfoRow, useSheet } from "./Sheet";
import { shareLink } from "./share";
import { useToast } from "./SheetParts";

type Props = {
    city: string;
    stopCity: string;
    stopId: string;
    hasBack: boolean;
    onClose: () => void;
    onBack: () => void;
    onLocate: (stop: StopTupleDetailed) => void;
    onDepartureActive: (departure: StopDepartureTuple | null) => void;
    onHeightChange: (visiblePx: number) => void;
};

const MAX_LIMIT = 100;

// "Odjazdy" tab: live board, first departure selected and shown on the map.
const SheetDepartures = ({ city, stopId, onActive }: { city: string; stopId: string; onActive: (departure: StopDepartureTuple | null) => void }) => {
    const { t } = useTranslation();
    const [settings] = useSettings();
    const [limit, setLimit] = useState(10);
    const [loadingMore, setLoadingMore] = useState(false);
    const [active, setActive] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const now = useNow();
    const { departures, error } = useStopDepartures(city, stopId, { limit });

    useEffect(() => {
        setLimit(10);
        setActive(0);
    }, [city, stopId]);
    useEffect(() => setLoadingMore(false), [departures]);

    const selected = departures?.[Math.min(active, Math.max(0, (departures?.length ?? 1) - 1))] ?? null;
    const selectedKey = selected ? `${selected[EStopDepartureTuple.trip][ETripTuple.tripId]}:${selected[EStopDepartureTuple.vehicle]?.[4]?.join(",") ?? ""}` : "";
    useEffect(() => onActive(selected), [selectedKey]);
    useEffect(() => () => onActive(null), []);

    if (!departures && error) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography variant="h4">{t("global.error")}</Typography>
            </Box>
        );
    }
    if (!departures) {
        return (
            <div>
                {["first", "second", "third"].map((key) => (
                    <Skeleton key={key} animation="wave" variant="text" height={50} width="100%" style={{ marginBottom: 5 }} />
                ))}
            </div>
        );
    }
    if (departures.length === 0) {
        return (
            <Box sx={{ m: 2 }}>
                <Typography variant="body1">{t("stopDetails.noSchedulesInfo")}</Typography>
            </Box>
        );
    }
    return (
        <Box ref={listRef} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {departures.map((departure, index) => (
                <div key={`${departure[EStopDepartureTuple.trip][ETripTuple.tripId]}-${departure[EStopDepartureTuple.departure][EDeparture.scheduledDeparture]}`} data-departure="true">
                    <DepartureRow
                        city={city}
                        departure={departure}
                        now={now}
                        showBrigade={settings.departuresShowBrigade}
                        showVehicleNo={settings.departuresShowVehicleNo}
                        active={index === active}
                        onSelect={() => setActive(index)}
                    />
                </div>
            ))}
            {limit < MAX_LIMIT && departures.length >= limit && (
                <Button
                    variant="outlined"
                    fullWidth
                    disabled={loadingMore}
                    sx={{ mt: 4 }}
                    className="text-default-text"
                    onClick={() => {
                        setLoadingMore(true);
                        setLimit((value) => Math.min(MAX_LIMIT, value + 10));
                    }}
                >
                    {loadingMore ? `${t("global.loading")}...` : t("stopDetails.showLaterSchedules")}
                </Button>
            )}
        </Box>
    );
};

// "Rozkład" tab: lines of the stop, then the static timetable of the chosen one.
const SheetSchedule = ({ city, stop }: { city: string; stop: StopTupleDetailed }) => {
    const { t } = useTranslation();
    const { snapTo } = useSheet();
    const cityInfo = useCity(city);
    const [route, setRoute] = useState<RouteTuple | null>(null);
    const stopId = stop[EStopTuple.stopId];
    const stopName = stop[EStopTuple.stopName];
    const routes = useMemo(() => sortRoutes(uniqueRoutes(stop[EStopTuple.routes] ?? [])), [stop]);
    const timetable = useApi(
        route ? (signal) => cityGet<StopTimetableResponse>(stop[EStopTuple.city], `/stops/${stopId}/timetable/${route[ERouteTuple.routeId]}`, undefined, signal) : null,
        [stopId, route?.[ERouteTuple.routeId]],
    );

    useEffect(() => setRoute(null), [stopId]);
    useEffect(() => {
        if (route) snapTo(0.8);
    }, [route]);

    if (!route) {
        return (
            <Box>
                <Typography variant="body1" gutterBottom>
                    <Trans i18nKey="stopDetails.linesFromStop" values={{ stopName }} components={[<strong key="1" />]} />
                </Typography>
                {routes.length === 0 ? <Typography variant="body1">{t("stopDetails.noLinesOnStop")}</Typography> : <RouteGrid routes={routes} onSelect={setRoute} />}
            </Box>
        );
    }
    return (
        <Box>
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    backgroundColor: "var(--default-bg)",
                    borderBottom: "1px solid var(--neutral-light)",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    mx: -1,
                    px: 1,
                    py: 1,
                }}
            >
                <IconButton size="small" aria-label={t("stopDetails.backToLines")} onClick={() => setRoute(null)} sx={(theme) => ({ color: theme.palette.grey[500], flexShrink: 0 })}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexShrink: 0, width: 80, height: 28 }}>
                    <RouteButton route={route} selected sx={{ height: 28 }} />
                </Box>
                <MarqueeText text={t("stopDetails.scheduleFromStop", { stopName })} variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }} />
            </Box>
            {timetable.data ? (
                <StopTimetable
                    city={city}
                    data={timetable.data}
                    routeName={route[ERouteTuple.routeName]}
                    routeType={route[ERouteTuple.routeType]}
                    stopName={stopName}
                    cityName={cityInfo?.name ?? ""}
                    headsign={route[ERouteTuple.routeLongName]}
                />
            ) : (
                ["first", "second", "third"].map((key) => <Skeleton key={key} animation="wave" variant="text" height={50} width="100%" sx={{ mb: 1 }} />)
            )}
        </Box>
    );
};

// `?przystanek=` drawer.
export const StopSheet = ({ city, stopCity, stopId, hasBack, onClose, onBack, onLocate, onDepartureActive, onHeightChange }: Props) => {
    const { t } = useTranslation();
    const toast = useToast();
    const { has, toggle } = useFavourites(city);
    const { data } = useApi((signal) => cityGet<{ stop: StopTupleDetailed }>(stopCity, `/stops/${encodeURIComponent(stopId)}/directions`, undefined, signal), [stopCity, stopId]);
    const stop = data?.stop;
    const favourite = has("stops", stopId);
    const isFrequencyStop = !!stop?.[EStopTuple.vehicleTypes].includes(1);
    const tabs = [...(isFrequencyStop ? ["frequency"] : []), "departures", "schedule"];
    const [tab, setTab] = useState("departures");

    useEffect(() => setTab(isFrequencyStop ? "frequency" : "departures"), [stopId, isFrequencyStop]);
    useEffect(() => {
        if (stop) onLocate(stop);
    }, [stop?.[EStopTuple.stopId]]);

    const copy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.show(`${t("global.copied")} "${value}"`);
        } catch {}
    };

    const share = async () => {
        const url = `${window.location.origin}/${city}?przystanek=${encodeURIComponent(stopId)}${stopCity !== city ? `&miasto=${stopCity}` : ""}`;
        const result = await shareLink(t("global.stop"), t("stopDetails.shareDescription", { name: stop?.[EStopTuple.stopName] ?? "" }), url);
        if (result === "copied") toast.show(t("global.copied"));
    };

    const shortId = stopId.length > 15 ? `${stopId.slice(0, 12)}...` : stopId;
    const location = stop?.[EStopTuple.location];

    const header = (
        <>
            <SheetHeaderRow
                left={
                    stop ? (
                        <>
                            <SheetFab
                                color="secondary"
                                Icon={favourite ? StarIcon : StarBorderIcon}
                                className={favourite ? "bg-warning" : ""}
                                label={t(favourite ? "favourites.removeFromFavourites" : "favourites.addToFavourites")}
                                onClick={() => toggle("stops", { id: stopId, name: stop[EStopTuple.stopName], code: stop[EStopTuple.stopCode] || undefined })}
                            />
                            <SheetFab color="secondary" Icon={ShareIcon} label={t("global.share")} onClick={share} />
                        </>
                    ) : null
                }
                right={
                    <>
                        {hasBack ? <SheetFab color="primary" Icon={ArrowBackIcon} onClick={onBack} /> : <div> </div>}
                        <SheetFab color="primary" Icon={CloseIcon} onClick={onClose} />
                    </>
                }
            />
            <Box sx={{ mx: 2 }}>
                <SheetInfoRow>
                    {stop ? (
                        <StopNameBadge
                            stopTypes={stop[EStopTuple.vehicleTypes]}
                            text={stop[EStopTuple.stopName]}
                            onClick={() => onLocate(stop)}
                            angledDivider
                            sx={{ maxWidth: "60vw", minWidth: 0, width: "fit-content" }}
                        />
                    ) : (
                        <span />
                    )}
                    {stop && (
                        <PopupInfo
                            element={
                                <Typography variant="body2" style={{ cursor: "pointer" }}>
                                    ID: {shortId}
                                </Typography>
                            }
                            popupContent={
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                    <CopyRow label="ID" value={stopId} onCopy={copy} />
                                    <CopyRow label={t("global.name")} value={stop[EStopTuple.stopName]} onCopy={copy} />
                                    {location && <CopyRow label={t("global.coordinates")} value={`${location[1]}, ${location[0]}`} onCopy={copy} />}
                                </Box>
                            }
                        />
                    )}
                </SheetInfoRow>
            </Box>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} indicatorColor="primary" textColor="primary" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ mb: 1 }}>
                {tabs.map((name) => (
                    <Tab key={name} value={name} label={t(`stopDetails.${name}`)} />
                ))}
            </Tabs>
        </>
    );

    return (
        <>
            <MapSheet open header={header} onHeightChange={onHeightChange}>
                <Box sx={{ mx: 1 }}>
                    {tab === "departures" && <SheetDepartures city={stopCity} stopId={stopId} onActive={onDepartureActive} />}
                    {tab === "frequency" && <SheetDepartures city={stopCity} stopId={stopId} onActive={onDepartureActive} />}
                    {tab === "schedule" && stop && <SheetSchedule city={city} stop={stop} />}
                </Box>
            </MapSheet>
            {toast.element}
        </>
    );
};
