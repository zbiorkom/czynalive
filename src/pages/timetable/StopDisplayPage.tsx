import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import GpsOffIcon from "@mui/icons-material/GpsOff";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box, Chip, Divider, List, ListItem, Typography, useTheme } from "@mui/material";
import { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { ALIGHT, EDeparture, ERouteTuple, EStopDepartureTuple, EStopTuple, ETripTuple, StopDepartureStatus } from "@/api/types";
import { delayClassName, delayMinutes, hhmm, isLiveStatus } from "@/components/departures/departureUtils";
import { useStopDepartures } from "@/components/departures/useStopDepartures";
import { DISPLAY_FONT, DisplayFooter, DisplayHeader, DisplayMessage, SIZE, useClock, useDisplayScheme } from "@/components/timetable/DisplayChrome";

export default function StopDisplayPage() {
    const { city = "" } = useParams();
    const [params] = useSearchParams();
    const stopId = params.get("przystanek") ?? "";
    const dataCity = params.get("miasto") || city;
    const { t } = useTranslation();
    const theme = useTheme();
    const scheme = useDisplayScheme(city);
    const timeZone = useCity(city)?.timezone;
    const now = useClock();
    const { stop, departures, error } = useStopDepartures(dataCity, stopId, { limit: 20, enabled: !!stopId });
    const stopName = stop ? `${stop[EStopTuple.stopName]}${stop[EStopTuple.stopCode] ? ` ${stop[EStopTuple.stopCode]}` : ""}` : "";

    useEffect(() => {
        document.title = stopName ? `${stopName} - Tablica odjazdów - Czynalive` : "Tablica odjazdów - Czynalive";
    }, [stopName]);

    if (!stopId) return <DisplayMessage lines={["Brak ID przystanku w parametrach URL", "Dodaj parametr ?przystanek=ID_PRZYSTANKU do adresu URL"]} />;
    if (error === "STOP_NOT_FOUND") return <DisplayMessage severity="info" lines={["Przystanek nie znaleziony", `Przystanek o ID ${stopId} nie został znaleziony`]} />;
    if (!stop && !departures && !error) return <DisplayMessage loading lines={["Łączenie z serwerem...", "Oczekiwanie na dane przystanku"]} />;
    if (!departures && !error) return <DisplayMessage loading lines={["Ładowanie rozkładu jazdy...", "Pobieranie informacji o odjazdach"]} />;

    const header = (
        <DisplayHeader scheme={scheme} now={now} timeZone={timeZone} withTime={!!departures}>
            <Box sx={{ maxWidth: "100%", overflow: "hidden", flex: 1, color: scheme.headerText }}>
                <Typography noWrap sx={{ fontSize: `${SIZE.displayLg} !important`, fontFamily: DISPLAY_FONT, fontWeight: 900, color: `${scheme.headerText} !important`, lineHeight: 1.1 }}>
                    {stopName}
                </Typography>
            </Box>
        </DisplayHeader>
    );

    if (!departures) {
        return (
            <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "background.default", overflow: "hidden" }}>
                {header}
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
                    <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: `${SIZE.h1} !important` }}>Nie udało się pobrać danych o rozkładzie jazdy</Typography>
                </Box>
                <DisplayFooter />
            </Box>
        );
    }

    const nowMs = now.getTime();
    const upcoming = departures
        .map((departure) => {
            const info = departure[EStopDepartureTuple.departure];
            const live = isLiveStatus(info[EDeparture.status]);
            const expected = info[EDeparture.scheduledDeparture] + (live ? info[EDeparture.delay] : 0);
            return { departure, info, live, expected, minutes: Math.round((expected - nowMs) / 60000) };
        })
        .filter((entry) => entry.minutes >= 0 && !entry.info[EDeparture.departed])
        .sort((a, b) => a.expected - b.expected)
        .slice(0, 15);

    return (
        <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "background.default", overflow: "hidden" }}>
            {header}
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", pl: { xs: 1, md: 2 }, pr: 1 }}>
                <List sx={{ p: 1 }}>
                    {upcoming.map(({ departure, info, live, expected, minutes }, index) => {
                        const trip = departure[EStopDepartureTuple.trip];
                        const route = trip[ETripTuple.route];
                        const delayed = live && Math.abs(delayMinutes(info[EDeparture.delay])) >= 1;
                        const chipClass = delayed ? `bg-${delayClassName(delayMinutes(info[EDeparture.delay]))} text-white` : "";
                        const hasGps = !!departure[EStopDepartureTuple.vehicle];
                        const onDemand = (info[EDeparture.alight] & ALIGHT.OnDemand) !== 0;
                        const cancelled = info[EDeparture.status] === StopDepartureStatus.Cancelled;
                        return (
                            <Fragment key={`${trip[ETripTuple.tripId]}-${info[EDeparture.scheduledDeparture]}`}>
                                <ListItem disablePadding sx={{ position: "relative", borderRadius: 2, backgroundColor: "background.paper", pl: { xs: 1.5, md: 3 }, pr: { xs: 1, md: 2 }, py: 1 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, width: "100%" }}>
                                        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, minWidth: 0 }}>
                                            <Box
                                                sx={{
                                                    backgroundColor: scheme.headerBackground,
                                                    color: scheme.headerText,
                                                    p: { xs: "6px 10px", md: "8px 16px" },
                                                    borderRadius: "6px",
                                                    minWidth: { xs: 56, md: 60 },
                                                    textAlign: "center",
                                                    border: `2px solid ${scheme.headerBackground}`,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Typography sx={{ fontWeight: 900, fontSize: `${SIZE.displayMd} !important`, fontFamily: DISPLAY_FONT, lineHeight: 1, color: `${scheme.headerText} !important` }}>
                                                    {route[ERouteTuple.routeName]}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: `${SIZE.displayMd} !important`,
                                                    color: `${scheme.text} !important`,
                                                    lineHeight: 1.2,
                                                    flex: 1,
                                                    wordBreak: "break-word",
                                                    fontFamily: DISPLAY_FONT,
                                                    textDecoration: cancelled ? "line-through" : undefined,
                                                }}
                                            >
                                                {onDemand && <TouchAppIcon sx={{ fontSize: SIZE.h3, mr: 1, verticalAlign: "middle", color: "inherit" }} />}
                                                {trip[ETripTuple.headsign]}
                                                {onDemand && ` - ${t("global.onDemand")}`}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
                                            <Typography sx={{ lineHeight: 1, fontSize: `${SIZE.displayMd} !important`, fontWeight: 700, color: `${scheme.text} !important`, fontFamily: DISPLAY_FONT, whiteSpace: "nowrap" }}>
                                                {minutes === 0 ? "Teraz" : `${minutes} min`}
                                            </Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Chip
                                                    size="medium"
                                                    label={hhmm(expected, timeZone)}
                                                    className={chipClass}
                                                    sx={{ fontSize: `${SIZE.h3} !important`, height: { xs: 36, md: 50 }, fontWeight: 900, fontFamily: DISPLAY_FONT, "& span": delayed ? { color: "#fff !important" } : {} }}
                                                />
                                                {hasGps ? (
                                                    <GpsFixedIcon className="text-success" sx={{ fontSize: SIZE.h2, opacity: 0.8 }} />
                                                ) : live ? (
                                                    <ScheduleIcon className="text-success" sx={{ fontSize: SIZE.h2, opacity: 0.6 }} />
                                                ) : (
                                                    <GpsOffIcon sx={{ fontSize: SIZE.h2, color: "text.disabled", opacity: 0.4 }} />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </ListItem>
                                {index < upcoming.length - 1 && (
                                    <Divider sx={{ my: 1, mx: 2, borderColor: theme.palette.mode === "dark" ? "grey.400" : "grey.600", borderWidth: "2px", opacity: 1 }} />
                                )}
                            </Fragment>
                        );
                    })}
                    {upcoming.length === 0 && (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                            <Typography color="textSecondary" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: `${SIZE.h1} !important` }}>
                                Brak nadchodzących odjazdów
                            </Typography>
                        </Box>
                    )}
                </List>
            </Box>
            <DisplayFooter />
        </Box>
    );
}
