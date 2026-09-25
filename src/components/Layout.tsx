import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV_ENTRIES } from "@/lib/navigation";
import { useSettings } from "@/store/settings";

export const Layout = () => {
    const [settings] = useSettings();
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const city = settings.city ?? "";

    const entries = settings.bottomNav.map((key) => NAV_ENTRIES[key]).filter(Boolean);
    const paths = entries.map((entry) => entry.path(city));
    let active = -1;
    let bestLength = -1;
    paths.forEach((path, index) => {
        const matches = location.pathname === path || location.pathname.startsWith(path + "/");
        if (matches && path.length > bestLength) {
            active = index;
            bestLength = path.length;
        }
    });
    if (active === -1 && location.pathname.startsWith("/ustawienia")) active = settings.bottomNav.indexOf("menu");

    const isMap = !!city && location.pathname === `/${city}`;

    return (
        <div className="app-root">
            <main className={isMap ? "app-content fullscreen" : "app-content"}>
                <Outlet />
            </main>
            <Paper elevation={3} square className="safe-area-bottom" sx={{ zIndex: 1100 }}>
                <BottomNavigation showLabels value={active} onChange={(_, index) => navigate(paths[index])}>
                    {entries.map((entry) => (
                        <BottomNavigationAction key={entry.key} label={t(entry.titleKey)} icon={entry.icon} sx={{ minWidth: 0, px: 0.5 }} />
                    ))}
                </BottomNavigation>
            </Paper>
        </div>
    );
};
