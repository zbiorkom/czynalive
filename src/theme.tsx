import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { plPL } from "@mui/material/locale";
import { useEffect, useMemo, type ReactNode } from "react";
import { useSettings } from "./store/settings";

const shared = {
    shape: { borderRadius: 4 },
    typography: {
        fontFamily: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"].join(","),
        h1: { fontSize: "1.6rem", fontWeight: 700 },
        h2: { fontSize: "1.35rem", fontWeight: 700 },
        h3: { fontSize: "1.15rem", fontWeight: 500 },
        h4: { fontSize: "1rem", fontWeight: 500 },
    },
    components: {
        MuiModal: { defaultProps: { disableEnforceFocus: true } },
        MuiPaper: { styleOverrides: { rounded: { borderRadius: 8 } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 8 }, paperFullScreen: { borderRadius: 0 } } },
        MuiCard: { styleOverrides: { root: { borderRadius: 8 } } },
    },
} as const;

const status = {
    success: { main: "#29a847" },
    error: { main: "#d32f2f" },
    warning: { main: "#ed6c02" },
    info: { main: "#0288d1" },
};

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
    const [settings] = useSettings();
    const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const mode = settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", mode);
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mode === "dark" ? "#121212" : "#29a847");
    }, [mode]);

    const theme = useMemo(
        () =>
            createTheme(
                mode === "dark"
                    ? {
                          ...shared,
                          palette: {
                              mode: "dark",
                              primary: { main: "#0e8616" },
                              secondary: { main: "#a30544" },
                              ...status,
                              background: { default: "#121212", paper: "#121212" },
                              text: { primary: "rgba(255, 255, 255, 0.7)", secondary: "rgba(255, 255, 255, 0.5)" },
                              action: { active: "rgba(255, 255, 255, 0.7)" },
                          },
                      }
                    : {
                          ...shared,
                          palette: { mode: "light", primary: { main: "#29a847" }, secondary: { main: "#b92d70" }, ...status },
                      },
                plPL,
            ),
        [mode],
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};
