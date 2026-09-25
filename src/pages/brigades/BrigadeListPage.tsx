import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import {
    Alert,
    LinearProgress,
    Box,
    Button,
    Divider,
    FormControlLabel,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { ERouteTuple } from "@/api/types";
import { useApi } from "@/api/useApi";
import { ErrorBox, Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { RouteBadge } from "@/components/RouteBadge";
import { brigadeKey, fetchCityBrigades, fetchLiveBrigades, type CityBrigade, type CityBrigades, type LiveBrigadeRow } from "@/components/brigades/data";
import { DATE_PARAM, DateTabs, useBrigadeDate } from "@/components/brigades/DateTabs";
import { filterBrigades, type BrigadeSearchType } from "@/components/brigades/search";
import { ShareLink } from "@/components/brigades/ShareButton";
import { VehicleTypeIcon } from "@/components/brigades/VehicleTypeIcon";
import { formatTime, parseVehicleId } from "@/lib/transit";
import { useSettings } from "@/store/settings";

const PAGE_SIZE = 150;

const SEARCH_FORMATS: Record<BrigadeSearchType, { format: string; caption: string; placeholder: string }> = {
    "ROUTE_ID/BRIGADE": {
        format: "brigadeScheduleList.searchFormatLineBrigade",
        caption: "brigadeScheduleList.searchCaptionLineBrigade",
        placeholder: "brigadeScheduleList.searchLineBrigade",
    },
    "BRIGADE/ROUTE_ID": {
        format: "brigadeScheduleList.searchFormatBrigadeLine",
        caption: "brigadeScheduleList.searchCaptionBrigadeLine",
        placeholder: "brigadeScheduleList.searchBrigadeLine",
    },
};

export const brigadeUrl = (city: string, routeId: string, brigade: string, multi: boolean, date?: number) =>
    `/${city}/${multi ? "laczony-rozklad-jazdy-brygady" : "rozklad-jazdy-brygady"}/linia/${encodeURIComponent(routeId)}/brygada/${encodeURIComponent(brigade)}` +
    (date ? `?${DATE_PARAM}=${date}` : "");

const BrigadeLabel = ({ item, type }: { item: CityBrigade; type: BrigadeSearchType }) => {
    const { t } = useTranslation();
    const line = item.route[ERouteTuple.routeName];
    return type === "ROUTE_ID/BRIGADE" ? (
        <>
            {t("global.route_id")} <strong>{line}</strong>, {t("global.brigade")} <strong>{item.brigade}</strong>{" "}
            <small>
                ({line}/{item.brigade})
            </small>
        </>
    ) : (
        <>
            {t("global.brigade")} <strong>{item.brigade}</strong>, {t("global.route_id")} <strong>{line}</strong>{" "}
            <small>
                ({item.brigade}/{line})
            </small>
        </>
    );
};

export default function BrigadeListPage({ multi = false }: { multi?: boolean }) {
    const { city = "" } = useParams();
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const [settings, setSettings] = useSettings();
    const searchType = settings.brigadeSearchType ?? "ROUTE_ID/BRIGADE";
    const [query, setQuery] = useState("");
    const [formatOpen, setFormatOpen] = useState(false);
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const [limit, setLimit] = useState(PAGE_SIZE);
    const { dates, selected, setDate, isToday, loading: datesLoading, timeZone } = useBrigadeDate(city);

    const [progress, setProgress] = useState<[number, number] | null>(null);
    const [partial, setPartial] = useState<CityBrigades | null>(null);
    const loaded = useApi(
        (signal) => {
            setPartial(null);
            setProgress(null);
            return fetchCityBrigades(city, selected, signal, (data, done, total) => {
                setPartial(data);
                setProgress([done, total]);
            });
        },
        [city, selected],
    );
    const brigades = { ...loaded, data: loaded.data ?? partial ?? undefined };
    const stillLoading = loaded.loading && !loaded.data;
    const live = useApi(isToday ? (signal) => fetchLiveBrigades(city, signal) : null, [city, isToday], 30000);

    const liveByBrigade = useMemo(() => {
        const map = new Map<string, LiveBrigadeRow[]>();
        for (const row of live.data ?? []) {
            const key = brigadeKey(row[1], row[2]);
            map.set(key, [...(map.get(key) ?? []), row]);
        }
        return map;
    }, [live.data]);

    const source = useMemo(() => {
        const all = brigades.data?.brigades ?? [];
        return multi ? all.filter((item) => item.lines.length > 1) : all;
    }, [brigades.data, multi]);
    const results = useMemo(() => filterBrigades(source, query, searchType), [source, query, searchType]);

    const title = t(multi ? "brigadeScheduleList.brigadeScheduleMulti" : "brigadeScheduleList.brigadeSchedule");
    const cityName = cityInfo?.name ?? city;
    const format = SEARCH_FORMATS[searchType];

    return (
        <>
            <PageHeader title={title} back="/ustawienia" documentTitle={`${title} - ${cityName}`} />
            <div className="page">
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 0.5,
                                ...(descriptionOpen ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }),
                            }}
                        >
                            {t(multi ? "brigadeScheduleList.descriptionMulti" : "brigadeScheduleList.description")} {cityName}.
                        </Typography>
                        {descriptionOpen && <ShareLink title={`${title} - ${cityName}`} />}
                    </Box>
                    <IconButton size="small" onClick={() => setDescriptionOpen((open) => !open)} aria-label={t(descriptionOpen ? "global.collapse" : "global.expand")}>
                        {descriptionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                {datesLoading && !dates.length ? null : <DateTabs dates={dates} selected={selected} onChange={(date) => (setDate(date), setLimit(PAGE_SIZE))} />}
                {!datesLoading && dates.length > 0 && !dates.includes(selected) && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                        {t("brigadeScheduleList.noBrigadeScheduleForDay")}
                    </Alert>
                )}

                {brigades.loading && !brigades.data ? (
                    <Loading />
                ) : brigades.error ? (
                    <ErrorBox error={brigades.error} onRetry={brigades.reload} />
                ) : !source.length && !stillLoading ? (
                    <Box sx={{ my: 2 }}>
                        <Typography variant="subtitle2">{t("global.nothingFound")}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {multi && brigades.data && !brigades.data.linesKnown && brigades.data.brigades.length
                                ? "Brak danych o brygadach łączonych dla tego miasta."
                                : t("brigadeScheduleList.noBrigadeScheduleForDay")}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <form autoComplete="off" noValidate onSubmit={(event) => event.preventDefault()}>
                            <TextField
                                label={t("brigadeScheduleList.searchLabel")}
                                placeholder={t(format.placeholder)}
                                margin="normal"
                                type="search"
                                value={query}
                                variant="outlined"
                                onChange={(event) => (setQuery(event.target.value), setLimit(PAGE_SIZE))}
                                size="small"
                                fullWidth
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                    inputLabel: { shrink: true },
                                }}
                            />
                        </form>
                        <Box onClick={() => setFormatOpen((open) => !open)} sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <Typography variant="body2">
                                {t("global.searchFormat")}: <strong>{t(format.format)}</strong>
                            </Typography>
                            {formatOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </Box>
                        {formatOpen && (
                            <Box>
                                <RadioGroup row value={searchType} onChange={(event) => setSettings({ brigadeSearchType: event.target.value as BrigadeSearchType })}>
                                    {(Object.keys(SEARCH_FORMATS) as BrigadeSearchType[]).map((key) => (
                                        <FormControlLabel
                                            key={key}
                                            value={key}
                                            control={<Radio size="small" />}
                                            label={<Typography variant="caption">{t(SEARCH_FORMATS[key].format)}</Typography>}
                                        />
                                    ))}
                                </RadioGroup>
                                <Typography variant="caption" component="div" gutterBottom>
                                    <Trans i18nKey={format.caption} components={[<strong key="0" />]} />
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 1.25 }} />
                        {stillLoading && progress && (
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {t("global.loading")}… {progress[0]}/{progress[1]}
                                </Typography>
                                <LinearProgress variant="determinate" value={(progress[0] / progress[1]) * 100} />
                            </Box>
                        )}
                        <Typography variant="h5" gutterBottom>
                            {t("brigadeScheduleList.linesBrigadesList")}:
                        </Typography>
                        <Typography variant="subtitle2" sx={{ my: 1.25 }} noWrap>
                            {results.length === 0 ? t("global.nothingFound") : `${t("global.found")} ${t("plural.result", { count: results.length })}.`}
                        </Typography>
                        <Divider />
                        <List dense disablePadding>
                            {results.slice(0, limit).map((item) => {
                                const routeId = item.route[ERouteTuple.routeId];
                                const vehicles = liveByBrigade.get(brigadeKey(routeId, item.brigade));
                                const vehicleText = vehicles?.map((row) => parseVehicleId(row[0]).number).join(", ");
                                return (
                                    <ListItemButton
                                        key={`${routeId}-${item.brigade}`}
                                        component={Link}
                                        to={brigadeUrl(city, routeId, item.brigade, multi, isToday ? undefined : selected)}
                                        divider
                                        dense
                                        sx={{ pr: 1 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 48 }}>
                                            <VehicleTypeIcon type={item.route[ERouteTuple.routeType]} size={35} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" component="span">
                                                    <BrigadeLabel item={item} type={searchType} />
                                                </Typography>
                                            }
                                            secondary={
                                                <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                                    {vehicleText && (
                                                        <Typography variant="caption" component="span" color="text.primary">
                                                            {t("global.operatedByVehicle")}: <strong>#{vehicleText}</strong>
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" component="span">
                                                        {item.start ? `${formatTime(item.start, timeZone)} – ${formatTime(item.end, timeZone)} · ` : ""}
                                                        {t("plural.trip", { count: item.tripCount })}
                                                    </Typography>
                                                    {item.lines.length > 1 && (
                                                        <Box component="span" sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center", mt: 0.25 }}>
                                                            <Typography variant="caption" component="span">
                                                                {t("brigadeSchedule.mergedWithLines")}:
                                                            </Typography>
                                                            {item.lines.map((line) => (
                                                                <RouteBadge key={line[ERouteTuple.routeId]} route={line} size="small" />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
                                        />
                                        <ChevronRightIcon color="action" />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                        {results.length > limit && (
                            <Button fullWidth sx={{ mt: 1 }} onClick={() => setLimit((value) => value + PAGE_SIZE)}>
                                {t("global.more")} ({results.length - limit})
                            </Button>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
