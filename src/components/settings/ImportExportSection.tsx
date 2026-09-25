import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { rebrand } from "./SimpleSections";

const PREFIX = "czynalive:";
const SKIPPED = new Set(["czynalive:cities"]);

type Backup = { app: "czynalive"; version: 1; exportedAt: string; data: Record<string, string> };

export const ImportExportSection = () => {
    const { t } = useTranslation();
    const input = useRef<HTMLInputElement | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

    const exportData = () => {
        try {
            const data: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(PREFIX) && !SKIPPED.has(key)) data[key] = localStorage.getItem(key) ?? "";
            }
            const backup: Backup = { app: "czynalive", version: 1, exportedAt: new Date().toISOString(), data };
            const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = `czynalive-ustawienia-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setMessage({ type: "success", text: t("settings.exportSuccess") });
        } catch {
            setMessage({ type: "error", text: t("settings.exportError") });
        }
    };

    const importData = async (file: File) => {
        try {
            const backup = JSON.parse(await file.text()) as Partial<Backup>;
            if (backup?.app !== "czynalive" || !backup.data || typeof backup.data !== "object") {
                setMessage({ type: "error", text: rebrand(t("settings.importValidationError")) });
                return;
            }
            const entries = Object.entries(backup.data).filter(([key, value]) => key.startsWith(PREFIX) && typeof value === "string");
            if (!entries.length) {
                setMessage({ type: "error", text: rebrand(t("settings.importValidationError")) });
                return;
            }
            for (const [key, value] of entries) localStorage.setItem(key, value);
            setMessage({ type: "success", text: t("settings.importSuccess") });
            setTimeout(() => window.location.reload(), 3000);
        } catch {
            setMessage({ type: "error", text: t("settings.importError") });
        }
    };

    return (
        <div>
            <Typography variant="h3" gutterBottom>
                {t("settings.importExportTitle")}
            </Typography>
            <Typography variant="body1" gutterBottom>
                {t("settings.importExportInfoPart1")}
            </Typography>
            <Alert severity="warning" sx={{ my: 2 }}>
                {t("settings.importExportWarning")}
            </Alert>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h4" gutterBottom>
                {t("settings.exportSettings")}
            </Typography>
            <Typography variant="body2" gutterBottom>
                {t("settings.exportDescription")}
            </Typography>
            <Button variant="contained" fullWidth startIcon={<DownloadIcon />} onClick={exportData}>
                {t("settings.exportButton")}
            </Button>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h4" gutterBottom>
                {t("settings.importSettings")}
            </Typography>
            <Typography variant="body2" gutterBottom>
                {t("settings.importDescription")}
            </Typography>
            <Box>
                <input
                    ref={input}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) importData(file);
                        event.target.value = "";
                    }}
                />
                <Button variant="outlined" fullWidth startIcon={<UploadFileIcon />} onClick={() => input.current?.click()}>
                    {t("settings.selectFileToImport")}
                </Button>
            </Box>
            {message && (
                <Alert severity={message.type} sx={{ mt: 2 }}>
                    {message.text}
                </Alert>
            )}
        </div>
    );
};
