import Grid from "@mui/material/Grid2";
import NavigationIcon from "@mui/icons-material/Navigation";
import { Box, Divider, FormControlLabel, List, ListItem, ListItemIcon, ListItemText, Paper, Radio, RadioGroup, Switch, Typography } from "@mui/material";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCity } from "@/api/cities";
import { cityGet } from "@/api/client";
import { ERouteTuple, RouteType, type RouteTuple } from "@/api/types";
import { useApi } from "@/api/useApi";
import { VehicleGlyph, VehicleTypeIcon } from "@/components/brigades/VehicleTypeIcon";
import { vehicleType, type DelayClass } from "@/lib/transit";
import { useSettings, type Settings } from "@/store/settings";

const TYPE_ORDER = [RouteType.Tram, RouteType.Bus, RouteType.Trolleybus, RouteType.Subway, RouteType.Rail, RouteType.Ferry];

const DELAY_SAMPLES: { cls: DelayClass; label: string; values: number[] }[] = [
    { cls: "delayed-no-data", label: "settings.delayNoData", values: [] },
    { cls: "before-time", label: "settings.delayRange1", values: [1] },
    { cls: "on-time", label: "settings.delayRange2", values: [1, 2] },
    { cls: "delayed-slight", label: "settings.delayRange3", values: [2, 5] },
    { cls: "delayed-minor", label: "settings.delayRange4", values: [5, 10] },
    { cls: "delayed-moderate", label: "settings.delayRange4", values: [10, 20] },
    { cls: "delayed-major", label: "settings.delayRange4", values: [20, 30] },
    { cls: "delayed-critical", label: "settings.delayRange5", values: [30] },
];

const useResolvedMode = () => {
    const [settings] = useSettings();
    const [mode, setMode] = useState(() => document.documentElement.getAttribute("data-theme") ?? "light");
    useEffect(() => {
        const timer = setTimeout(() => setMode(document.documentElement.getAttribute("data-theme") ?? "light"));
        return () => clearTimeout(timer);
    }, [settings.theme]);
    return mode;
};

export const MarkerPreview = ({ type, delayClass, brigade, vehicleNo, mode }: { type: number; delayClass?: DelayClass; brigade: boolean; vehicleNo: boolean; mode: string }) => {
    const key = vehicleType(type).key;
    const base = mode === "dark" ? `bg-${key} text-default-text border-default-text fill-default-text` : `bg-white text-${key} border-${key} fill-${key}`;
    return (
        <div className={`vehicle-marker ${base} ${delayClass ?? ""}`} style={{ maxWidth: 150, zIndex: "auto", transform: "none" }}>
            <div className="marker-data-row main">
                <NavigationIcon style={{ transform: "rotate(209deg)" }} />
                <VehicleGlyph vehicle={type} />
                <div className="route-id-number">100</div>
                {brigade && <div className="brigade">/23</div>}
                {vehicleNo && <div className="vehicle-no">/5689</div>}
            </div>
        </div>
    );
};

