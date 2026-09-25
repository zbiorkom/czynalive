import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, Dialog, DialogActions, DialogContent, Divider, IconButton, InputAdornment, Slide, TextField, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef, useState, type ReactElement, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { setShowSearch, useShell } from "@/lib/shell";

const SlideUp = forwardRef(function SlideUp(props: TransitionProps & { children: ReactElement }, ref: Ref<unknown>) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Global search opened from the top bar lupa (original: full-screen dialog). Results are owned by the map area.
export default function GlobalSearch() {
    const { t } = useTranslation();
    const open = useShell((shell) => shell.showSearch);
    const [query, setQuery] = useState("");
    const close = () => setShowSearch(false);

    return (
        <Dialog open={open} onClose={close} scroll="paper" style={{ overflowX: "hidden" }} fullScreen slots={{ transition: SlideUp }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" style={{ padding: "4px 10px" }}>
                    {t("search.search")}
                </Typography>
                <IconButton onClick={close} size="large">
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent dividers style={{ padding: "0 5px 16px 5px", overflowY: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ flexShrink: 0 }}>
                    <form autoComplete="off" noValidate onSubmit={(event) => event.preventDefault()}>
                        <TextField
                            autoFocus
                            label={t("search.search")}
                            placeholder={t("search.searchPlaceholder1")}
                            margin="normal"
                            type="search"
                            value={query}
                            variant="outlined"
                            onChange={(event) => setQuery(event.target.value)}
                            size="small"
                            fullWidth
                            sx={{ mb: 0 }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton type="submit" edge="end" size="large">
                                                <SearchIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                                inputLabel: { shrink: true },
                            }}
                        />
                    </form>
                    <Divider sx={{ opacity: 0.6 }} />
                </div>
            </DialogContent>
            <DialogActions style={{ justifyContent: "flex-end", paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0))" }}>
                <Button onClick={close} className="text-default-text">
                    {t("global.close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
