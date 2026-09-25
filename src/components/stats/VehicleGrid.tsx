import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ERouteTuple } from "@/api/types";
import { DataTable, type Column } from "./DataTable";
import { delayMinutes, mapVehicleUrl, type LiveVehicle } from "./api";
import { DelayChip, SectionHeader, typeName } from "./common";

type Props = {
    city: string;
    title: string;
    subtitle: string;
    vehicles: LiveVehicle[];
    types: number[];
    selectedType: number | "total";
    withDelay?: boolean;
    csvName: string;
};

export const VehicleGrid = ({ city, title, subtitle, vehicles, types, selectedType, withDelay, csvName }: Props) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down("md"));
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [hidden, setHidden] = useState<Set<string>>(new Set());
    const rows = useMemo(() => vehicles.filter((vehicle) => !hidden.has(vehicle.id)), [vehicles, hidden]);

    const columns: Column<LiveVehicle>[] = [
        { field: "type", header: t("delays.vehicleType"), value: (vehicle) => typeName(vehicle.type), minWidth: 80 },
        {
            field: "route",
            header: t("global.route_id"),
            value: (vehicle) => vehicle.route[ERouteTuple.routeName],
            minWidth: 60,
            render: (vehicle) => (
                <Link
                    to={`/${vehicle.route[ERouteTuple.city]}/rozklad-jazdy/linia/${encodeURIComponent(vehicle.route[ERouteTuple.routeId])}`}
                    style={{ color: "inherit" }}
                >
                    {vehicle.route[ERouteTuple.routeName]}
                </Link>
            ),
        },
        { field: "brigade", header: t("global.brigade"), value: (vehicle) => vehicle.brigade, minWidth: 70 },
        {
            field: "vehicleNo",
            header: t("global.vehicleNoShort"),
            value: (vehicle) => vehicle.vehicleNo,
            minWidth: 60,
            render: (vehicle) => (
                <Link to={mapVehicleUrl(city, vehicle.id)} style={{ color: "var(--primary)" }}>
                    {vehicle.vehicleNo}
                </Link>
            ),
        },
        { field: "headsign", header: t("global.tripHeadsign"), value: (vehicle) => vehicle.headsign, minWidth: 130 },
        ...(withDelay
            ? [
                  {
                      field: "delay",
                      header: t("delays.delay"),
                      value: (vehicle: LiveVehicle) => vehicle.delay,
                      csv: (vehicle: LiveVehicle) => delayMinutes(vehicle.delay ?? 0),
                      minWidth: 130,
                      render: (vehicle: LiveVehicle) => <DelayChip minutes={delayMinutes(vehicle.delay ?? 0)} />,
                  },
              ]
            : []),
        { field: "stop", header: t("global.stop"), value: (vehicle) => vehicle.stop, minWidth: 150 },
    ];

    return (
        <Box sx={{ my: 2 }}>
            <SectionHeader types={types} selectedType={selectedType} title={title} subtitle={subtitle} />
            {(hidden.size > 0 || selected.size > 0) && (
                <Box sx={{ display: "flex", gap: 2, my: 1 }}>
                    {selected.size > 0 && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => {
                                setHidden((prev) => new Set([...prev, ...selected]));
                                setSelected(new Set());
                            }}
                        >
                            {t("global.hideSelected", { count: selected.size })}
                        </Button>
                    )}
                    {hidden.size > 0 && (
                        <Button variant="contained" size="small" onClick={() => setHidden(new Set())}>
                            {t("global.showHidden", { count: hidden.size })}
                        </Button>
                    )}
                </Box>
            )}
            {mobile && (
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                    {t("delays.tableIsMovable")}
                </Typography>
            )}
            <DataTable
                rows={rows}
                columns={columns}
                getRowId={(vehicle) => vehicle.id}
                initialSort={withDelay ? { field: "delay", direction: "desc" } : { field: "route", direction: "asc" }}
                csvFileName={csvName}
                selection={mobile ? undefined : { selected, onChange: setSelected }}
                height={600}
            />
        </Box>
    );
};
