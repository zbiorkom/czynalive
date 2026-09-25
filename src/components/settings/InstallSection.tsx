import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import { Alert, Box, Button, Chip, Divider, List, ListItem, ListItemText, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isIos, useInstallPrompt } from "./install";
import { AppLogo } from "./SimpleSections";

const ANDROID_STEPS = ["Otwórz tę stronę w przeglądarce Chrome.", "Stuknij menu ⋮ w prawym górnym rogu.", "Wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.", "Potwierdź przyciskiem „Zainstaluj”."];
const IOS_STEPS = ["Otwórz tę stronę w Safari.", "Stuknij przycisk „Udostępnij” (kwadrat ze strzałką).", "Wybierz „Do ekranu początkowego”.", "Potwierdź przyciskiem „Dodaj”."];
const DESKTOP_STEPS = ["Otwórz tę stronę w Chrome lub Edge.", "Kliknij ikonę instalacji na końcu paska adresu.", "Potwierdź przyciskiem „Zainstaluj”."];

const Steps = ({ title, steps }: { title: string; steps: string[] }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <List dense disablePadding>
            {steps.map((step, index) => (
                <ListItem key={step} disableGutters sx={{ py: 0 }}>
                    <ListItemText primary={`${index + 1}. ${step}`} />
                </ListItem>
            ))}
        </List>
    </Box>
);

export const InstallSection = () => {
    const { t } = useTranslation();
    const { canPrompt, installed, install } = useInstallPrompt();
    const [manual, setManual] = useState(!canPrompt);
    const [accepted, setAccepted] = useState(false);

    return (
        <div>
            <Typography variant="h3" gutterBottom>
                {t("settings.appInstallation")}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, my: 2, textAlign: "center", background: "transparent" }}>
                <AppLogo size={56} />
                <Typography variant="h5" sx={{ mt: 2 }} gutterBottom>
                    <strong>Zainstaluj Czynalive jak aplikację</strong>
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Ikona na ekranie głównym, pełny ekran i szybszy start — mapa autobusów i tramwajów na żywo bez sklepu z aplikacjami.
                </Typography>
                <Box sx={{ mt: 2 }}>
                    {installed || accepted ? (
                        <Chip color="primary" icon={<CheckCircleIcon />} label={t("settings.installed")} />
                    ) : canPrompt ? (
                        <Button variant="contained" size="large" startIcon={<InstallMobileIcon />} onClick={async () => setAccepted(await install())}>
                            {t("settings.install")}
                        </Button>
                    ) : (
                        !manual && (
                            <Button variant="outlined" onClick={() => setManual(true)}>
                                {t("settings.showManualInstall")}
                            </Button>
                        )
                    )}
                </Box>
            </Paper>
            {canPrompt && !manual && !installed && (
                <Button fullWidth onClick={() => setManual(true)}>
                    {t("settings.showManualInstall")}
                </Button>
            )}
            {manual && !installed && (
                <>
                    <Divider sx={{ my: 2 }} />
                    {isIos() && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Na iPhonie instalacja jest możliwa tylko z przeglądarki Safari.
                        </Alert>
                    )}
                    <Steps title="Android (Chrome)" steps={ANDROID_STEPS} />
                    <Steps title="iPhone / iPad (Safari)" steps={IOS_STEPS} />
                    <Steps title="Komputer (Chrome / Edge)" steps={DESKTOP_STEPS} />
                </>
            )}
        </div>
    );
};
