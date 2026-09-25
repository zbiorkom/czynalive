import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import { Box, Button, Divider, Link as MuiLink, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useCity } from "@/api/cities";
import { PageHeader } from "@/components/PageHeader";
import { useInstallPrompt } from "@/components/settings/install";
import { APP_MENU, cityMenu, PREFERENCES_MENU } from "@/components/settings/menu";
import { MenuGrid } from "@/components/settings/MenuGrid";
import { useSettings } from "@/store/settings";

const InstallBanner = () => {
    const { installed } = useInstallPrompt();
    if (installed) return null;
    return (
        <Box
            component={Link}
            to="/ustawienia/instalacja"
            sx={{
                mt: 1,
                mb: 0.5,
                px: 1.25,
                py: 0.75,
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                gap: 1,
                textDecoration: "none",
                color: "inherit",
                border: "1px solid var(--primary)",
                borderRadius: "8px",
            }}
        >
            <InstallMobileIcon sx={{ color: "var(--primary)", fontSize: "1.35rem" }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, lineHeight: 1.2 }}>Zainstaluj jak aplikację</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", lineHeight: 1.2 }}>Ikona na pulpicie, bez sklepu</Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "text.secondary" }} />
        </Box>
    );
};

export default function SettingsPage() {
    const { t } = useTranslation();
    const [settings] = useSettings();
    const city = useCity(settings.city ?? undefined);

    return (
        <>
            <PageHeader title="Menu" documentTitle={t("settings.pageTitle")} />
            <div className="page">
                <Box sx={{ width: "95%", mx: "auto" }}>
                    <Typography variant="h4">{t("settings.pageTitle")}</Typography>
                    <InstallBanner />

                    {city ? (
                        <>
                            <Typography variant="h6" sx={{ mt: 1 }}>
                                {city.name} - {t("settings.pageShortTitle")}
                            </Typography>
                            <Divider />
                            <MenuGrid items={cityMenu(city.id)} />
                        </>
                    ) : (
                        <Box sx={{ my: 2 }}>
                            <Button component={Link} to="/miasto" variant="contained" fullWidth>
                                {t("chooseCity.chooseCity")}
                            </Button>
                        </Box>
                    )}

                    <Typography variant="h6">{t("settings.userPreferences")}</Typography>
                    <Divider />
                    <MenuGrid items={PREFERENCES_MENU} />

                    <Typography variant="h6">Czynalive - {t("settings.app")}</Typography>
                    <Divider />
                    <MenuGrid items={APP_MENU} />

                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, mt: 2, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Dane:{" "}
                            <MuiLink href="https://zbiorkom.live" target="_blank" rel="noopener noreferrer">
                                zbiorkom.live
                            </MuiLink>
                        </Typography>
                        <MuiLink component={Link} to="/ustawienia/buswifi" variant="caption">
                            BusWiFi
                        </MuiLink>
                    </Box>
                </Box>
            </div>
        </>
    );
}
