import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import ElectricRickshawIcon from "@mui/icons-material/ElectricRickshaw";
import SubwayIcon from "@mui/icons-material/Subway";
import TrainIcon from "@mui/icons-material/Train";
import TramIcon from "@mui/icons-material/Tram";
import type { SvgIconProps } from "@mui/material";
import { RouteType } from "@/api/types";

export const vehicleTypeName = (type: number): string => {
    switch (type) {
        case RouteType.Tram:
            return "tram";
        case RouteType.Subway:
            return "subway";
        case RouteType.Rail:
        case RouteType.Funicular:
        case RouteType.Monorail:
            return "train";
        case RouteType.Ferry:
            return "ferry";
        case RouteType.Trolleybus:
            return "trolleybus";
        default:
            return "bus";
    }
};

export const VehicleTypeIcon = ({ routeType: type, ...props }: { routeType: number } & Omit<SvgIconProps, "type">) => {
    switch (type) {
        case RouteType.Tram:
            return <TramIcon {...props} />;
        case RouteType.Subway:
            return <SubwayIcon {...props} />;
        case RouteType.Rail:
        case RouteType.Funicular:
        case RouteType.Monorail:
            return <TrainIcon {...props} />;
        case RouteType.Ferry:
            return <DirectionsBoatIcon {...props} />;
        case RouteType.Trolleybus:
            return <ElectricRickshawIcon {...props} />;
        default:
            return <DirectionsBusIcon {...props} />;
    }
};
