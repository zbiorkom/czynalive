import { Box, Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { MenuItem } from "./menu";

export const MenuGrid = ({ items }: { items: MenuItem[] }) => {
    const { t } = useTranslation();
    return (
        <Grid container spacing={1} sx={{ p: "10px", alignItems: "stretch", justifyContent: "flex-start" }}>
            {items.map((item) => (
                <Grid
                    key={item.url}
                    size={{ xs: 4, sm: 3, md: 2 }}
                    component={Link}
                    to={item.url}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        gap: 0.5,
                        textAlign: "center",
                        textDecoration: "none",
                        color: "var(--default-text)",
                        borderRadius: 2,
                        py: 1,
                        "&:hover": { background: "action.hover" },
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", p: 1, color: "inherit", "& svg": { fontSize: 24 } }}>{item.icon}</Box>
                    <Typography variant="caption" sx={{ lineHeight: 1.25 }}>
                        {t(item.titleKey)}
                    </Typography>
                </Grid>
            ))}
        </Grid>
    );
};