const PreviewCard = ({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) => (
    <Paper variant="outlined" sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 1, background: "var(--default-bg)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <Typography variant="body1" gutterBottom>
                {title}
            </Typography>
            {caption && (
                <Typography variant="caption" gutterBottom>
                    {caption}:
                </Typography>
            )}
            {children}
        </Box>
    </Paper>
);

const ToggleBlock = ({ title, description, label, field }: { title: string; description: ReactNode; label: string; field: keyof Settings }) => {
    const [settings, setSettings] = useSettings();
    return (
        <div>
            <Typography variant="h4">{title}</Typography>
            <Typography variant="body2">
                <em>{description}</em>
            </Typography>
            <FormControlLabel
                control={<Switch checked={!!settings[field]} onChange={() => setSettings({ [field]: !settings[field] } as Partial<Settings>)} color="primary" />}
                label={label}
            />
        </div>
    );
};

export const MarkersSection = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useSettings();
    const city = useCity(settings.city ?? undefined);
    const mode = useResolvedMode();
    const routes = useApi(city ? (signal) => cityGet<RouteTuple[]>(city.id, "/routes", undefined, signal) : null, [city?.id]);
    const cityTypes = new Set((routes.data ?? []).filter((route) => route[ERouteTuple.city] === city?.id).map((route) => route[ERouteTuple.routeType]));
    const types = cityTypes.size ? TYPE_ORDER.filter((type) => cityTypes.has(type)) : [RouteType.Tram, RouteType.Bus];

    return (
        <div>
            <Typography variant="h3" gutterBottom>
                {t("settings.markers")}
            </Typography>
            <Typography variant="body1" gutterBottom>
                <strong>{t("settings.markerPart1")}</strong>
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <ToggleBlock
                title={t("settings.showBrigade")}
                description={<Trans i18nKey="settings.brigadeDescription" components={[<strong key="0" />]} />}
                label={t("settings.showBrigadeLabel")}
                field="markerShowBrigade"
            />
            <Divider sx={{ my: 2.5 }} />
            <ToggleBlock
                title={t("settings.showVehicleNo")}
                description={<Trans i18nKey="settings.vehicleNoDescription" components={[<strong key="0" />]} />}
                label={t("settings.showVehicleNoLabel")}
                field="markerShowVehicleNo"
            />
            <Divider sx={{ my: 2.5 }} />
            <ToggleBlock
                title={t("settings.colorByDelay")}
                description={<Trans i18nKey="settings.colorByDelayDescription" components={[<strong key="0" />]} />}
                label={t("settings.colorByDelayLabel")}
                field="colorByDelay"
            />
            <Divider sx={{ my: 2.5 }} />
            <ToggleBlock title={t("settings.showVehiclePhotos")} description={t("settings.vehiclePhotosDescription")} label={t("settings.showVehiclePhotosLabel")} field="showVehiclePhotos" />
            <Divider sx={{ my: 2.5 }} />
            <div>
                <Typography variant="h4">{t("settings.noAcBadgeMode")}</Typography>
                <Typography variant="body2" gutterBottom>
                    <em>{t("settings.noAcBadgeModeDescription")}</em>
                </Typography>
                <RadioGroup value={settings.noAcBadgeMode} onChange={(event) => setSettings({ noAcBadgeMode: event.target.value as Settings["noAcBadgeMode"] })}>
                    <FormControlLabel value="never" control={<Radio />} label={t("settings.noAcBadgeModeNever")} />
                    <FormControlLabel value="hot" control={<Radio />} label={t("settings.noAcBadgeModeHot")} />
                    <FormControlLabel value="always" control={<Radio />} label={t("settings.noAcBadgeModeAlways")} />
                </RadioGroup>
            </div>
            <Divider sx={{ my: 2.5 }} />
            <ToggleBlock title={t("settings.showRampBadge")} description={t("settings.showRampBadgeDescription")} label={t("settings.showRampBadgeLabel")} field="showRampBadge" />
            <Divider sx={{ my: 2.5 }} />

            <Typography variant="h4">{t("global.preview")}:</Typography>
            <Box sx={{ my: 3 }}>
                {settings.colorByDelay ? (
                    types.map((type) => (
                        <Fragment key={type}>
                            <Grid container spacing={1}>
                                {DELAY_SAMPLES.map((sample) => (
                                    <Grid key={sample.cls} size={{ xs: 6, sm: 4, md: 3 }}>
                                        <PreviewCard title={vehicleType(type).name} caption={t(sample.label, { one: sample.values[0], two: sample.values[1] })}>
                                            <MarkerPreview type={type} delayClass={sample.cls} brigade={settings.markerShowBrigade} vehicleNo={settings.markerShowVehicleNo} mode={mode} />
                                        </PreviewCard>
                                    </Grid>
                                ))}
                            </Grid>
                            <Divider sx={{ my: 2 }} />
                        </Fragment>
                    ))
                ) : (
                    <Grid container spacing={1}>
                        {types.map((type) => (
                            <Grid key={type} size={{ xs: 6, sm: 4, md: 3 }}>
                                <PreviewCard title={vehicleType(type).name}>
                                    <MarkerPreview type={type} brigade={settings.markerShowBrigade} vehicleNo={settings.markerShowVehicleNo} mode={mode} />
                                </PreviewCard>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            <Typography variant="h4" gutterBottom>
                {t("settings.markers")}
            </Typography>
            <Typography variant="h5" gutterBottom>
                <Trans i18nKey="settings.markerColors" values={{ city: city?.name ?? "" }} components={[<strong key="0" />]} />
            </Typography>
            <List>
                {types.map((type) => (
                    <Fragment key={type}>
                        <ListItem
                            secondaryAction={<Box sx={{ width: 30, height: 30, borderRadius: "4px", backgroundColor: vehicleType(type).cssVar }} />}
                        >
                            <ListItemIcon>
                                <VehicleTypeIcon type={type} size={32} />
                            </ListItemIcon>
                            <ListItemText primary={vehicleType(type).name} />
                        </ListItem>
                        <Divider component="li" />
                    </Fragment>
                ))}
            </List>
        </div>
    );
};
