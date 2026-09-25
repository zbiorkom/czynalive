import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShareIcon from "@mui/icons-material/Share";
import { Box, Button, IconButton, Snackbar, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ERouteTuple, type RouteTuple } from "@/api/types";
import { VehicleTypeIcon, vehicleTypeName } from "@/components/departures/VehicleTypeIcon";
import { useSettings } from "@/store/settings";

export const ROUTE_TYPE_ORDER = [4, 1, 0, 11, 3, 2, 6, 7, 12];

const collator = new Intl.Collator("pl", { numeric: true, sensitivity: "base" });

export const compareRouteNames = (a: string, b: string) => collator.compare(a, b);

const typeRank = (type: number) => {
    const index = ROUTE_TYPE_ORDER.indexOf(type);
    return index === -1 ? ROUTE_TYPE_ORDER.length : index;
};

// czynaczas order: vehicle type (ferry, metro, tram, trolleybus, bus, rail), default agency first, then name.
export const sortRoutes = <T extends RouteTuple>(routes: T[]): T[] =>
    [...routes].sort(
        (a, b) =>
            typeRank(a[ERouteTuple.routeType]) - typeRank(b[ERouteTuple.routeType]) ||
            Number(b[ERouteTuple.routeAgency] === "default") - Number(a[ERouteTuple.routeAgency] === "default") ||
            compareRouteNames(a[ERouteTuple.routeName], b[ERouteTuple.routeName]),
    );

export const sortTypes = (types: number[]) => [...new Set(types)].sort((a, b) => typeRank(a) - typeRank(b));

const cityQuery = (pageCity: string, dataCity?: string) => (dataCity && dataCity !== pageCity ? `?miasto=${encodeURIComponent(dataCity)}` : "");

export const routeLink = (city: string, routeId: string, dataCity?: string) =>
    `/${city}/rozklad-jazdy/linia/${encodeURIComponent(routeId)}${cityQuery(city, dataCity)}`;

export const stopLink = (city: string, stopId: string, routeId?: string, dataCity?: string) =>
    `/${city}/rozklad-jazdy/przystanek/${encodeURIComponent(stopId)}${routeId ? `/linia/${encodeURIComponent(routeId)}` : ""}${cityQuery(city, dataCity)}`;

export const typeReadableKey = (type: number) => {
    switch (vehicleTypeName(type)) {
        case "tram":
            return "global.tram";
        case "subway":
            return "global.subway";
        case "train":
            return "global.train";
        case "ferry":
            return "global.ferry";
        case "trolleybus":
            return "global.trolleybus";
        default:
            return "global.bus";
    }
};

export const useThemeMode = () => {
    const [settings] = useSettings();
    if (settings.theme === "system") return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return settings.theme;
};

// Outlined line button in the vehicle-type colour (czynaczas route grid).
export const RouteButton = ({ route, to, selected, onClick, sx }: { route: RouteTuple; to?: string; selected?: boolean; onClick?: () => void; sx?: object }) => {
    const mode = useThemeMode();
    const name = vehicleTypeName(route[ERouteTuple.routeType]);
    const className = selected
        ? `border-tiny-${name} bg-${name} text-white`
        : mode === "dark"
          ? `border-tiny-${name} text-default-text bg-default-bg`
          : `border-tiny-${name} text-${name} bg-white`;
    const linkProps = to ? { component: Link, to } : { onClick };
    return (
        <Button
            fullWidth
            variant="outlined"
            className={className}
            {...(linkProps as object)}
            sx={{ flexDirection: "column", height: "100%", p: 0.5, textTransform: "none", minWidth: 0, ...sx }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontWeight: 600, fontSize: "0.95rem", maxWidth: "100%" }}>
                <VehicleTypeIcon
                    routeType={route[ERouteTuple.routeType]}
                    sx={{ width: "1.3em", height: "1.3em", color: selected ? "#fff" : mode === "dark" ? "var(--default-text)" : `var(--${name})` }}
                />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{route[ERouteTuple.routeName]}</span>
            </Box>
        </Button>
    );
};

export const RouteGrid = ({ routes, linkFor, onSelect, selected }: { routes: RouteTuple[]; linkFor?: (route: RouteTuple) => string; onSelect?: (route: RouteTuple) => void; selected?: string }) => (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(4, 1fr)", sm: "repeat(6, 1fr)", md: "repeat(8, 1fr)", lg: "repeat(12, 1fr)" }, gap: 1 }}>
        {routes.map((route) => (
            <RouteButton
                key={`${route[ERouteTuple.city]}/${route[ERouteTuple.routeId]}`}
                route={route}
                to={linkFor?.(route)}
                onClick={onSelect ? () => onSelect(route) : undefined}
                selected={selected === route[ERouteTuple.routeId]}
            />
        ))}
    </Box>
);

// Round vehicle-type badges (stop / route header).
export const TypeCircles = ({ types, size = 40 }: { types: number[]; size?: number }) => (
    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
        {sortTypes(types.length ? types : [3]).map((type) => (
            <Box
                key={type}
                sx={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `var(--${vehicleTypeName(type)})`,
                    color: "#fff",
                    p: 0.25,
                }}
            >
                <VehicleTypeIcon routeType={type} sx={{ color: "#fff", width: "70%", height: "70%" }} />
            </Box>
        ))}
    </Box>
);

// One-line clamped caption with an expand toggle.
export const ExpandableText = ({ children }: { children: ReactNode }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box
                sx={
                    expanded
                        ? { display: "flex", flexDirection: "column" }
                        : { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1, whiteSpace: "pre-wrap", lineHeight: "34px", flexDirection: "column" }
                }
            >
                {children}
            </Box>
            <IconButton size="small" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Zwiń" : "Rozwiń"}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
        </Box>
    );
};

export const ShareLine = ({ text, children }: { text: string; children?: ReactNode }) => {
    const { t } = useTranslation();
    const [message, setMessage] = useState<string>();
    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: text, text, url });
                return;
            }
        } catch {
            return;
        }
        try {
            await navigator.clipboard.writeText(`${text} ${url}`);
            setMessage(t("settings.urlCopied"));
        } catch {
            setMessage(t("settings.urlCopyError"));
        }
    };
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
            <Typography variant="caption" data-nosnippet>
                <strong>{t("global.shareUrl")}: </strong>
                <IconButton size="small" color="primary" onClick={share} aria-label={t("global.share")}>
                    <ShareIcon fontSize="small" />
                </IconButton>
            </Typography>
            {children && <Box sx={{ display: "flex", alignItems: "center" }}>{children}</Box>}
            <Snackbar open={!!message} autoHideDuration={2500} onClose={() => setMessage(undefined)} message={message} />
        </Box>
    );
};

export const SmallAction = ({ to, icon, label }: { to: string; icon: ReactNode; label: string }) => (
    <IconButton size="small" color="primary" component={Link} to={to} sx={{ borderRadius: 1, gap: 0.25 }}>
        {icon}
        <Typography variant="caption">{label}</Typography>
    </IconButton>
);
