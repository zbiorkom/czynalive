import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { ImportExportSection } from "@/components/settings/ImportExportSection";
import { InstallSection } from "@/components/settings/InstallSection";
import { MarkersSection } from "@/components/settings/MarkersSection";
import { MenuConfigSection } from "@/components/settings/MenuConfigSection";
import { BusWifiSection, DeparturesSection, LanguageSection, ThemeSection, UpdateSection } from "@/components/settings/SimpleSections";
import { StartLocationSection } from "@/components/settings/StartLocationSection";

const SECTIONS: Record<string, { titleKey: string; render: () => ReactNode }> = {
    "wyglad-aplikacji": { titleKey: "settings.darkModeShortTitle", render: () => <ThemeSection /> },
    language: { titleKey: "changeLanguage.language", render: () => <LanguageSection /> },
    lokalizacjastartowa: { titleKey: "settings.locationTitleShort", render: () => <StartLocationSection /> },
    "znaczniki-pojazdow": { titleKey: "settings.markers", render: () => <MarkersSection /> },
    "przystanek-odjazdy": { titleKey: "settings.timetableSettings", render: () => <DeparturesSection /> },
    "konfiguracja-menu": { titleKey: "settings.menuConfigTitle", render: () => <MenuConfigSection /> },
    "aktualizacja-aplikacji": { titleKey: "settings.checkUpdate", render: () => <UpdateSection /> },
    "import-export-data": { titleKey: "settings.importExportTitle", render: () => <ImportExportSection /> },
    instalacja: { titleKey: "settings.appInstallation", render: () => <InstallSection /> },
    buswifi: { titleKey: "settings.busWifiPageTitle", render: () => <BusWifiSection /> },
};

export default function SettingsSubPage() {
    const { section = "" } = useParams();
    const { t } = useTranslation();
    const config = SECTIONS[section];
    if (!config) return <Navigate to="/ustawienia" replace />;

    return (
        <>
            <PageHeader title={t(config.titleKey).trim()} back="/ustawienia" />
            <div className="page">{config.render()}</div>
        </>
    );
}
