import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ALIGHT, EStopTuple, StopDepartureStatus, type ItineraryTuple, type TripStopTime } from "@/api/types";
import { delayCssColor, delayToMinutes } from "@/components/map/markers";
import { formatTime } from "@/lib/transit";

type Props = {
    itinerary: ItineraryTuple;
    stopTimes?: TripStopTime[];
    scheduled?: [arrival: number, departure: number][];
    sequence?: number;
    color: string;
    timeZone?: string;
    activeStopId?: string | null;
    onStopClick?: (stopId: string, index: number) => void;
};

const LINE_WIDTH = 4;
const DOT = 14;

// Vertical line diagram of a trip with live times (czynaczas "Trasa" tab).
export const TripStops = ({ itinerary, stopTimes, scheduled, sequence, color, timeZone, activeStopId, onStopClick }: Props) => {
    const { t } = useTranslation();
    const listRef = useRef<HTMLDivElement>(null);
    const stops = itinerary[0];
    const current = sequence ?? -1;
    const now = Date.now();

    useEffect(() => {
        const target = listRef.current?.querySelector<HTMLElement>(
            activeStopId ? `[data-stop-id="${CSS.escape(activeStopId)}"]` : `[data-index="${Math.max(0, current - 1)}"]`,
        );
        let scroller = listRef.current?.parentElement ?? null;
        while (scroller && !(scroller.scrollHeight > scroller.clientHeight && getComputedStyle(scroller).overflowY === "auto")) {
            scroller = scroller.parentElement;
        }
        if (!target || !scroller) return;
        const offset = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        scroller.scrollTo({ top: Math.max(0, offset - 8), behavior: "smooth" });
    }, [current, activeStopId, stops.length]);

    return (
        <Box ref={listRef} sx={{ pb: 2 }}>
            {stops.map((itineraryStop, index) => {
                const [stop, alight, , platform] = itineraryStop;
                const live = stopTimes?.[index];
                const isFirst = index === 0;
                const isLast = index === stops.length - 1;
                const point = live ? (isLast ? live[0] : live[1]) : undefined;
                const scheduledTime = point?.[0] ?? (scheduled ? (isLast ? scheduled[index][0] : scheduled[index][1]) : undefined);
                const status = point?.[2] ?? StopDepartureStatus.Scheduled;
                const delay = point?.[1] ?? 0;
                const hasLive = status === StopDepartureStatus.OnTrip || status === StopDepartureStatus.OnPreviousTrip;
                const cancelled = status === StopDepartureStatus.Cancelled;
                const passed = current >= 0 && index < current;
                const isCurrent = index === current;
                const expected = scheduledTime !== undefined ? scheduledTime + (hasLive ? delay : 0) : undefined;
                const minutes = hasLive ? delayToMinutes(delay) : undefined;
                const onDemand = (alight & ALIGHT.OnDemand) !== 0;
                const active = activeStopId === stop[EStopTuple.stopId];
                const lineColor = passed ? "var(--neutral-light)" : color;
                return (
                    <Box
                        key={`${stop[EStopTuple.stopId]}-${index}`}
                        data-index={index}
                        data-stop-id={stop[EStopTuple.stopId]}
                        onClick={() => onStopClick?.(stop[EStopTuple.stopId], index)}
                        sx={{
                            display: "flex",
                            alignItems: "stretch",
                            minHeight: 46,
                            cursor: onStopClick ? "pointer" : undefined,
                            opacity: passed ? 0.55 : 1,
                            bgcolor: active ? "action.selected" : undefined,
                            borderRadius: 1,
                            "&:hover": onStopClick ? { bgcolor: "action.hover" } : undefined,
                        }}
                    >
                        <Box sx={{ width: 32, position: "relative", flexShrink: 0 }}>
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: LINE_WIDTH,
                                    top: isFirst ? "50%" : 0,
                                    bottom: isLast ? "50%" : 0,
                                    background: current === index + 1 || isCurrent ? `linear-gradient(${lineColor} 50%, ${color} 50%)` : lineColor,
                                }}
                            />
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: isCurrent ? DOT + 4 : DOT,
                                    height: isCurrent ? DOT + 4 : DOT,
                                    borderRadius: "50%",
                                    bgcolor: "background.paper",
                                    border: `3px solid ${passed ? "var(--neutral-light)" : color}`,
                                    boxShadow: isCurrent ? `0 0 0 3px color-mix(in srgb, ${color} 35%, transparent)` : undefined,
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5, pl: 0.5 }}>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: isCurrent || isFirst || isLast ? 700 : 400, textDecoration: cancelled ? "line-through" : undefined }}
                                noWrap
                            >
                                {stop[EStopTuple.stopName]}
                                {stop[EStopTuple.stopCode] && (
                                    <Typography component="span" variant="caption" sx={{ ml: 0.5, opacity: 0.7 }}>
                                        {stop[EStopTuple.stopCode]}
                                    </Typography>
                                )}
                            </Typography>
                            {(onDemand || platform || cancelled) && (
                                <Typography variant="caption" sx={{ opacity: 0.75 }} noWrap>
                                    {[cancelled ? t("stopDetails.tripCancelled") : "", onDemand ? t("global.onDemand") : "", platform ? `peron ${platform}` : ""]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ textAlign: "right", pr: 1, display: "flex", flexDirection: "column", justifyContent: "center", flexShrink: 0 }}>
                            {expected !== undefined && (
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, color: hasLive && !passed ? delayCssColor(minutes) : undefined }}
                                    title={hasLive ? `${minutes! > 0 ? "+" : ""}${minutes} min` : undefined}
                                >
                                    {!passed && hasLive && expected > now && expected - now < 60 * 60000 && index >= current
                                        ? `${Math.max(0, Math.floor((expected - now) / 60000))} min`
                                        : formatTime(expected, timeZone)}
                                </Typography>
                            )}
                            {hasLive && scheduledTime !== undefined && minutes !== 0 && (
                                <Typography variant="caption" sx={{ textDecoration: "line-through", opacity: 0.6, lineHeight: 1.1 }}>
                                    {formatTime(scheduledTime, timeZone)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
};
