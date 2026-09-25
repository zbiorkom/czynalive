import { Box, Card, CardHeader, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ERouteTuple } from "@/api/types";
import { useFavourites } from "@/store/favourites";
import { fromNow, type CityAlert } from "./api";
import { RouteChips } from "./RouteChips";

export const useAffectsFavourite = (city: string, alert: CityAlert | undefined) => {
    const { favourites } = useFavourites(city);
    if (!alert || alert.routes.length === 0) return false;
    const ids = new Set(alert.routes.map((route) => route[ERouteTuple.routeId]));
    return favourites.routes.some((route) => ids.has(route.id));
};

export const AffectedFavouriteLine = () => {
    const { t } = useTranslation();
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="caption" className="text-primary" sx={{ fontStyle: "italic", p: "5px", fontWeight: 500 }}>
                {t("alerts.affectedFavouriteLine")}
            </Typography>
        </Box>
    );
};

export const AlertCard = ({ city, alert, history }: { city: string; alert: CityAlert; history?: boolean }) => {
    const { t } = useTranslation();
    const favourite = useAffectsFavourite(city, alert);
    const published = alert.publishedAt ?? alert.activeFrom;

    return (
        <Card variant="outlined" className={favourite ? "border-primary" : ""} sx={{ mt: "10px", borderRadius: "8px" }}>
            <Link
                to={`/${city}/komunikaty/komunikat?id=${encodeURIComponent(alert.id)}`}
                state={{ alertId: alert.id, fromHistory: history }}
                style={{ textDecoration: "initial", color: "var(--default-text)", display: "block" }}
            >
                {favourite && <AffectedFavouriteLine />}
                <CardHeader
                    sx={{ pt: favourite ? 0 : undefined }}
                    disableTypography
                    title={
                        <Typography variant="h5" sx={{ wordBreak: "break-word", fontSize: "1.2rem", fontWeight: 500, mb: 0.5 }}>
                            {alert.title}
                        </Typography>
                    }
                    subheader={
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                            {published !== null && (
                                <Typography variant="caption" color="gray">
                                    {t("global.published")}: <u>{fromNow(published)}</u>
                                </Typography>
                            )}
                            {(alert.activeFrom !== null || alert.activeUntil !== null) && (
                                <Typography variant="caption">
                                    <strong>{t("alerts.valid")}:</strong>
                                    {alert.activeFrom !== null && (
                                        <>
                                            {" "}
                                            {t("global.from").toLowerCase()} <u>{fromNow(alert.activeFrom)}</u>
                                        </>
                                    )}
                                    {alert.activeUntil !== null && (
                                        <>
                                            {" "}
                                            {t("global.to").toLowerCase()} <u>{fromNow(alert.activeUntil)}</u>
                                        </>
                                    )}
                                </Typography>
                            )}
                            {alert.detected && (
                                <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                                    Utrudnienie wykryte automatycznie na podstawie pozycji pojazdów
                                </Typography>
                            )}
                            {alert.routes.length > 0 && (
                                <Box sx={{ mt: 0.5 }}>
                                    <RouteChips routes={alert.routes} mode="preview" />
                                </Box>
                            )}
                        </Box>
                    }
                />
            </Link>
        </Card>
    );
};
