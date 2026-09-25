import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import BarChartIcon from "@mui/icons-material/BarChart";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DepartureBoardIcon from "@mui/icons-material/DepartureBoard";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import InfoIcon from "@mui/icons-material/Info";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import LightModeIcon from "@mui/icons-material/LightMode";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import MapIcon from "@mui/icons-material/Map";
import MenuIcon from "@mui/icons-material/Menu";
import PinDropIcon from "@mui/icons-material/PinDrop";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SystemUpdateIcon from "@mui/icons-material/SystemUpdate";
import TimerIcon from "@mui/icons-material/Timer";
import TranslateIcon from "@mui/icons-material/Translate";
import WhereToVoteIcon from "@mui/icons-material/WhereToVote";
import type { ReactNode } from "react";

export type MenuItem = { url: string; icon: ReactNode; titleKey: string };

export const cityMenu = (city: string): MenuItem[] => [
    { url: `/${city}`, icon: <MapIcon />, titleKey: "map.map" },
    { url: `/${city}/ulubione`, icon: <FavoriteIcon />, titleKey: "favourites.favourites" },
    { url: `/${city}/komunikaty`, icon: <ReportProblemIcon />, titleKey: "alerts.alerts" },
    { url: `/${city}/rozklad-jazdy`, icon: <AccessTimeIcon />, titleKey: "timetables.timetable" },
    { url: `/${city}/opoznienia-autobusy-tramwaje`, icon: <TimerIcon />, titleKey: "delays.delays" },
    { url: `/${city}/rozklad-jazdy-brygady`, icon: <DirectionsBusIcon />, titleKey: "brigadeScheduleList.brigadeSchedule" },
    { url: `/${city}/laczony-rozklad-jazdy-brygady`, icon: <AltRouteIcon />, titleKey: "brigadeScheduleList.brigadeScheduleMulti" },
    { url: `/${city}/statystyki`, icon: <BarChartIcon />, titleKey: "stats.stats" },
    { url: "/opoznienia-ranking-miasta-autobusy-tramwaje", icon: <LeaderboardIcon />, titleKey: "allCitiesDelays.menuTitle" },
    { url: `/${city}/odwolane-kursy`, icon: <EventBusyIcon />, titleKey: "cancelledTrips.menuTitle" },
];

export const PREFERENCES_MENU: MenuItem[] = [
    { url: "/miasto", icon: <LocationCityIcon />, titleKey: "chooseCity.city" },
    { url: "/ustawienia/lokalizacjastartowa", icon: <PinDropIcon />, titleKey: "settings.locationTitleShort" },
    { url: "/ustawienia/znaczniki-pojazdow", icon: <WhereToVoteIcon />, titleKey: "settings.markers" },
    { url: "/ustawienia/przystanek-odjazdy", icon: <DepartureBoardIcon />, titleKey: "settings.timetableSettings" },
    {
        url: "/ustawienia/wyglad-aplikacji",
        icon: (
            <>
                <LightModeIcon />
                <DarkModeIcon />
            </>
        ),
        titleKey: "settings.darkModeShortTitle",
    },
    { url: "/ustawienia/language", icon: <TranslateIcon />, titleKey: "changeLanguage.language" },
    { url: "/ustawienia/konfiguracja-menu", icon: <MenuIcon />, titleKey: "settings.menuConfigTitle" },
    { url: "/ustawienia/import-export-data", icon: <ImportExportIcon />, titleKey: "settings.importExportTitle" },
];

export const APP_MENU: MenuItem[] = [
    { url: "/o-aplikacji", icon: <InfoIcon />, titleKey: "settings.aboutApp" },
    { url: "/ustawienia/aktualizacja-aplikacji", icon: <SystemUpdateIcon />, titleKey: "settings.checkUpdate" },
    { url: "/ustawienia/instalacja", icon: <InstallMobileIcon />, titleKey: "settings.appInstallation" },
];
