import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Alert, Badge, BottomNavigation, BottomNavigationAction, Box, Button, Divider, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NAV_ENTRIES } from "@/lib/navigation";
import { DEFAULT_BOTTOM_NAV, useSettings, type BottomNavItem } from "@/store/settings";
import { rebrand } from "./SimpleSections";

const FIXED: BottomNavItem[] = ["map", "menu"];

export const MenuConfigSection = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useSettings();
    const [config, setConfig] = useState<BottomNavItem[]>(settings.bottomNav);
    const [selected, setSelected] = useState<BottomNavItem | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const available = (Object.keys(NAV_ENTRIES) as BottomNavItem[]).filter((key) => !config.includes(key) && !FIXED.includes(key));
    const dirty = JSON.stringify(config) !== JSON.stringify(settings.bottomNav);
    const isDefault = JSON.stringify(settings.bottomNav) === JSON.stringify(DEFAULT_BOTTOM_NAV);

    const replace = (key: BottomNavItem) => {
        if (!selected || FIXED.includes(key)) return;
        setConfig(config.map((item) => (item === key ? selected : item)));
        setSelected(null);
        setMessage(null);
    };

    return (
        <div>
            <Typography variant="h3" gutterBottom>
                {t("settings.menuConfigPageTitle")}
            </Typography>
            <Typography variant="body1" gutterBottom>
                <strong>{rebrand(t("settings.menuConfigPart1"))}</strong>
            </Typography>
            <Divider sx={{ my: 3 }} />

            <Typography variant="h4" gutterBottom>
                {t("settings.menuConfigPart3")}
            </Typography>
            <Typography variant="body1" gutterBottom>
                {t("settings.menuConfigPart4")}
            </Typography>
            <Grid container spacing={1} sx={{ p: "10px" }}>
                {available.map((key) => {
                    const entry = NAV_ENTRIES[key];
                    const active = selected === key;
                    return (
                        <Grid
                            key={key}
                            size={{ xs: 4, sm: 3, md: 2 }}
                            onClick={() => setSelected(active ? null : key)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                flexDirection: "column",
                                textAlign: "center",
                                cursor: "pointer",
                                color: active ? "var(--primary)" : "var(--default-text)",
                                borderRadius: 2,
                                py: 1,
                                outline: active ? "2px solid var(--primary)" : "none",
                            }}
                        >
                            <Box sx={{ p: 1, display: "flex" }}>
                                {active ? (
                                    <Badge color="primary" badgeContent={<AutorenewIcon sx={{ fontSize: 12 }} />}>
                                        {entry.icon}
                                    </Badge>
                                ) : (
                                    entry.icon
                                )}
                            </Box>
                            <Typography variant="caption">{t(entry.titleKey)}</Typography>
                        </Grid>
                    );
                })}
                {!available.length && (
                    <Typography variant="body2" color="text.secondary">
                        {t("global.nothingFound")}
                    </Typography>
                )}
            </Grid>
            <Divider sx={{ my: 3 }} />

            <Typography variant="h4" gutterBottom>
                {t("settings.menuConfigPart5")}
            </Typography>
            <Typography variant="body1" gutterBottom>
                {t("settings.menuConfigPart6")}
            </Typography>
            <BottomNavigation showLabels sx={{ position: "relative", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                {config.map((key) => {
                    const entry = NAV_ENTRIES[key];
                    const replaceable = !FIXED.includes(key);
                    return (
                        <BottomNavigationAction
                            key={key}
                            label={t(entry.titleKey)}
                            disabled={!replaceable || !selected}
                            onClick={() => replace(key)}
                            sx={{ minWidth: 0, px: 0.5, opacity: !replaceable ? 0.5 : 1 }}
                            icon={
                                selected && replaceable ? (
                                    <Badge color="secondary" badgeContent={<AutorenewIcon sx={{ fontSize: 12 }} />}>
                                        {entry.icon}
                                    </Badge>
                                ) : (
                                    entry.icon
                                )
                            }
                        />
                    );
                })}
            </BottomNavigation>
            <Divider sx={{ my: 3 }} />

            <Button
                variant="contained"
                fullWidth
                size="small"
                disabled={!dirty}
                onClick={() => {
                    setSettings({ bottomNav: config });
                    setMessage({ type: "success", text: `${t("global.saved")}!` });
                }}
            >
                {t("global.save")}
            </Button>
            {!isDefault && (
                <Button
                    sx={{ mt: 3 }}
                    color="error"
                    variant="outlined"
                    fullWidth
                    size="small"
                    onClick={() => {
                        setSettings({ bottomNav: DEFAULT_BOTTOM_NAV });
                        setConfig(DEFAULT_BOTTOM_NAV);
                        setSelected(null);
                        setMessage({ type: "success", text: `${t("global.restored")}!` });
                    }}
                >
                    {t("global.restoreDefault")}
                </Button>
            )}
            {message && (
                <Alert severity={message.type} sx={{ mt: 2 }}>
                    {message.text}
                </Alert>
            )}
        </div>
    );
};
