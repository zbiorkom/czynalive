import { Box, Button, Skeleton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cityGet } from "@/api/client";
import { ERouteTuple, ETripTuple, type TripTupleDetailed } from "@/api/types";
import { useApi } from "@/api/useApi";
import { RouteChip } from "@/components/departures/RouteChip";
import { formatTime, todayDateIndex } from "@/lib/transit";

type Props = { city: string; routeId: string; brigade: string; currentTripId?: string; onTripClick: (tripId: string) => void };

// "Rozkład brygadowy" tab: all trips of the vehicle's duty today.
export const BrigadeTab = ({ city, routeId, brigade, currentTripId, onTripClick }: Props) => {
    const { t } = useTranslation();
    const date = todayDateIndex();
    const { data, error } = useApi(
        (signal) => cityGet<TripTupleDetailed[]>(city, `/brigades/${encodeURIComponent(routeId)}/${encodeURIComponent(brigade)}/${date}`, undefined, signal),
        [city, routeId, brigade, date],
    );

    if (!data && !error) return <Skeleton variant="rectangular" height={160} sx={{ mx: 1, borderRadius: 1 }} />;
    if (!data || data.length === 0) {
        return (
            <Typography sx={{ m: 2 }} variant="body2">
                {t("vehicleDetails.noBrigadeInfo")}
            </Typography>
        );
    }
    const now = Date.now();

    return (
        <Box sx={{ mx: 1 }}>
            {data.map((trip) => {
                const isCurrent = trip[ETripTuple.tripId] === currentTripId;
                const first = trip[ETripTuple.firstStop];
                const last = trip[ETripTuple.lastStop];
                const done = last[1] < now && !isCurrent;
                return (
                    <Box
                        key={trip[ETripTuple.tripId]}
                        onClick={() => onTripClick(trip[ETripTuple.tripId])}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            py: 0.75,
                            px: 1,
                            borderRadius: 1,
                            cursor: "pointer",
                            opacity: done ? 0.55 : 1,
                            bgcolor: isCurrent ? "action.selected" : undefined,
                            borderLeft: isCurrent ? "4px solid var(--primary)" : "4px solid transparent",
                            "&:hover": { bgcolor: "action.hover" },
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 700, width: 92, flexShrink: 0 }}>
                            {formatTime(first[1])}–{formatTime(last[1])}
                        </Typography>
                        <RouteChip name={trip[ETripTuple.route][ERouteTuple.routeName]} type={trip[ETripTuple.route][ERouteTuple.routeType]} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                                {first[0]} → {last[0]}
                            </Typography>
                            {isCurrent && (
                                <Typography variant="caption" className="text-primary">
                                    {t("brigadeSchedule.currentTrip")}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            })}
            <Button
                component={Link}
                to={`/${city}/rozklad-jazdy-brygady/linia/${encodeURIComponent(routeId)}/brygada/${encodeURIComponent(brigade)}`}
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                className="text-default-text"
            >
                {t("brigadeSchedule.brigadeDetails")}
            </Button>
        </Box>
    );
};
