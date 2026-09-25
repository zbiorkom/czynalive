import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import { Alert, AlertTitle, Box, Button, Divider, FormControlLabel, FormGroup, List, ListItem, ListItemText, Switch, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCities } from "@/api/cities";
import { useSettings } from "@/store/settings";

export const APP_VERSION = "0.1.0";

export const rebrand = (text: string) => text.replace(/Czynaczas\.pl/gi, "Czynalive");

export const AppLogo = ({ size = 68 }: { size?: number }) => (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
        <img src="/favicon.svg" alt="" width={size} height={size} />
        <Typography sx={{ fontSize: size * 0.42, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.5px" }}>Czynalive</Typography>
    </Box>
);

export const ThemeSection = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useSettings();
    return (
        <div style={{ marginBottom: 70 }}>
            <Typography variant="h4" gutterBottom>
                {t("settings.darkModeHeader")}
            </Typography>
            <Typography variant="h5" gutterBottom>
                Wybierz, w jakim motywie chcesz korzystać z aplikacji:
            </Typography>
            <Box sx={{ m: 2 }}>
                <ToggleButtonGroup
                    color="primary"
                    value={settings.theme}
                    exclusive
                    fullWidth
                    onChange={(_, value) => value && setSettings({ theme: value })}
                    aria-label={t("settings.darkModeTheme")}
                >
                    <ToggleButton value="light" sx={{ gap: 0.75 }}>
                        <LightModeIcon /> {t("settings.darkModeLight")}
                    </ToggleButton>
                    <ToggleButton value="dark" sx={{ gap: 0.75 }}>
                        <DarkModeIcon /> {t("settings.darkModeDark")}
                    </ToggleButton>
                    <ToggleButton value="system" sx={{ gap: 0.75 }}>
                        <SettingsBrightnessIcon /> Systemowy
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box sx={{ my: 8 }}>
                <AppLogo />
            </Box>
        </div>
    );
};

export const LanguageSection = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useSettings();
    return (
        <div style={{ marginBottom: 70 }}>
            <Typography variant="h4" gutterBottom>
                {t("changeLanguage.chooseLanguage")}:
            </Typography>
            <Box sx={{ m: 2 }}>
                <ToggleButtonGroup color="primary" value={settings.language} exclusive fullWidth onChange={(_, value) => value && setSettings({ language: value })}>
                    <ToggleButton value="pl">{t("changeLanguage.polish")}</ToggleButton>
                    <ToggleButton value="en" disabled>
                        {t("changeLanguage.english")}
                    </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                    Wersja angielska jest w przygotowaniu.
                </Typography>
            </Box>
        </div>
    );
};

export const DeparturesSection = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useSettings();
    return (
        <div>
            <Typography variant="h3" gutterBottom>
                {t("settings.timetableSettings")}
            </Typography>
            <Typography variant="body1" gutterBottom>
                <strong>{t("settings.timetablePart1")}</strong>
            </Typography>
            <Divider sx={{ my: 2.5 }} />
            <FormGroup>
                <FormControlLabel
                    control={<Switch checked={settings.departuresShowBrigade} onChange={() => setSettings({ departuresShowBrigade: !settings.departuresShowBrigade })} color="primary" />}
                    label={t("settings.timetableShowBrigadeLabel")}
                />
                <FormControlLabel
                    control={<Switch checked={settings.departuresShowVehicleNo} onChange={() => setSettings({ departuresShowVehicleNo: !settings.departuresShowVehicleNo })} color="primary" />}
                    label={t("settings.timetableShowVehicleNoLabel")}
                />
            </FormGroup>
        </div>
    );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const UpdateSection = () => {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<"none" | "updated" | null>(null);

    const check = async () => {
        setBusy(true);
        setResult(null);
        let changed = false;
        try {
            if ("serviceWorker" in navigator) {
                for (const registration of await navigator.serviceWorker.getRegistrations()) {
                    await registration.update().catch(() => {});
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: "SKIP_WAITING" });
                        changed = true;
                    }
                }
            }
            const response = await fetch(`/index.html?check=${Date.now()}`, { cache: "no-store" });
            const html = await response.text();
            const current = [...document.querySelectorAll<HTMLScriptElement>("script[type=module][src]")].map((script) => script.getAttribute("src"));
            if (current.some((src) => src && !html.includes(src))) changed = true;
            await sleep(1200);
        } catch {}
        setBusy(false);
        setResult(changed ? "updated" : "none");
        if (changed) setTimeout(() => window.location.reload(), 2500);
    };

    return (
        <div style={{ paddingTop: 20 }}>
            <Typography variant="h4" gutterBottom>
                {t("settings.checkUpdate")}
            </Typography>
            <Divider sx={{ my: 1.25 }} />
            <Typography variant="body1" gutterBottom>
                {t("settings.updatePart2")}
            </Typography>
            <Button variant="contained" fullWidth onClick={check} disabled={busy}>
                {busy ? `${t("global.pleaseWait")}...` : t("settings.checkUpdate")}
            </Button>
            <Divider sx={{ my: 1.25 }} />
            <Typography variant="h5" gutterBottom>
                <strong>{t("settings.updatePart3")}:</strong>
            </Typography>
            <Box sx={{ my: 2 }}>
                <AppLogo />
            </Box>
            <Typography variant="h5" align="center" gutterBottom>
                v{APP_VERSION}
            </Typography>
            {result === "none" && (
                <Alert severity="info" sx={{ mt: 0.5 }}>
                    <AlertTitle>{t("settings.updatePart4")}</AlertTitle>
                    {rebrand(t("settings.updatePart5"))}
                </Alert>
            )}
            {result === "updated" && (
                <Alert severity="success" sx={{ mt: 0.5 }}>
                    <AlertTitle>{t("settings.updatePart6")}</AlertTitle>
                    Pobrano nową wersję aplikacji — strona zostanie odświeżona.
                </Alert>
            )}
        </div>
    );
};

export const BusWifiSection = () => {
    const { t } = useTranslation();
    const { cities } = useCities();
    return (
        <div>
            <Typography variant="h4" gutterBottom>
                {t("settings.busWifiPageTitle")}
            </Typography>
            <Typography variant="body2" gutterBottom>
                {t("settings.busWifiPageDescription")}.
            </Typography>
            <Alert severity="info" sx={{ my: 2 }}>
                Dane o pojazdach z urządzeniami BusWiFi nie są dostępne w źródłach zbiorkom.live. Poniżej lista miast obsługiwanych przez aplikację.
            </Alert>
            <List dense>
                {cities
                    .filter((city) => !city.virtual)
                    .map((city) => (
                        <ListItem key={city.id} divider>
                            <ListItemText primary={city.name} secondary={`${t("settings.busWifiSupportedVehicles")}: ${t("global.noData").toLowerCase()}`} />
                        </ListItem>
                    ))}
            </List>
        </div>
    );
};
