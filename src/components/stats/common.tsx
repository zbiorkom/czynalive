import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Chip, IconButton, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { VehicleTypeIcon, vehicleTypeName } from "@/components/departures/VehicleTypeIcon";
import { ShareButton } from "@/components/alerts/ShareButton";
import { vehicleType } from "@/lib/transit";
import { delayMinutesClass } from "./api";

const SLANT = 6;

// Joined pill of vehicle type icons (czynaczas VehicleTypeChip).
export const VehicleTypesPill = ({ types, size = 32 }: { types: number[]; size?: number }) => {
    if (types.length === 0) return null;
    const iconSize = Math.round(size * 0.625);
    return (
        <Box sx={{ display: "inline-flex", alignItems: "center", height: size, borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
            {types.map((type, index) => {
                const first = index === 0;
                const last = index === types.length - 1;
                const clipPath = first
                    ? last
                        ? undefined
                        : `polygon(0 0, 100% 0, calc(100% - ${SLANT * 2}px) 100%, 0 100%)`
                    : last
                      ? `polygon(${SLANT * 2}px 0, 100% 0, 100% 100%, 0 100%)`
                      : `polygon(${SLANT * 2}px 0, 100% 0, calc(100% - ${SLANT * 2}px) 100%, 0 100%)`;
                return (
                    <Box
                        key={type}
                        className={`bg-${vehicleTypeName(type)}`}
                        sx={{
                            height: "100%",
                            minWidth: size + (first ? 0 : SLANT) + (last ? 0 : SLANT),
                            pl: first ? 0 : `${SLANT}px`,
                            pr: last ? 0 : `${SLANT}px`,
                            ml: first ? 0 : `-${SLANT}px`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            clipPath,
                        }}
                    >
                        <VehicleTypeIcon routeType={type} sx={{ width: iconSize, height: iconSize, color: "#fff" }} />
                    </Box>
                );
            })}
        </Box>
    );
};

export const typeName = (type: number) => vehicleType(type).name;
export const typePlural = (type: number) => vehicleType(type).plural;

// Delay in whole minutes as a coloured chip ("5 min", "2 min przed czasem").
export const DelayChip = ({ minutes }: { minutes: number }) => {
    const { t } = useTranslation();
    return (
        <Chip
            size="small"
            label={`${Math.abs(minutes)} min ${minutes < 0 ? t("global.beforeTime").toLowerCase() : ""}`.trim()}
            className={`bg-${delayMinutesClass(minutes)} text-white`}
            sx={{ fontWeight: 500 }}
        />
    );
};

export const SectionHeader = ({ types, selectedType, title, subtitle }: { types: number[]; selectedType: number | "total"; title: ReactNode; subtitle: ReactNode }) =>
    selectedType !== "total" ? (
        <div style={{ display: "flex", placeItems: "center", gap: 10, marginBottom: 10 }}>
            <VehicleTypesPill types={[selectedType]} size={50} />
            <div>
                <Typography variant="h6" sx={{ fontSize: "1.05rem", lineHeight: 1.3 }}>
                    {title}
                </Typography>
                <Typography variant="h5" sx={{ fontSize: "1.2rem", fontWeight: 500 }}>
                    {subtitle}
                </Typography>
            </div>
        </div>
    ) : (
        <div style={{ display: "flex", placeItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            <VehicleTypesPill types={types} />
            <div>
                <Typography variant="h6" sx={{ fontSize: "1.05rem", lineHeight: 1.3 }}>
                    {title}
                </Typography>
                <Typography variant="h5" sx={{ fontSize: "1.2rem", fontWeight: 500 }}>
                    {subtitle}
                </Typography>
            </div>
        </div>
    );

export const TypeTabs = ({ value, types, onChange, allLabel }: { value: number | "total"; types: number[]; onChange: (value: number | "total") => void; allLabel?: string }) => {
    const { t } = useTranslation();
    return (
        <Tabs
            value={value}
            onChange={(_, next) => onChange(next)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
        >
            <Tab value="total" label={allLabel ?? t("delays.allVehicles")} />
            {types.map((type) => (
                <Tab key={type} value={type} label={typePlural(type)} />
            ))}
        </Tabs>
    );
};

// Collapsible SEO description with "updated" line and share button.
export const DescriptionBox = ({ lines, updated, shareText }: { lines: ReactNode[]; updated: string; shareText: string }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
                sx={{
                    flexDirection: "column",
                    ...(expanded
                        ? { display: "flex" }
                        : { overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1, whiteSpace: "pre-wrap", lineHeight: "34px" }),
                }}
            >
                {lines.map((line, index) => (
                    <Typography key={index} variant="caption" gutterBottom component="p">
                        {line}
                    </Typography>
                ))}
                <Typography variant="caption" gutterBottom component="p">
                    {t("delays.statsAreAutomaticallyRefreshed")}
                </Typography>
                <Typography variant="caption" gutterBottom component="p">
                    {t("global.updated")}: {updated}
                </Typography>
                <Typography variant="caption" component="p" data-nosnippet>
                    {t("global.shareUrl")}:
                    <ShareButton text={shareText} />
                </Typography>
            </Box>
            <IconButton onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Zwiń" : "Rozwiń"} sx={{ alignSelf: "flex-start" }}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
        </Box>
    );
};

export const StatTile = ({ title, value, suffix, className, additional }: { title: string; value: number; suffix: string; className?: string; additional?: ReactNode }) => (
    <Paper
        sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", position: "relative" }}
    >
        <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", p: 1 }}>
            <Typography variant="body2" gutterBottom>
                {title}:
            </Typography>
            <Chip size="small" label={`${Math.abs(value)} ${suffix}`} sx={{ mb: 1, fontWeight: 500 }} className={className} />
            {additional}
        </Box>
        <Box sx={{ position: "absolute", bottom: 0, right: 2, opacity: 0.1 }}>
            <Typography variant="caption">Czynalive</Typography>
        </Box>
    </Paper>
);
