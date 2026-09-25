import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import ShareIcon from "@mui/icons-material/Share";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ERouteTuple, ETripTuple, EVehiclePosition } from "@/api/types";
import { RouteChip } from "@/components/departures/RouteChip";
import { BottomSheet } from "@/components/map/BottomSheet";
import { shareLink } from "@/components/map/share";
import { AlertList, SheetIconButton, SheetToolbar, useToast } from "@/components/map/SheetParts";
import { formatDate, formatTime, parseVehicleId, routeColor } from "@/lib/transit";
import { TripStops } from "./TripStops";
import type { TripLiveState } from "./useTripLive";

type Props = {
    city: string;
    tripId: string;
    live: TripLiveState;
    hasBack: boolean;
    onClose: () => void;
    onBack: () => void;
    onFitTrip: () => void;
    onVehicleClick: (vehicleId: string, city: string) => void;
    onStopClick: (stopId: string, city: string) => void;
    onHeightChange: (px: number, side: boolean) => void;
};

// `?kurs=` sheet: one trip with live stop times.
export const TripSheet = ({ city, tripId, live, hasBack, onClose, onBack, onFitTrip, onVehicleClick, onStopClick, onHeightChange }: Props) => {
    const { t } = useTranslation();
    const toast = useToast();
    const trip = live.trip;
    const route = trip?.[ETripTuple.route];
    const color = route ? routeColor(route) : "var(--bus)";
    const firstDeparture = live.stops?.[0]?.[1]?.[0];
    const vehicleId = live.position?.[EVehiclePosition.id];

    const share = async () => {
        const url = `${window.location.origin}/${city}?kurs=${encodeURIComponent(trip?.[ETripTuple.tripId] ?? tripId)}`;
        const result = await shareLink(t("global.trip"), `${t("global.trip")} ${route?.[ERouteTuple.routeName] ?? ""} → ${trip?.[ETripTuple.headsign] ?? ""}: `, url);
        if (result === "copied") toast.show(t("global.copied"));
    };

    const header = (
        <Box>
            <SheetToolbar
                left={
                    <SheetIconButton title={t("global.share")} onClick={share}>
                        <ShareIcon fontSize="small" />
                    </SheetIconButton>
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
            <Box sx={{ mx: 2, mb: 1 }}>
                {route ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                        <RouteChip name={route[ERouteTuple.routeName]} type={route[ERouteTuple.routeType]} brigade={trip?.[ETripTuple.brigade] || undefined} />
                        <Typography variant="body1" noWrap sx={{ fontWeight: 500 }}>
                            {trip?.[ETripTuple.headsign]}
                        </Typography>
                    </Box>
                ) : live.fatal ? (
                    <Typography>{t("global.nothingFound")}</Typography>
                ) : (
                    <Skeleton variant="text" width={180} height={32} />
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5, gap: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {firstDeparture ? `${t("global.trip")} ${formatDate(firstDeparture)} ${formatTime(firstDeparture)}` : ""}
                        {trip?.[ETripTuple.shortName] ? ` · ${trip[ETripTuple.shortName]}` : ""}
                    </Typography>
                    {vehicleId && (
                        <Button size="small" variant="outlined" startIcon={<DirectionsBusIcon />} onClick={() => onVehicleClick(vehicleId, live.city)} className="text-default-text">
                            {t("global.vehicle")} {parseVehicleId(vehicleId).number}
                        </Button>
                    )}
                </Box>
                {trip?.[ETripTuple.description]?.map(([key, value]) => (
                    <Typography key={key + value} variant="caption" component="div" sx={{ opacity: 0.8 }}>
                        {key === "operatedBy" ? `${t("global.operatedByVehicle")}: ${value}` : value}
                    </Typography>
                ))}
            </Box>
            <AlertList alerts={live.alerts} />
        </Box>
    );

    return (
        <>
            <BottomSheet open header={header} onHeightChange={onHeightChange}>
                <Box sx={{ mx: 1 }}>
                    {live.itinerary ? (
                        <TripStops
                            itinerary={live.itinerary}
                            stopTimes={live.stops}
                            sequence={live.sequence}
                            color={color}
                            onStopClick={(stopId) => onStopClick(stopId, live.city)}
                        />
                    ) : live.fatal ? (
                        <Typography sx={{ m: 2 }}>{t("timetables.routeShapeNotFound")}</Typography>
                    ) : (
                        ["a", "b", "c", "d"].map((key) => <Skeleton key={key} animation="wave" variant="text" height={46} />)
                    )}
                </Box>
            </BottomSheet>
            {toast.element}
        </>
    );
};
