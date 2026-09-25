import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import DirectionsRailwayIcon from "@mui/icons-material/DirectionsRailway";
import DirectionsSubwayIcon from "@mui/icons-material/DirectionsSubway";
import TramIcon from "@mui/icons-material/Tram";
import TrolleyIcon from "@mui/icons-material/ElectricRickshaw";
import { Box, type SvgIconProps } from "@mui/material";
import { vehicleType } from "@/lib/transit";

const ICONS: Record<string, (props: SvgIconProps) => JSX.Element> = {
    bus: (props) => <DirectionsBusIcon {...props} />,
    tram: (props) => <TramIcon {...props} />,
    train: (props) => <DirectionsRailwayIcon {...props} />,
    subway: (props) => <DirectionsSubwayIcon {...props} />,
    trolleybus: (props) => <TrolleyIcon {...props} />,
    ferry: (props) => <DirectionsBoatIcon {...props} />,
};

export const VehicleGlyph = ({ vehicle, ...props }: { vehicle: number } & Omit<SvgIconProps, "type">) => {
    const Icon = ICONS[vehicleType(vehicle).key] ?? ICONS.bus;
    return <Icon {...props} />;
};

// Rounded square in the vehicle type color with a white glyph (the original's type badge).
export const VehicleTypeIcon = ({ type, size = 35 }: { type: number; size?: number }) => (
    <Box
        component="span"
        sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            flex: "0 0 auto",
            borderRadius: `${Math.round(size / 4)}px`,
            background: vehicleType(type).cssVar,
            color: "#fff",
        }}
    >
        <VehicleGlyph vehicle={type} sx={{ fontSize: size * 0.65 }} />
    </Box>
);
