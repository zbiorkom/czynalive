import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import GpsOffIcon from "@mui/icons-material/GpsOff";
import ShareIcon from "@mui/icons-material/Share";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { Box, Chip, Menu, MenuItem, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ERouteTuple, ETripTuple, EVehiclePosition, StopDepartureStatus, type VehiclePositionDetailed } from "@/api/types";
import { RouteChip } from "@/components/departures/RouteChip";
import { BottomSheet } from "@/components/map/BottomSheet";
import { delayCssColor, delayToMinutes } from "@/components/map/markers";
import { shareLink } from "@/components/map/share";
import { AlertList, SheetIconButton, SheetToolbar, useToast } from "@/components/map/SheetParts";
import { TripProgress } from "@/components/trip/TripProgress";
import { TripStops } from "@/components/trip/TripStops";
import type { TripLiveState } from "@/components/trip/useTripLive";
import { parseVehicleId, routeColor } from "@/lib/transit";
import { useFavourites } from "@/store/favourites";
import { BrigadeTab } from "./BrigadeTab";
import { VehicleInfoTab } from "./VehicleInfoTab";

type Props = {
    city: string;
    vehicleId: string;
    live: TripLiveState;
    hasBack: boolean;
    onClose: () => void;
    onBack: () => void;
    onFitTrip: () => void;
    onFollow: () => void;
    onStopClick: (stopId: string, city: string) => void;
    onTripClick: (tripRef: string, city: string) => void;
    onHeightChange: (px: number, side: boolean) => void;
};

const useSecondsSince = (timestamp: number | undefined) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    return timestamp ? Math.max(0, Math.round((now - timestamp) / 1000)) : undefined;
};

