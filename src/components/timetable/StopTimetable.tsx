import MapIcon from "@mui/icons-material/Map";
import {
    Box,
    Button,
    Divider,
    FormControlLabel,
    Paper,
    Popover,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from "@mui/material";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ALIGHT, type RouteLegendEntry, type StopTupleDetailed } from "@/api/types";
import { vehicleTypeName } from "@/components/departures/VehicleTypeIcon";
import { dateIndexToDate, todayDateIndex } from "@/lib/transit";
import { typeReadableKey } from "./common";
import { legendText } from "./legend";

export type TimetableRow = [tripRef: string, departure: number, alight: number, notes: string];
export type StopTimetableResponse = { stop: StopTupleDetailed; timetable: Record<string, TimetableRow[]>; legend: RouteLegendEntry[] };

type Departure = { hour: number; minute: number; tripRef: string; departure: number; notes: string; exitOnly: boolean; closest?: boolean };

const isExitOnly = (alight: number) => (alight & ALIGHT.AlightOnly) !== 0 || ((alight & ALIGHT.IsLastStop) !== 0 && (alight & ALIGHT.BoardOnly) === 0);

const hourMinute = (epochMs: number, timeZone: string) => {
    const [hour, minute] = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone })
        .format(new Date(epochMs))
        .split(":")
        .map(Number);
    return { hour, minute };
};

const dayLabel = (index: number) => {
    const date = dateIndexToDate(index);
    const weekday = date.toLocaleDateString("pl-PL", { weekday: "short", timeZone: "UTC" });
    const day = date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
    return `${weekday} ${day}`;
};

const weekdayOf = (index: number) => dateIndexToDate(index).getUTCDay();

type Props = {
    city: string;
    data: StopTimetableResponse;
    routeName: string;
    routeType: number;
    stopName: string;
    cityName: string;
    timeZone?: string;
};

