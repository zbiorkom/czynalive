import { Alert, Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";

export const DISPLAY_FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

export type DisplayScheme = { headerBackground: string; headerText: string; text: string; secondaryBackground: string; secondaryText: string };

const SCHEMES: Record<string, DisplayScheme> = {
    default: { headerBackground: "#29a847", headerText: "#FFF", text: "#000", secondaryBackground: "#38913E", secondaryText: "#FFF" },
    wroclaw: { headerBackground: "#2C578C", headerText: "#FFF", text: "#000", secondaryBackground: "#366db1", secondaryText: "#FFF" },
    gzm: { headerBackground: "#FCD900", headerText: "#000", text: "#000", secondaryBackground: "#424242", secondaryText: "#FFF" },
    poznan: { headerBackground: "#FFF", headerText: "#1A1A1A", text: "#1A1A1A", secondaryBackground: "#ffca22", secondaryText: "#1A1A1A" },
    kielce: { headerBackground: "#2C578C", headerText: "#FFF", text: "#000", secondaryBackground: "#366db1", secondaryText: "#FFF" },
};

export const useDisplayScheme = (city: string): DisplayScheme => {
    const theme = useTheme();
    const scheme = SCHEMES[city.toLowerCase()] ?? SCHEMES.default;
    return theme.palette.mode === "dark" ? { ...scheme, text: theme.palette.text.primary } : scheme;
};

// Large board sizes scale with the viewport so a phone and a TV both work.
export const SIZE = {
    displayLg: "clamp(1.6rem, 7vw, 6rem)",
    displayMd: "clamp(1.4rem, 5.2vw, 4rem)",
    displaySm: "clamp(1.5rem, 4.5vw, 3.5rem)",
    h1: "clamp(1.4rem, 3.6vw, 3rem)",
    h2: "clamp(1.3rem, 3vw, 2.5rem)",
    h3: "clamp(1.1rem, 2.6vw, 2rem)",
};

export const useClock = (intervalMs = 1000) => {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);
    return now;
};

export const DisplayFooter = ({ fixed = false }: { fixed?: boolean }) => (
    <Box
        sx={{
            position: fixed ? "fixed" : "relative",
            flexShrink: 0,
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            p: { xs: 1.5, md: 3 },
            borderTop: "2px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            backgroundColor: "background.paper",
            zIndex: 1000,
            lineHeight: 1,
        }}
    >
        <Typography sx={{ fontWeight: 900, fontFamily: DISPLAY_FONT, fontSize: "clamp(1rem, 2.4vw, 1.8rem) !important" }}>Napędzane przez Czynalive</Typography>
    </Box>
);

export const DisplayHeader = ({ scheme, withTime = true, now, timeZone = "Europe/Warsaw", children }: { scheme: DisplayScheme; withTime?: boolean; now: Date; timeZone?: string; children: ReactNode }) => {
    const theme = useTheme();
    return (
        <Box
            sx={{
                position: "relative",
                flexShrink: 0,
                zIndex: 1100,
                textAlign: "center",
                p: { xs: 1.5, md: 3 },
                pb: withTime ? 1 : { xs: 1.5, md: 3 },
                backgroundColor: scheme.headerBackground,
                color: scheme.headerText,
                boxShadow: withTime ? 0 : 4,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: { xs: 1.5, md: 3 }, flexWrap: "nowrap" }}>{children}</Box>
            {withTime && (
                <Box
                    sx={{
                        mt: 2,
                        textAlign: "center",
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(39, 39, 39, 0.95)" : "rgba(255, 255, 255, 0.95)",
                        p: "8px 16px",
                        borderBottom: "2px solid",
                        borderColor: "divider",
                        mx: { xs: -1.5, md: -3 },
                        mb: -1,
                    }}
                >
                    <Typography sx={{ fontWeight: 900, fontSize: `${SIZE.h3} !important`, fontFamily: DISPLAY_FONT, color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                        {new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone }).format(now)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export const DisplayMessage = ({ severity, lines, loading }: { severity?: "error" | "info" | "warning"; lines: string[]; loading?: boolean }) => (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 3, backgroundColor: "background.default", textAlign: "center" }}>
        {loading ? (
            <>
                <CircularProgress size={60} />
                {lines.map((line, index) => (
                    <Typography
                        key={line}
                        color={index ? "textSecondary" : undefined}
                        sx={{ mt: index ? 1 : 3, fontFamily: DISPLAY_FONT, fontWeight: index ? 700 : 800, fontSize: `${SIZE.h1} !important` }}
                    >
                        {line}
                    </Typography>
                ))}
            </>
        ) : (
            <Alert severity={severity ?? "error"} icon={false}>
                {lines.map((line, index) => (
                    <Typography key={line} sx={{ fontFamily: DISPLAY_FONT, fontWeight: index ? 700 : 800, fontSize: `${SIZE.h1} !important` }}>
                        {line}
                    </Typography>
                ))}
            </Alert>
        )}
        <DisplayFooter fixed />
    </Box>
);
