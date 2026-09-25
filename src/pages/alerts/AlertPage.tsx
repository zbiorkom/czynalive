import { Box, Breadcrumbs, Chip, Divider, Link as MuiLink, Skeleton, Typography } from "@mui/material";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCity } from "@/api/cities";
import { EStopTuple } from "@/api/types";
import { AffectedFavouriteLine, useAffectsFavourite } from "@/components/alerts/AlertCard";
import { formatDateTime, fromNow, type CityAlert } from "@/components/alerts/api";
import { Markdown } from "@/components/alerts/Markdown";
import { RouteChips } from "@/components/alerts/RouteChips";
import { ShareButton } from "@/components/alerts/ShareButton";
import { DataError, useCityAlerts } from "@/components/alerts/shared";
import { PageHeader } from "@/components/PageHeader";

const DateRow = ({ header, date }: { header: string; date: number }) => (
    <Typography variant="caption">
        <strong>{header}: </strong>
        <span>
            {fromNow(date)}, {formatDateTime(date)}
        </span>
    </Typography>
);

const AlertDetails = ({ city, alert }: { city: string; alert: CityAlert }) => {
    const { t } = useTranslation();
    const cityInfo = useCity(city);
    const favourite = useAffectsFavourite(city, alert);
    const cityName = cityInfo?.name ?? city;
    const published = alert.publishedAt ?? alert.activeFrom;
    const expired = alert.activeUntil !== null && alert.activeUntil < Date.now();

    return (
        <Box sx={{ pb: "120px" }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ pb: "20px" }}>
                <Typography variant="caption">
                    <MuiLink component={Link} color="primary" to={`/${city}/komunikaty`} underline="hover">
                        {cityName} {t("alerts.alerts")}
                    </MuiLink>
                </Typography>
                {expired && (
                    <Typography variant="caption">
                        <MuiLink component={Link} color="primary" to={`/${city}/komunikaty/historia/${alert.kind}/1`} underline="hover">
                            {t("alerts.alertsHistory")}
                        </MuiLink>
                    </Typography>
                )}
                <Typography variant="caption" color="textPrimary">
                    {alert.title}
                </Typography>
            </Breadcrumbs>
            <main>
                <article>
                    <header>
                        <Typography variant="h3" sx={{ wordBreak: "break-word", fontSize: "1.6rem", fontWeight: 500, mb: 1 }}>
                            {alert.title}
                        </Typography>
                    </header>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {alert.activeFrom !== null && <DateRow header={t("alerts.validFrom")} date={alert.activeFrom} />}
                        {alert.activeUntil !== null && <DateRow header={t("alerts.validTo")} date={alert.activeUntil} />}
                        {published !== null && <DateRow header={t("global.published")} date={published} />}
                        {alert.routes.length > 0 && (
                            <Box sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.5, my: 0.5 }}>
                                <Typography variant="caption" sx={{ flexShrink: 0 }}>
                                    <strong>{t("alerts.affectsLines")}: </strong>
                                </Typography>
                                <RouteChips routes={alert.routes} mode="all" previewLength={12} linked />
                            </Box>
                        )}
                        {alert.stops.length > 0 && (
                            <Box sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.5, my: 0.5 }}>
                                <Typography variant="caption" sx={{ flexShrink: 0 }}>
                                    <strong>Dotyczy przystanków: </strong>
                                </Typography>
                                <Box sx={{ display: "inline-flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {alert.stops.map((stop) => (
                                        <Chip
                                            key={stop[EStopTuple.stopId]}
                                            size="small"
                                            variant="outlined"
                                            clickable
                                            component={Link}
                                            to={`/${stop[EStopTuple.city]}/rozklad-jazdy/przystanek/${encodeURIComponent(stop[EStopTuple.stopId])}`}
                                            label={`${stop[EStopTuple.stopName]}${stop[EStopTuple.stopCode] ? ` ${stop[EStopTuple.stopCode]}` : ""}`}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                        <Typography variant="caption">
                            <strong data-nosnippet>{t("global.shareUrl")}: </strong>
                            <ShareButton text={alert.title} />
                        </Typography>
                    </Box>
                    {favourite && <AffectedFavouriteLine />}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ wordBreak: "break-word", "& p": { my: 1.5 }, "& a": { color: "var(--primary)" } }}>
                        {alert.detected && (
                            <Typography variant="body2" sx={{ fontStyle: "italic", my: 1.5 }}>
                                Utrudnienie wykryte automatycznie na podstawie pozycji pojazdów — nie jest komunikatem przewoźnika.
                            </Typography>
                        )}
                        <Markdown source={alert.description} />
                    </Box>
                    {alert.url && (
                        <footer>
                            <address>
                                <div style={{ textAlign: "right" }}>
                                    <a href={alert.url} target="_blank" rel="nofollow noopener noreferrer" style={{ color: "var(--primary)" }}>
                                        {t("alerts.source")}
                                    </a>
                                </div>
                            </address>
                        </footer>
                    )}
                </article>
            </main>
        </Box>
    );
};

export default function AlertPage() {
    const { city = "" } = useParams();
    const [params] = useSearchParams();
    const id = params.get("id");
    const cityInfo = useCity(city);
    const { t } = useTranslation();
    const { data, error, loading } = useCityAlerts(city);
    const alert = data?.alerts.find((entry) => entry.id === id);

    useEffect(() => {
        document.querySelector(".app-content")?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <>
            <PageHeader
                title={`${cityInfo?.name ?? city} - ${t("alerts.pageTitleAlerts")}`}
                documentTitle={alert ? `${cityInfo?.name ?? city} - ${alert.title}` : undefined}
                back={`/${city}/komunikaty`}
            />
            <div className="page">
                {error && !data ? (
                    <DataError error={error} />
                ) : loading && !data ? (
                    <>
                        <Skeleton animation="wave" variant="text" height={50} width="100%" style={{ margin: "0 5px 5px" }} />
                        <div style={{ margin: 10 }}>
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} animation="wave" variant="text" height={100} width="100%" style={{ marginBottom: 5 }} />
                            ))}
                        </div>
                    </>
                ) : !id || !alert ? (
                    <Box sx={{ my: 2 }}>
                        <Typography>Nie znaleziono komunikatu — mógł już wygasnąć.</Typography>
                        <MuiLink component={Link} to={`/${city}/komunikaty`} underline="hover">
                            {t("alerts.alerts")}
                        </MuiLink>
                    </Box>
                ) : (
                    <AlertDetails city={city} alert={alert} />
                )}
            </div>
        </>
    );
}
