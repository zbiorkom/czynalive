import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, Dialog, DialogActions, DialogContent, Divider, Grid2 as Grid, IconButton, Paper, Typography } from "@mui/material";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { RouteType, type VehiclePosition } from "@/api/types";
import { useSettings } from "@/store/settings";
import { mapStyleFor, normalizeTileLayer, type TileLayer } from "./mapStyle";
import { vehicleMarkerHtml } from "./markers";

type Props = { open: boolean; onClose: () => void; center: [number, number]; zoom: number; dark: boolean };

const sample = (type: RouteType, line: string, bearing: number): VehiclePosition => [
    `${type}:4202`,
    "",
    [line, "", line, "", "default", type, ""],
    "06",
    [0, 0],
    bearing,
];

const MarkerPreview = ({ html }: { html: string }) => (
    <div className="vehicle-marker-in-dialog" style={{ display: "inline-block", maxWidth: 150 }} dangerouslySetInnerHTML={{ __html: html }} />
);

const Card = ({ selected, onClick, title, children }: { selected: boolean; onClick: () => void; title: string; children: ReactNode }) => (
    <Paper
        variant="outlined"
        onClick={onClick}
        className={selected ? "border-primary" : ""}
        sx={{ cursor: "pointer", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", p: 1, gap: 1 }}
    >
        <Typography variant="subtitle2">{title}</Typography>
        {children}
    </Paper>
);

const tileXY = (lon: number, lat: number, zoom: number) => {
    const n = 2 ** zoom;
    const x = Math.floor(((lon + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    return { x, y };
};

const MiniMap = ({ style, center, zoom }: { style: ReturnType<typeof mapStyleFor>; center: [number, number]; zoom: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const map = new maplibregl.Map({ container: ref.current, style, center, zoom, interactive: false, attributionControl: false });
        return () => map.remove();
    }, []);
    return <div ref={ref} style={{ width: "100%", maxWidth: 100, aspectRatio: "1", borderRadius: 4, overflow: "hidden", pointerEvents: "none" }} />;
};

// "Warstwy mapy": base layer and marker look (czynaczas layers dialog).
export const LayersDialog = ({ open, onClose, center, zoom, dark }: Props) => {
    const { t } = useTranslation();
    const [settings, setSettings] = useSettings();
    const tile = normalizeTileLayer(settings.mapStyle);
    const previewZoom = Math.min(Math.floor(zoom), 12) + 1;
    const { x, y } = tileXY(center[0], center[1], previewZoom);
    const base = { showBrigade: settings.markerShowBrigade, showVehicleNo: false, colorByDelay: false, dark };
    const imageSx = { width: "100%", maxWidth: 100, aspectRatio: "1", objectFit: "cover" as const, borderRadius: "4px" };

    const setTile = (value: TileLayer) => setSettings({ mapStyle: value });

    return (
        <Dialog open={open} onClose={onClose} fullScreen scroll="paper">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ px: 1.5, py: 0.5 }}>
                    {t("map.layersHeader")}
                </Typography>
                <IconButton onClick={onClose} size="large" aria-label={t("global.close")}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent dividers sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ pb: 2 }}>
                    {t("map.tileLayerHeader")}
                </Typography>
                <Grid container spacing={2} sx={{ justifyContent: "center" }}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <Card selected={tile === "streets"} onClick={() => setTile("streets")} title={t("map.tileLayerOpenFreeMap")}>
                            {open && <MiniMap style={mapStyleFor("streets", dark)} center={center} zoom={previewZoom - 1} />}
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <Card selected={tile === "osm"} onClick={() => setTile("osm")} title={t("map.tileLayerOSM")}>
                            <Box
                                component="img"
                                src={`https://tile.openstreetmap.org/${previewZoom}/${x}/${y}.png`}
                                alt={t("map.tileLayerOSM")}
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                                sx={[imageSx, dark ? { filter: "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) saturate(50%) !important" } : {}]}
                            />
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <Card selected={tile === "satellite"} onClick={() => setTile("satellite")} title={t("map.tileLayerSatellite")}>
                            <Box
                                component="img"
                                src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${previewZoom}/${y}/${x}`}
                                alt={t("map.tileLayerSatellite")}
                                loading="lazy"
                                sx={imageSx}
                            />
                        </Card>
                    </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" sx={{ pb: 2 }}>
                    {t("settings.markers")}
                </Typography>
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Card selected={!settings.colorByDelay} onClick={() => setSettings({ colorByDelay: false })} title={t("map.layersColorBasedOnType")}>
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Bus, "100", 209), base)} />
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Tram, "10", 209), base)} />
                        </Card>
                    </Grid>
                    <Grid size={6}>
                        <Card selected={settings.colorByDelay} onClick={() => setSettings({ colorByDelay: true })} title={t("map.layersColorBasedOnDelay")}>
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Bus, "100", 209), { ...base, colorByDelay: true, delayMs: 16 * 60000 })} />
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Tram, "10", 209), { ...base, colorByDelay: true, delayMs: 5 * 60000 })} />
                        </Card>
                    </Grid>
                    <Grid size={12} sx={{ textAlign: "right", pt: "0 !important" }}>
                        <Typography variant="subtitle2" component={Link} to="/ustawienia/znaczniki-pojazdow" sx={{ color: "inherit" }}>
                            {t("map.layersColorBasedOnDelayDetails")}
                        </Typography>
                    </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Card selected={!settings.markerShowBrigade} onClick={() => setSettings({ markerShowBrigade: false })} title={t("map.layersNoShowBrigade")}>
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Bus, "100", 209), { ...base, showBrigade: false })} />
                        </Card>
                    </Grid>
                    <Grid size={6}>
                        <Card selected={settings.markerShowBrigade} onClick={() => setSettings({ markerShowBrigade: true })} title={t("map.layersShowBrigade")}>
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Bus, "100", 209), { ...base, showBrigade: true })} />
                        </Card>
                    </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Card selected={!settings.markerShowVehicleNo} onClick={() => setSettings({ markerShowVehicleNo: false })} title={t("map.layersNoShowVehicle")}>
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Bus, "100", 209), base)} />
                        </Card>
                    </Grid>
                    <Grid size={6}>
                        <Card selected={settings.markerShowVehicleNo} onClick={() => setSettings({ markerShowVehicleNo: true })} title={t("map.layersShowVehicle")}>
                            <MarkerPreview html={vehicleMarkerHtml(sample(RouteType.Bus, "100", 209), { ...base, showVehicleNo: true })} />
                        </Card>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "flex-end", pb: "calc(8px + var(--sab))" }}>
                <Button onClick={onClose} variant={dark ? "contained" : "text"} className="text-default-text">
                    {t("global.close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
