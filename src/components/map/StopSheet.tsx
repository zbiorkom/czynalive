import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShareIcon from "@mui/icons-material/Share";
import { Box, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cityGet } from "@/api/client";
import { ERouteTuple, EStopTuple, type RouteTuple, type StopDepartureTuple, type StopTupleDetailed } from "@/api/types";
import { useApi } from "@/api/useApi";
import { LiveDepartures } from "@/components/departures/LiveDepartures";
import { RouteChip } from "@/components/departures/RouteChip";
import { useFavourites } from "@/store/favourites";
import { BottomSheet } from "./BottomSheet";
import { shareLink } from "./share";
import { SheetIconButton, SheetToolbar, useToast } from "./SheetParts";

type Directions = { stop: StopTupleDetailed; directions: [route: RouteTuple, direction: number, headsign: string, terminus: boolean][] };

type Props = {
    city: string;
    stopCity: string;
    stopId: string;
    hasBack: boolean;
    onClose: () => void;
    onBack: () => void;
    onLocate: (stop: StopTupleDetailed) => void;
    onDepartureSelect: (departure: StopDepartureTuple) => void;
    onHeightChange: (px: number, side: boolean) => void;
};

// `?przystanek=` sheet: live departures and the lines of a stop.
export const StopSheet = ({ city, stopCity, stopId, hasBack, onClose, onBack, onLocate, onDepartureSelect, onHeightChange }: Props) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const toast = useToast();
    const [tab, setTab] = useState<"departures" | "lines">("departures");
    const { has, toggle } = useFavourites(city);
    const { data, error } = useApi((signal) => cityGet<Directions>(stopCity, `/stops/${encodeURIComponent(stopId)}/directions`, undefined, signal), [stopCity, stopId]);
    const stop = data?.stop;
    const favourite = has("stops", stopId);

    useEffect(() => setTab("departures"), [stopId]);
    useEffect(() => {
        if (stop) onLocate(stop);
    }, [stop?.[EStopTuple.stopId]]);

    const routes = stop?.[EStopTuple.routes] ?? [];
    const timetableUrl = `/${stopCity}/rozklad-jazdy/przystanek/${encodeURIComponent(stopId)}`;

    const share = async () => {
        const url = `${window.location.origin}/${city}?przystanek=${encodeURIComponent(stopId)}${stopCity !== city ? `&miasto=${stopCity}` : ""}`;
        const result = await shareLink(t("global.stop"), t("stopDetails.shareDescription", { name: stop?.[EStopTuple.stopName] ?? "" }), url);
        if (result === "copied") toast.show(t("global.copied"));
    };

    const header = (
        <Box>
            <SheetToolbar
                left={
                    <>
                        <SheetIconButton
                            title={t(favourite ? "favourites.removeFromFavourites" : "favourites.addToFavourites")}
                            active={favourite}
                            onClick={() =>
                                stop &&
                                toggle("stops", { id: stopId, name: stop[EStopTuple.stopName], code: stop[EStopTuple.stopCode] || undefined })
                            }
                        >
                            {favourite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </SheetIconButton>
                        <SheetIconButton title={t("global.share")} onClick={share}>
                            <ShareIcon fontSize="small" />
                        </SheetIconButton>
                        <SheetIconButton title={t("timetables.timetable")} onClick={() => navigate(timetableUrl)}>
                            <CalendarMonthIcon fontSize="small" />
                        </SheetIconButton>
                    </>
                }
                right={
                    <>
                        {hasBack && (
                            <SheetIconButton title="Wstecz" onClick={onBack}>
                                <ArrowBackIcon fontSize="small" />
                            </SheetIconButton>
                        )}
                        <SheetIconButton title={t("global.close")} onClick={onClose}>
                            <CloseIcon fontSize="small" />
                        </SheetIconButton>
                    </>
                }
            />
            <Box sx={{ mx: 2, mb: 0.5 }}>
                {stop ? (
                    <>
                        <Typography variant="h6" component="h2" sx={{ fontSize: "1.15rem !important", fontWeight: 700, lineHeight: 1.3 }} noWrap>
                            {stop[EStopTuple.stopName]}
                            {stop[EStopTuple.stopCode] && (
                                <Typography component="span" sx={{ ml: 0.75, fontWeight: 400, opacity: 0.75 }}>
                                    {stop[EStopTuple.stopCode]}
                                </Typography>
                            )}
                        </Typography>
                        {stop[EStopTuple.direction] && (
                            <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
                                → {stop[EStopTuple.direction]}
                            </Typography>
                        )}
                    </>
                ) : error ? (
                    <Typography>{t("stopDetails.stopNotFound")}</Typography>
                ) : (
                    <Skeleton variant="text" width={200} height={32} />
                )}
            </Box>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}>
                <Tab value="departures" label={t("stopDetails.departures")} />
                <Tab value="lines" label={`${t("global.lines")}${routes.length ? ` (${routes.length})` : ""}`} />
            </Tabs>
        </Box>
    );

    return (
        <>
            <BottomSheet open header={header} onHeightChange={onHeightChange}>
                <Box sx={{ mx: 1, mt: 1 }}>
                    {tab === "departures" && <LiveDepartures city={stopCity} stopId={stopId} limit={20} compact onSelect={onDepartureSelect} />}
                    {tab === "lines" &&
                        (data?.directions.length ? (
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                {data.directions.map(([route, direction, headsign, terminus]) => (
                                    <Box
                                        key={`${route[ERouteTuple.routeId]}-${direction}`}
                                        onClick={() =>
                                            navigate(`/${stopCity}/rozklad-jazdy/przystanek/${encodeURIComponent(stopId)}/linia/${encodeURIComponent(route[ERouteTuple.routeId])}`)
                                        }
                                        sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, px: 1, cursor: "pointer", borderRadius: 1, "&:hover": { bgcolor: "action.hover" } }}
                                    >
                                        <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} />
                                        <Typography variant="body2" noWrap sx={{ opacity: terminus ? 0.6 : 1 }}>
                                            → {headsign}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        ) : data ? (
                            <Typography sx={{ m: 2 }}>{t("stopDetails.noLinesOnStop")}</Typography>
                        ) : (
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
                        ))}
                </Box>
            </BottomSheet>
            {toast.element}
        </>
    );
};
