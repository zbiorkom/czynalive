import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { Badge, Chip, type SxProps, type Theme } from "@mui/material";
import { VehicleTypeIcon, vehicleTypeName } from "./VehicleTypeIcon";

type Props = {
    name: string;
    type: number;
    brigade?: string;
    showLiveBadge?: boolean;
    isLive?: boolean;
    onClick?: () => void;
    size?: "small" | "medium";
    sx?: SxProps<Theme>;
};

// Line chip in the vehicle type colour with the type icon (czynaczas "RouteId" chip).
export const RouteChip = ({ name, type, brigade, showLiveBadge, isLive, onClick, size = "small", sx }: Props) => {
    const chip = (
        <Chip
            size={size}
            className={`bg-${vehicleTypeName(type)} text-white`}
            icon={<VehicleTypeIcon routeType={type} sx={{ width: "1em", height: "1em", color: "#fff !important" }} />}
            onClick={onClick}
            aria-label={brigade ? `Linia ${name}, brygada ${brigade}` : `Linia ${name}`}
            label={
                <span className="text-white" style={{ fontSize: size === "small" ? "0.9375rem" : "1.05rem", fontWeight: 500 }}>
                    {name}
                    {brigade ? <span style={{ fontSize: "0.75rem" }}>/{brigade}</span> : null}
                </span>
            }
            sx={[
                {
                    borderRadius: "6px",
                    flexShrink: 0,
                    color: "#fff",
                    "& .MuiChip-label": { px: brigade ? "4px" : "8px" },
                    "& .MuiChip-icon": { ml: "6px", mr: "-2px" },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        />
    );
    if (!showLiveBadge) return chip;
    return (
        <Badge
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            badgeContent={
                isLive ? (
                    <WifiIcon className="opacity-animate" sx={{ color: "hsl(124, 81%, 39%)", width: 15, height: 15, rotate: "45deg", ml: "-7px", mt: "-10px" }} />
                ) : (
                    <WifiOffIcon sx={{ color: "var(--default-text)", width: 15, height: 15, ml: "-7px", mt: "-10px", opacity: 0.6 }} />
                )
            }
        >
            {chip}
        </Badge>
    );
};
