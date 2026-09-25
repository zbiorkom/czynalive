import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BarChartIcon from "@mui/icons-material/BarChart";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MapIcon from "@mui/icons-material/Map";
import MenuIcon from "@mui/icons-material/Menu";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TimerIcon from "@mui/icons-material/Timer";
import type { ReactNode } from "react";
import type { BottomNavItem } from "@/store/settings";

export type NavEntry = { key: BottomNavItem; titleKey: string; menuTitleKey: string; icon: ReactNode; path: (city: string) => string };

export const NAV_ENTRIES: Record<BottomNavItem, NavEntry> = {
    favourites: { key: "favourites", titleKey: "favourites.favourites", menuTitleKey: "favourites.favourites", icon: <FavoriteIcon />, path: (c) => `/${c}/ulubione` },
    alerts: { key: "alerts", titleKey: "alerts.alerts", menuTitleKey: "alerts.alerts", icon: <ReportProblemIcon />, path: (c) => `/${c}/komunikaty` },
    map: { key: "map", titleKey: "map.map", menuTitleKey: "map.map", icon: <MapIcon />, path: (c) => `/${c}` },
    timetable: { key: "timetable", titleKey: "timetables.timetables", menuTitleKey: "timetables.timetable", icon: <AccessTimeIcon />, path: (c) => `/${c}/rozklad-jazdy` },
    menu: { key: "menu", titleKey: "Menu", menuTitleKey: "Menu", icon: <MenuIcon />, path: () => "/ustawienia" },
    brigades: { key: "brigades", titleKey: "brigadeScheduleList.brigadeScheduleBottomNav", menuTitleKey: "brigadeScheduleList.brigadeSchedule", icon: <DirectionsBusIcon />, path: (c) => `/${c}/rozklad-jazdy-brygady` },
    delays: { key: "delays", titleKey: "delays.delays", menuTitleKey: "delays.delays", icon: <TimerIcon />, path: (c) => `/${c}/opoznienia-autobusy-tramwaje` },
    stats: { key: "stats", titleKey: "stats.stats", menuTitleKey: "stats.stats", icon: <BarChartIcon />, path: (c) => `/${c}/statystyki` },
    cancelled: { key: "cancelled", titleKey: "cancelledTrips.title", menuTitleKey: "cancelledTrips.title", icon: <EventBusyIcon />, path: (c) => `/${c}/odwolane-kursy` },
};
