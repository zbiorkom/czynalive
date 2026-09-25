import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, Dialog, DialogActions, DialogContent, Divider, IconButton, InputAdornment, Slide, TextField, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef, useMemo, useState, type ReactElement, type Ref } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ShowMoreButton } from "@/components/ShowMoreButton";
import { setShowSearch, useShell } from "@/lib/shell";

const SlideUp = forwardRef(function SlideUp(props: TransitionProps & { children: ReactElement }, ref: Ref<unknown>) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const PLACEHOLDERS = ["search.searchPlaceholder1", "search.searchPlaceholder2", "search.searchPlaceholder3", "search.searchPlaceholder4", "search.searchPlaceholder5"];
const IS_MOBILE = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

const HowToUse = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    return (
        <Box>
            <Typography variant="subtitle2" style={{ margin: "10px 0 5px" }}>
                {t("search.howToUse")}
                <ShowMoreButton expanded={open} onClick={() => setOpen((value) => !value)} />
            </Typography>
            {open && (
                <ul>
                    {[1, 2, 3, 4].map((part) => (
                        <li key={part}>
                            <Typography variant="body2" style={{ margin: "10px 0 5px" }}>
                                <Trans i18nKey={`search.searchInstructionPart${part}`} components={[<strong key="1" />]} />
                            </Typography>
                        </li>
                    ))}
                </ul>
            )}
        </Box>
    );
};

// Global search opened from the top bar lupa (original: full-screen dialog). Results are owned by the map area.
export default function GlobalSearch() {
    const { t } = useTranslation();
    const open = useShell((shell) => shell.showSearch);
    const [query, setQuery] = useState("");
    const close = () => setShowSearch(false);
    const placeholder = useMemo(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)], []);

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
                    <HowToUse />
                    <form autoComplete="off" noValidate onSubmit={(event) => event.preventDefault()}>
                        <TextField
                            autoFocus={!IS_MOBILE}
                            label={t("search.search")}
                            placeholder={t(placeholder)}
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
