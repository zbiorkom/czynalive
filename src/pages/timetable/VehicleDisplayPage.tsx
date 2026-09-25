import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box, Chip, Divider, List, ListItem, Typography, useTheme } from "@mui/material";
import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { apiUrl, cityGet } from "@/api/client";
import {
    ALIGHT,
    EItineraryStop,
    ERouteTuple,
    EStopTuple,
    ETripTuple,
    EVehiclePosition,
    type ItineraryTuple,
    type TripStopTime,
    type TripTuple,
    type VehiclePosition,
    type VehiclePositionDetailed,
} from "@/api/types";
import { delayClassName, delayMinutes, hhmm, isLiveStatus } from "@/components/departures/departureUtils";
import { DISPLAY_FONT, DisplayFooter, DisplayHeader, DisplayMessage, SIZE, useClock, useDisplayScheme } from "@/components/timetable/DisplayChrome";

type Initial = { trip: TripTuple; itinerary?: ItineraryTuple };
type Message = { position: VehiclePositionDetailed | VehiclePosition; stops?: TripStopTime[]; sequence?: number };
type LookupResponse = [position: VehiclePosition | null, headsign: string, model: string];

export default function VehicleDisplayPage() {
    const { city = "" } = useParams();
    const [params] = useSearchParams();
    const rawId = params.get("pojazd") ?? "";
    const dataCity = params.get("miasto") || city;
    const { t } = useTranslation();
    const theme = useTheme();
    const scheme = useDisplayScheme(city);
    const timeZone = useCity(city)?.timezone;
    const now = useClock();
    const [vehicleId, setVehicleId] = useState<string | null | undefined>(rawId.includes(":") ? rawId : undefined);
    const [initial, setInitial] = useState<Initial>();
    const [message, setMessage] = useState<Message>();
    const [status, setStatus] = useState<"connecting" | "open" | "lost" | "notFound">("connecting");
    const listRef = useRef<HTMLDivElement>(null);
    const currentRef = useRef<HTMLLIElement | null>(null);

    useEffect(() => {
        if (!rawId || rawId.includes(":")) {
            setVehicleId(rawId || null);
            return;
        }
        const controller = new AbortController();
        cityGet<LookupResponse>(dataCity, `/positions/vehicle/${encodeURIComponent(rawId)}`, undefined, controller.signal)
            .then((response) => setVehicleId(response[0]?.[EVehiclePosition.id] ?? null))
            .catch(() => !controller.signal.aborted && setVehicleId(null));
        return () => controller.abort();
    }, [dataCity, rawId]);

    useEffect(() => {
        if (!vehicleId) return;
        setStatus("connecting");
        const source = new EventSource(apiUrl(`/${dataCity}/positions/${encodeURIComponent(vehicleId)}/stream`));
        source.addEventListener("initial", (event) => {
            try {
                setInitial(JSON.parse((event as MessageEvent).data));
            } catch {}
        });
        source.addEventListener("message", (event) => {
            try {
                setMessage(JSON.parse((event as MessageEvent).data));
                setStatus("open");
            } catch {}
        });
        source.addEventListener("errorCode", () => {
            source.close();
            setStatus("notFound");
        });
        source.onerror = () => setStatus((prev) => (prev === "open" ? "lost" : prev));
        return () => source.close();
    }, [dataCity, vehicleId]);

    const sequence = message?.sequence ?? null;
    useEffect(() => {
        const scroller = listRef.current;
        const element = currentRef.current;
        if (!scroller || !element) return;
        const top = element.offsetTop - scroller.clientHeight / 2 + element.offsetHeight / 2;
        scroller.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    }, [sequence, initial]);

    const trip = initial?.trip;
    const position = message?.position;
    const route = trip?.[ETripTuple.route] ?? position?.[EVehiclePosition.route];
    const routeName = route?.[ERouteTuple.routeName] ?? "";
    const headsign = trip?.[ETripTuple.headsign] ?? "";

    useEffect(() => {
        document.title = routeName ? `${routeName} ${headsign} - Tablica pojazdu - Czynalive` : "Tablica pojazdu - Czynalive";
    }, [routeName, headsign]);

    if (!rawId) return <DisplayMessage lines={["Brak ID pojazdu w parametrach URL", "Dodaj parametr ?pojazd=ID_POJAZDU do adresu URL"]} />;
    if (vehicleId === null || status === "notFound") return <DisplayMessage severity="info" lines={["Pojazd nie znaleziony", `Pojazd o ID ${rawId} nie został znaleziony`]} />;
    if (!message) return <DisplayMessage loading lines={[status === "lost" ? "Ponowne łączenie..." : "Łączenie z serwerem...", "Oczekiwanie na dane pojazdów"]} />;

    const header = (
        <DisplayHeader scheme={scheme} now={now} timeZone={timeZone}>
            <Box
                sx={{
                    backgroundColor: scheme.headerText,
                    p: { xs: "8px 12px", md: "12px 20px" },
                    borderRadius: "8px",
                    minWidth: { xs: 70, md: 100 },
                    textAlign: "center",
                    border: `3px solid ${scheme.headerBackground}`,
                    flexShrink: 0,
                }}
            >
                <Typography component="h1" sx={{ color: `${scheme.headerBackground} !important`, fontWeight: 900, fontSize: `${SIZE.displayLg} !important`, fontFamily: DISPLAY_FONT, lineHeight: 1 }}>
                    {routeName}
                </Typography>
            </Box>
            {headsign && (
                <Box sx={{ maxWidth: "80%", overflow: "hidden", flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: `${SIZE.displayLg} !important`, fontFamily: DISPLAY_FONT, fontWeight: 900, color: `${scheme.headerText} !important`, textAlign: "left" }}>
                        {headsign}
                    </Typography>
                </Box>
            )}
        </DisplayHeader>
    );

    const stops = initial?.itinerary?.[0] ?? [];
    const times = message.stops ?? [];
    if (!stops.length || !trip) {
        return (
            <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "background.default", overflow: "hidden" }}>
                {header}
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, p: 3 }}>
                    <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: `${SIZE.h1} !important`, textAlign: "center" }}>Nie udało się pobrać danych o trasie pojazdu</Typography>
                </Box>
                <DisplayFooter />
            </Box>
        );
    }

    return (
        <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "background.default", overflow: "hidden" }}>
            {header}
            <Box ref={listRef} sx={{ flex: 1, minHeight: 0, overflow: "auto", pl: { xs: 1, md: 2 }, pr: 1, position: "relative" }}>
                <List sx={{ p: 1 }}>
                    {stops.map((itineraryStop, index) => {
                        const stop = itineraryStop[EItineraryStop.stop];
                        const time = times[index]?.[1] ?? times[index]?.[0];
                        const current = sequence === index;
                        const past = sequence !== null && index < sequence;
                        const onDemand = (itineraryStop[EItineraryStop.alight] & ALIGHT.OnDemand) !== 0;
                        const live = !!time && isLiveStatus(time[2]);
                        const delayMin = live && time ? delayMinutes(time[1]) : undefined;
                        const delayed = delayMin !== undefined && Math.abs(delayMin) >= 1;
                        const chipClass = delayed ? `bg-${delayClassName(delayMin)} text-white` : "";
                        const name = stop[EStopTuple.stopName];
                        return (
                            <Fragment key={`${stop[EStopTuple.stopId]}-${index}`}>
                                <ListItem
                                    ref={current ? currentRef : null}
                                    disablePadding
                                    sx={{
                                        position: "relative",
                                        my: 2,
                                        borderRadius: 2,
                                        backgroundColor: current ? scheme.secondaryBackground : "background.paper",
                                        pl: { xs: 1.5, md: 3 },
                                        pr: { xs: 1, md: 2 },
                                        py: { xs: 2, md: 4 },
                                        transition: "all 0.3s ease",
                                        opacity: past ? 0.6 : 1,
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                    }}
                                >
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: current ? 900 : 800,
                                                fontSize: `${SIZE.displayLg} !important`,
                                                color: `${current ? scheme.secondaryText : scheme.text} !important`,
                                                lineHeight: 1.2,
                                                flex: 1,
                                                overflowWrap: "break-word",
                                                hyphens: "auto",
                                                fontFamily: DISPLAY_FONT,
                                            }}
                                        >
                                            {onDemand && <TouchAppIcon sx={{ fontSize: SIZE.displaySm, mr: 1, verticalAlign: "middle", color: "inherit" }} />}
                                            {name}
                                            {onDemand && ` - ${t("global.onDemand")}`}
                                        </Typography>
                                        {!past && time && (
                                            <Chip
                                                size="medium"
                                                label={hhmm(time[0] + (delayed ? time[1] : 0), timeZone)}
                                                className={chipClass}
                                                sx={{
                                                    backgroundColor: delayed ? undefined : "transparent",
                                                    fontSize: `${SIZE.displayMd} !important`,
                                                    height: { xs: 56, md: 100 },
                                                    fontWeight: 900,
                                                    fontFamily: DISPLAY_FONT,
                                                    flexShrink: 0,
                                                    "& span": { color: delayed ? "#fff !important" : current ? `${scheme.secondaryText} !important` : undefined },
                                                }}
                                            />
                                        )}
                                    </Box>
                                    {current && (
                                        <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: scheme.secondaryText, mr: 1 }} />
                                            <Typography
                                                sx={{
                                                    fontWeight: 900,
                                                    fontSize: `${SIZE.h3} !important`,
                                                    color: `${scheme.secondaryText} !important`,
                                                    textTransform: "uppercase",
                                                    letterSpacing: 1,
                                                    fontFamily: DISPLAY_FONT,
                                                }}
                                            >
                                                Następny przystanek
                                            </Typography>
                                        </Box>
                                    )}
                                </ListItem>
                                {index < stops.length - 1 && (
                                    <Divider sx={{ my: 2, mx: 2, borderColor: theme.palette.mode === "dark" ? "grey.400" : "grey.600", borderWidth: "2px", opacity: 1 }} />
                                )}
                            </Fragment>
                        );
                    })}
                </List>
            </Box>
            <DisplayFooter />
        </Box>
    );
}
