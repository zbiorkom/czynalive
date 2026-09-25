import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Alert, AlertTitle, Box, Collapse, IconButton, Link as MuiLink, Typography } from "@mui/material";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { EAlertTuple, type AlertTuple } from "@/api/types";

const plainText = (markdown: string) => markdown.replace(/\*\*|__|#+\s|\[([^\]]+)\]\([^)]+\)/g, (match, text) => text ?? "").trim();

export const RouteAlerts = ({ alerts, routeName, title }: { alerts: AlertTuple[]; routeName: string; title?: string }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
    if (!alerts.length) return null;
    return (
        <Alert
            severity="warning"
            sx={{ my: 2, py: 0, cursor: "pointer", "& .MuiAlert-message": { width: "100%" } }}
            onClick={() => setOpen((value) => !value)}
            action={
                <IconButton size="small" onClick={() => setOpen((value) => !value)}>
                    {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            }
        >
            <AlertTitle sx={{ mt: 0.75 }}>
                {title ?? t("timetables.alerts")} ({alerts.length})
            </AlertTitle>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Typography variant="body1" gutterBottom>
                    <Trans i18nKey="timetables.alertsHeader" values={{ route_id: routeName }} components={[<strong key="1" />]} />
                </Typography>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {alerts.map((alert, index) => (
                        <li key={`${alert[EAlertTuple.title]}-${index}`} style={{ marginTop: 10 }} onClick={(event) => event.stopPropagation()}>
                            <MuiLink component="button" variant="body2" sx={{ textAlign: "left" }} onClick={() => setExpandedAlert((value) => (value === index ? null : index))}>
                                {alert[EAlertTuple.title] || plainText(alert[EAlertTuple.description]).slice(0, 80)}
                            </MuiLink>
                            <Collapse in={expandedAlert === index}>
                                <Box sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" component="div" sx={{ whiteSpace: "pre-wrap" }}>
                                        {plainText(alert[EAlertTuple.description])}
                                    </Typography>
                                    {alert[EAlertTuple.url] && (
                                        <MuiLink href={alert[EAlertTuple.url]} target="_blank" rel="noopener noreferrer" variant="caption">
                                            {t("alerts.source")}
                                        </MuiLink>
                                    )}
                                </Box>
                            </Collapse>
                        </li>
                    ))}
                </ul>
            </Collapse>
        </Alert>
    );
};