export const StopTimetable = ({ city, data, routeName, routeType, stopName, cityName, timeZone = "Europe/Warsaw" }: Props) => {
    const { t } = useTranslation();
    const days = useMemo(() => Object.keys(data.timetable).map(Number).sort((a, b) => a - b), [data]);
    const today = todayDateIndex(timeZone);
    const [day, setDay] = useState(() => (days.includes(today) ? today : (days.find((d) => d >= today) ?? days[0])));
    const [showExitOnly, setShowExitOnly] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [popover, setPopover] = useState<{ anchor: HTMLElement; departure: Departure } | null>(null);
    const closestRef = useRef<HTMLSpanElement | null>(null);
    const legendByLetter = useMemo(() => new Map(data.legend.map((entry) => [entry.letter, entry])), [data]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!days.includes(day) && days.length) setDay(days.includes(today) ? today : days[0]);
    }, [days]);

    const rows = data.timetable[String(day)] ?? [];
    const hasExitOnly = rows.some((row) => isExitOnly(row[2]));

    const hours = useMemo(() => {
        const grouped: { hour: number; departures: Departure[] }[] = [];
        let closestFound = false;
        for (const [tripRef, departure, alight, notes] of rows) {
            const exitOnly = isExitOnly(alight);
            if (exitOnly && !showExitOnly) continue;
            const { hour, minute } = hourMinute(departure, timeZone);
            const entry: Departure = { hour, minute, tripRef, departure, notes, exitOnly };
            if (day === today && !closestFound) {
                if (departure >= now) {
                    closestFound = true;
                    entry.closest = true;
                } else entry.closest = false;
            }
            const last = grouped[grouped.length - 1];
            if (last && last.hour === hour) last.departures.push(entry);
            else grouped.push({ hour, departures: [entry] });
        }
        return grouped;
    }, [rows, showExitOnly, day, today, now, timeZone]);

    useLayoutEffect(() => {
        closestRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, [day, data]);

    const usedLetters = useMemo(() => {
        const letters = new Set<string>();
        for (const group of hours) for (const departure of group.departures) for (const letter of departure.notes) letters.add(letter);
        return data.legend.filter((entry) => letters.has(entry.letter));
    }, [hours, data]);

    const countFor = (weekdays: number[]) => {
        const index = days.find((d) => weekdays.includes(weekdayOf(d)));
        if (index === undefined) return 0;
        return (data.timetable[String(index)] ?? []).filter((row) => !isExitOnly(row[2])).length;
    };

    const allExitOnly = rows.length > 0 && !showExitOnly && rows.every((row) => isExitOnly(row[2]));
    const typeName = vehicleTypeName(routeType);

    return (
        <Box>
            {days.length > 0 && (
                <Tabs value={days.includes(day) ? day : false} onChange={(_, value) => setDay(value)} indicatorColor="primary" textColor="primary" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                    {days.map((index) => (
                        <Tab key={index} value={index} label={dayLabel(index)} sx={{ minWidth: 80, px: 1.5 }} />
                    ))}
                </Tabs>
            )}
            <Box sx={{ my: 2 }}>
                {hasExitOnly && (
                    <FormControlLabel
                        sx={{ m: 0.5 }}
                        control={<Switch size="small" checked={showExitOnly} onChange={() => setShowExitOnly((value) => !value)} color="primary" />}
                        label={t("timetables.showExitOnly")}
                    />
                )}
                {rows.length === 0 ? (
                    <Typography variant="body1">{t("timetables.schedulesNotFound")}</Typography>
                ) : allExitOnly ? (
                    <Typography variant="body1" sx={{ my: 2 }}>
                        {t("timetables.schedulesNotFoundTurnOnExitOnly")}
                    </Typography>
                ) : (
                    <TableContainer component={Paper}>
                        <Table size="small" sx={{ background: "var(--default-bg)" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ position: "sticky", left: 0, background: "var(--default-bg)", borderRight: "1px solid var(--neutral-light)", zIndex: 1, width: 20 }}>
                                        {t("stopDetails.hour")}
                                    </TableCell>
                                    <TableCell>{t("timetables.minutes")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {hours.map((group, groupIndex) => (
                                    <TableRow key={`${group.hour}-${groupIndex}`}>
                                        <TableCell component="th" scope="row" sx={{ position: "sticky", left: 0, borderRight: "1px solid var(--neutral-light)", zIndex: 1, width: 20, fontWeight: 600 }}>
                                            {group.hour}
                                        </TableCell>
                                        <TableCell>
                                            {group.departures.map((departure) => (
                                                <span
                                                    key={`${departure.tripRef}-${departure.departure}`}
                                                    ref={departure.closest ? closestRef : null}
                                                    onClick={(event) => setPopover({ anchor: event.currentTarget, departure })}
                                                    style={{
                                                        marginRight: 5,
                                                        display: "inline-block",
                                                        cursor: "pointer",
                                                        border: departure.closest ? "2px solid var(--primary)" : "none",
                                                        padding: 5,
                                                        opacity: departure.closest === false || departure.exitOnly ? 0.5 : 1,
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <span>{String(departure.minute).padStart(2, "0")}</span>
                                                    {departure.notes && <sup style={{ fontSize: "0.75rem", marginLeft: 1, fontWeight: 700 }}>{departure.notes}</sup>}
                                                    {departure.exitOnly && <span>*</span>}
                                                </span>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
            <Popover
                open={!!popover}
                anchorEl={popover?.anchor}
                onClose={() => setPopover(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
            >
                {popover && (
                    <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", maxWidth: 300, gap: 0.25 }}>
                        <Typography variant="caption">
                            <strong>{t("stopDetails.hour")}:</strong> {popover.departure.hour}:{String(popover.departure.minute).padStart(2, "0")}
                        </Typography>
                        {[...popover.departure.notes].map((letter) => {
                            const entry = legendByLetter.get(letter);
                            return entry ? (
                                <Typography key={letter} variant="caption">
                                    <strong>{letter}</strong> - {legendText(entry)}
                                </Typography>
                            ) : null;
                        })}
                        {popover.departure.exitOnly && (
                            <>
                                <Typography variant="caption" sx={{ textTransform: "uppercase" }}>
                                    <strong>* - {t("timetables.exitOnly")}</strong>
                                </Typography>
                                <Typography variant="caption">{t("timetables.exitOnlyDescription1")}</Typography>
                                <Typography variant="caption">{t("timetables.exitOnlyDescription2")}</Typography>
                            </>
                        )}
                        <Button
                            component={Link}
                            to={`/${city}?kurs=${encodeURIComponent(popover.departure.tripRef)}`}
                            size="small"
                            variant="outlined"
                            startIcon={<MapIcon sx={{ fontSize: "0.9375rem !important" }} />}
                            className={`border-tiny-${typeName} text-${typeName}`}
                            sx={{ textTransform: "none", px: 1, py: 0, minWidth: 0, mt: 1, alignSelf: "flex-start" }}
                        >
                            {t("stopDetails.tripOnMap")}
                        </Button>
                    </Box>
                )}
            </Popover>
            <Divider sx={{ my: 2 }} />
            {(usedLetters.length > 0 || (showExitOnly && hasExitOnly)) && (
                <>
                    <Typography variant="body1">{t("timetables.legend")}:</Typography>
                    <ul style={{ marginTop: 0 }}>
                        {usedLetters.map((entry) => (
                            <li key={entry.letter}>
                                <Typography variant="caption">
                                    <strong>{entry.letter}</strong> - {legendText(entry)}
                                </Typography>
                            </li>
                        ))}
                        {showExitOnly && hasExitOnly && (
                            <li>
                                <Typography variant="caption">
                                    <strong>*</strong> - <em>{t("timetables.exitOnly")}</em>
                                </Typography>
                            </li>
                        )}
                    </ul>
                </>
            )}
            <Typography variant="body1">
                <Trans i18nKey="timetables.description1" values={{ url_stop_name: stopName, city: cityName }} components={[<strong key="1" />]} />
            </Typography>
            <Typography variant="caption">
                <Trans i18nKey="timetables.description2" values={{ type: t(typeReadableKey(routeType)), url_stop_name: stopName, route_id: routeName, city: cityName }} components={[<strong key="1" />]} />
            </Typography>
            <ul style={{ margin: 0 }}>
                <li>
                    <Typography variant="caption">
                        {countFor([1, 2, 3, 4, 5])} {t("timetables.description3")}
                    </Typography>
                </li>
                <li>
                    <Typography variant="caption">
                        {countFor([6])} {t("timetables.description4")}
                    </Typography>
                </li>
                <li>
                    <Typography variant="caption">
                        {countFor([0])} {t("timetables.description5")}
                    </Typography>
                </li>
            </ul>
        </Box>
    );
};
