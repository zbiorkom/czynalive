import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Props = { title: ReactNode; back?: string | true; actions?: ReactNode; documentTitle?: string };

export const PageHeader = ({ title, back, actions, documentTitle }: Props) => {
    const navigate = useNavigate();

    useEffect(() => {
        const text = documentTitle ?? (typeof title === "string" ? title : undefined);
        if (text) document.title = `${text} - Czynalive`;
    }, [documentTitle, title]);

    return (
        <AppBar position="sticky" color="primary" elevation={1}>
            <Toolbar variant="dense" sx={{ gap: 1 }}>
                {back && (
                    <IconButton edge="start" color="inherit" onClick={() => (back === true ? navigate(-1) : navigate(back))} aria-label="Wstecz">
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <Typography variant="h3" component="h1" sx={{ flex: 1, color: "inherit !important", fontSize: "1.1rem !important" }} noWrap>
                    {title}
                </Typography>
                {actions}
            </Toolbar>
        </AppBar>
    );
};