export const VehicleSheet = ({ city, vehicleId, live, hasBack, onClose, onBack, onFitTrip, onFollow, onStopClick, onTripClick, onHeightChange }: Props) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [tab, setTab] = useState<"route" | "vehicle" | "brigade">("route");
    const [favouriteMenu, setFavouriteMenu] = useState<HTMLElement | null>(null);
    const { has, toggle } = useFavourites(city);
    const position = live.position;
    const route = position?.[EVehiclePosition.route] ?? live.trip?.[ETripTuple.route];
    const { number, type } = parseVehicleId(vehicleId);
    const brigade = position?.[EVehiclePosition.brigade] || live.trip?.[ETripTuple.brigade] || "";
    const timestamp = position && position.length > 6 ? (position as VehiclePositionDetailed)[EVehiclePosition.timestamp] : undefined;
    const seconds = useSecondsSince(timestamp);
    const color = route ? routeColor(route) : "var(--bus)";
    const stops = live.itinerary?.[0] ?? [];
    const sequence = live.sequence ?? 0;
    const current = live.stops?.[Math.min(sequence, (live.stops?.length ?? 1) - 1)];
    const currentPoint = current?.[sequence >= stops.length - 1 ? 0 : 1];
    const hasDelay = currentPoint && (currentPoint[2] === StopDepartureStatus.OnTrip || currentPoint[2] === StopDepartureStatus.OnPreviousTrip);
    const delayMinutes = hasDelay ? delayToMinutes(currentPoint[1]) : undefined;
    const routeId = route?.[ERouteTuple.routeId];
    const favouriteVehicle = has("vehicles", vehicleId);
    const favouriteRoute = routeId ? has("routes", routeId) : false;

    useEffect(() => setTab("route"), [vehicleId]);

    const share = async () => {
        const url = `${window.location.origin}/${city}?pojazd=${encodeURIComponent(vehicleId)}`;
        const result = await shareLink(t("global.vehicle"), t("vehicleDetails.shareDescription", { route_id: route?.[ERouteTuple.routeName] ?? "" }), url);
        if (result === "copied") toast.show(t("global.copied"));
    };

    const header = (
        <Box>
            {stops.length > 1 && <TripProgress color={color} fraction={Math.min(1, sequence / (stops.length - 1))} />}
            <SheetToolbar
                left={
                    <>
                        <SheetIconButton
                            title={t(favouriteVehicle || favouriteRoute ? "favourites.removeFromFavourites" : "favourites.addToFavourites")}
                            active={favouriteVehicle || favouriteRoute}
                            onClick={(event) => setFavouriteMenu(event.currentTarget)}
                        >
                            {favouriteVehicle || favouriteRoute ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </SheetIconButton>
                        <SheetIconButton title={t("global.share")} onClick={share}>
                            <ShareIcon fontSize="small" />
                        </SheetIconButton>
                    </>
                }
                right={
                    <>
                        <SheetIconButton title={t("global.zoomOut")} onClick={onFitTrip}>
                            <ZoomOutMapIcon fontSize="small" />
                        </SheetIconButton>
                        {hasBack && (
                            <SheetIconButton title="Wstecz" onClick={onBack}>
                                <ArrowBackIcon fontSize="small" />
                            </SheetIconButton>
                        )}
                        <SheetIconButton title={t("global.close")} onClick={onClose}>
                            <CloseIcon fontSize="small" />
                        </SheetIconButton>
                    </>
                }
            />
            <Menu anchorEl={favouriteMenu} open={!!favouriteMenu} onClose={() => setFavouriteMenu(null)}>
                <MenuItem disabled sx={{ opacity: "1 !important", fontSize: "0.85rem" }}>
                    {t("favourites.whatToAddToFavourites")}
                </MenuItem>
                {route && (
                    <MenuItem
                        onClick={() => {
                            toggle("routes", { id: route[ERouteTuple.routeId], name: route[ERouteTuple.routeName], type: route[ERouteTuple.routeType], color: routeColor(route) });
                            setFavouriteMenu(null);
                        }}
                    >
                        {favouriteRoute ? "✓ " : ""}
                        {t("favourites.line")} {route[ERouteTuple.routeName]}
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => {
                        toggle("vehicles", { id: vehicleId, name: number, type });
                        setFavouriteMenu(null);
                    }}
                >
                    {favouriteVehicle ? "✓ " : ""}
                    {t("favourites.vehicleNo")} {number}
                </MenuItem>
            </Menu>
            <Box sx={{ mx: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                    {route ? (
                        <Box onClick={onFollow} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, cursor: "pointer" }}>
                            <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} />
                            <Typography variant="body1" noWrap sx={{ fontWeight: 500 }}>
                                {live.trip?.[ETripTuple.headsign] ?? ""}
                            </Typography>
                        </Box>
                    ) : (
                        <Skeleton variant="text" width={160} height={32} />
                    )}
                    {seconds !== undefined && (
                        seconds > 120 ? (
                            <Chip size="small" className="bg-error" icon={<GpsOffIcon className="text-white" fontSize="small" />} label={<span className="text-white">{Math.floor(seconds / 60)}min {seconds % 60}s</span>} title={t("vehicleDetails.timeFromLastData")} />
                        ) : (
                            <Typography variant="body2" sx={{ display: "flex", gap: 0.5, alignItems: "center", flexShrink: 0 }} title={t("vehicleDetails.timeFromLastData")}>
                                <AccessTimeIcon fontSize="small" />
                                {seconds >= 60 ? `${Math.floor(seconds / 60)}min ${seconds % 60}s` : `${seconds}s ${t("stopDetails.ago")}`}
                            </Typography>
                        )
                    )}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: delayCssColor(delayMinutes) }}>
                        {delayMinutes === undefined
                            ? ""
                            : delayMinutes > 0
                              ? `${t("global.delayed")} +${delayMinutes} min`
                              : delayMinutes < 0
                                ? `${t("global.beforeTime")} ${delayMinutes} min`
                                : t("global.onTime")}
                    </Typography>
                    <Typography variant="body2">
                        {t("global.numberShort").toLowerCase()} {number || "-"}
                        {brigade ? `/${brigade}` : ""}
                    </Typography>
                </Box>
            </Box>
            <AlertList alerts={live.alerts} />
            {live.fatal && (
                <Typography variant="body2" sx={{ mx: 2, mb: 1 }} className="text-error">
                    {t("map.signalGpsLost")}
                </Typography>
            )}
            <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}>
                <Tab value="route" label={t("timetables.route")} />
                <Tab value="vehicle" label={t("global.vehicle")} />
                {brigade && routeId && <Tab value="brigade" label={t("brigadeSchedule.brigadeSchedule")} />}
            </Tabs>
        </Box>
    );

    return (
        <>
            <BottomSheet open header={header} onHeightChange={onHeightChange}>
                <Box sx={{ ml: 1, mr: 1, mt: 1 }}>
                    {tab === "route" &&
                        (live.itinerary ? (
                            <TripStops
                                itinerary={live.itinerary}
                                stopTimes={live.stops}
                                sequence={live.sequence}
                                color={color}
                                onStopClick={(stopId) => onStopClick(stopId, live.city)}
                            />
                        ) : position && !live.trip ? (
                            <Typography sx={{ m: 2 }}>{t("vehicleDetails.noRouteInfo")}</Typography>
                        ) : live.fatal ? (
                            <Typography sx={{ m: 2 }}>{t("vehicleDetails.noLiveGps")}</Typography>
                        ) : (
                            ["a", "b", "c", "d"].map((key) => <Skeleton key={key} animation="wave" variant="text" height={46} />)
                        ))}
                    {tab === "vehicle" && <VehicleInfoTab city={live.city} vehicleId={vehicleId} brigade={brigade} />}
                    {tab === "brigade" && routeId && (
                        <BrigadeTab
                            city={live.city}
                            routeId={routeId}
                            brigade={brigade}
                            currentTripId={live.trip?.[ETripTuple.tripId]}
                            onTripClick={(tripRef) => onTripClick(tripRef, live.city)}
                        />
                    )}
                </Box>
            </BottomSheet>
            {toast.element}
        </>
    );
};
