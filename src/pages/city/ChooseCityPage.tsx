import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { Fragment, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCities, type City } from "@/api/cities";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { haversineMeters } from "@/lib/transit";
import { useSettings } from "@/store/settings";

const CATEGORY_NAMES: Record<string, string> = {
    lowerSilesian: "Dolnośląskie",
    kuyavianPomeranian: "Kujawsko-pomorskie",
    lodz: "Łódzkie",
    lublin: "Lubelskie",
    lubusz: "Lubuskie",
    lesserPoland: "Małopolskie",
    masovian: "Mazowieckie",
    opole: "Opolskie",
    subcarpathian: "Podkarpackie",
    podlasie: "Podlaskie",
    pomeranian: "Pomorskie",
    silesian: "Śląskie",
    holyCross: "Świętokrzyskie",
    warmianMasurian: "Warmińsko-mazurskie",
    greaterPoland: "Wielkopolskie",
    westPomeranian: "Zachodniopomorskie",
    finland: "Finlandia",
    sweden: "Szwecja",
    netherlands: "Holandia",
    ukraine: "Ukraina",
    switzerland: "Szwajcaria",
    iceland: "Islandia",
};

const FOREIGN = new Set(["finland", "sweden", "netherlands", "ukraine", "switzerland", "iceland"]);

const normalize = (text: string) =>
    text
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/ł/g, "l");

const categoryName = (category: string) => CATEGORY_NAMES[category] ?? category;

type Entry = { city: City; distanceKm: number | null };

export default function ChooseCityPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { cities, ready } = useCities();
    const [settings, setSettings] = useSettings();
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<"alpha" | "distance">("alpha");
    const [location, setLocation] = useState<[number, number] | null>(null);
    const [locating, setLocating] = useState(false);

    const entries: Entry[] = useMemo(
        () =>
            cities
                .filter((city) => !city.virtual && city.category !== "virtual")
                .map((city) => ({ city, distanceKm: location ? Math.round(haversineMeters(location, city.location) / 1000) : null })),
        [cities, location],
    );

    const filtered = useMemo(() => {
        const needle = normalize(query.trim());
        const list = needle
            ? entries.filter(({ city }) => normalize(city.name).includes(needle) || normalize(city.id).includes(needle) || normalize(categoryName(city.category)).includes(needle))
            : entries;
        return [...list].sort((a, b) =>
            sort === "distance" && location ? (a.distanceKm ?? 0) - (b.distanceKm ?? 0) : a.city.name.localeCompare(b.city.name, "pl"),
        );
    }, [entries, query, sort, location]);

    const groups = useMemo(() => {
        const map = new Map<string, Entry[]>();
        for (const entry of filtered) {
            const key = entry.city.category;
            map.set(key, [...(map.get(key) ?? []), entry]);
        }
        return [...map.entries()].sort(([a], [b]) => {
            const foreign = Number(FOREIGN.has(a)) - Number(FOREIGN.has(b));
            return foreign || categoryName(a).localeCompare(categoryName(b), "pl");
        });
    }, [filtered]);

    const nearest = location && entries.length ? [...entries].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))[0] : null;

    const choose = (id: string) => {
        setSettings({ city: id });
        navigate(`/${id}`);
    };

    const locate = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation([position.coords.longitude, position.coords.latitude]);
                setSort("distance");
                setLocating(false);
            },
            () => setLocating(false),
            { timeout: 10000, maximumAge: 600000 },
        );
    };

    const row = ({ city, distanceKm }: Entry, highlight = false) => (
        <Fragment key={`${city.id}-${highlight ? "near" : "row"}`}>
            <ListItemButton onClick={() => choose(city.id)} selected={settings.city === city.id} sx={{ px: 1 }}>
                {highlight && <MyLocationIcon color="primary" fontSize="small" sx={{ mr: 1 }} />}
                <ListItemText
                    primary={
                        <>
                            {city.name}
                            {distanceKm !== null && (sort === "distance" || highlight) && (
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                                    ({distanceKm} km)
                                </Typography>
                            )}
                        </>
                    }
                    secondary={city.description}
                    slotProps={{ primary: { sx: { lineHeight: 1.2 } } }}
                />
                <ChevronRightIcon color="action" />
            </ListItemButton>
            <Divider component="li" />
        </Fragment>
    );

    return (
        <>
            <PageHeader title={t("chooseCity.chooseCity")} back={settings.city ? "/ustawienia" : undefined} documentTitle={t("chooseCity.chooseCity")} />
            <div className="page">
                <Typography variant="body1">
                    <Trans i18nKey="chooseCity.chooseCityHeader" components={[<strong key="0" />]} />:
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder={t("chooseCity.search")}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    sx={{ mt: 1, mb: 1 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: query ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setQuery("")} aria-label={t("global.clear")}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : undefined,
                        },
                    }}
                />
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                    {location ? (
                        <ToggleButtonGroup
                            value={sort}
                            exclusive
                            size="small"
                            color="primary"
                            onChange={(_, value) => value && setSort(value)}
                            sx={{ "& .MuiToggleButton-root": { py: 0.25, fontSize: "0.8rem" } }}
                        >
                            <ToggleButton value="alpha">{t("chooseCity.sortAlpha")}</ToggleButton>
                            <ToggleButton value="distance">{t("chooseCity.sortDistance")}</ToggleButton>
                        </ToggleButtonGroup>
                    ) : (
                        <ToggleButton value="locate" size="small" onClick={locate} disabled={locating} sx={{ py: 0.25, fontSize: "0.8rem", gap: 0.5 }}>
                            <MyLocationIcon fontSize="small" /> {t("chooseCity.sortDistance")}
                        </ToggleButton>
                    )}
                </Box>

                {!ready && !cities.length ? (
                    <Loading />
                ) : (
                    <>
                        {nearest && sort !== "distance" && !query && (
                            <>
                                <Typography variant="overline" sx={{ px: 1, color: "text.secondary", display: "block", lineHeight: 1.6 }}>
                                    {t("chooseCity.yourLocation")}
                                </Typography>
                                <List component="nav" disablePadding>
                                    {row(nearest, true)}
                                </List>
                            </>
                        )}
                        <Typography variant="overline" sx={{ px: 1, color: "text.secondary", mt: 1.5, display: "block", lineHeight: 1.6 }}>
                            {t("chooseCity.allCities")}
                        </Typography>
                        {filtered.length === 0 && (
                            <Typography variant="body2" sx={{ px: 1 }}>
                                {t("global.nothingFound")}
                            </Typography>
                        )}
                        {sort === "distance" && location ? (
                            <List component="nav" disablePadding>
                                {filtered.map((entry) => row(entry))}
                            </List>
                        ) : (
                            groups.map(([category, list]) => (
                                <List
                                    key={category}
                                    component="nav"
                                    disablePadding
                                    subheader={
                                        <ListSubheader disableSticky sx={{ px: 1, lineHeight: "32px", fontWeight: 700, color: "primary.main", background: "transparent" }}>
                                            {categoryName(category)}
                                        </ListSubheader>
                                    }
                                >
                                    {list.map((entry) => row(entry))}
                                </List>
                            ))
                        )}
                    </>
                )}
            </div>
        </>
    );
}
