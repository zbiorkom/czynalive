import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Button, Skeleton, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { cityGet } from "@/api/client";
import { EVehicle, type VehicleTuple } from "@/api/types";
import { useApi } from "@/api/useApi";
import { fleetUrl, parseVehicleId, vehicleType } from "@/lib/transit";
import { useSettings } from "@/store/settings";

type Props = { city: string; vehicleId: string; brigade: string };

// "Pojazd" tab: fleet data from phototrans / ilostan.
export const VehicleInfoTab = ({ city, vehicleId, brigade }: Props) => {
    const { t } = useTranslation();
    const [settings] = useSettings();
    const { number, type, agency } = parseVehicleId(vehicleId);
    const { data, error, loading } = useApi((signal) => cityGet<VehicleTuple>(city, `/vehicles/vehicle/${encodeURIComponent(vehicleId)}`, undefined, signal), [city, vehicleId]);

    if (loading && !data) {
        return (
            <Box sx={{ mx: 1 }}>
                {["a", "b", "c"].map((key) => (
                    <Skeleton key={key} variant="text" height={40} />
                ))}
            </Box>
        );
    }

    const rows: [string, string][] = [
        [t("vehicleInformation.vehicleType"), vehicleType(type).name],
        [t("vehicleInformation.fleetNumber"), number || "-"],
    ];
    if (brigade) rows.push([t("vehicleInformation.brigade"), brigade]);
    if (data) {
        if (data[EVehicle.model]) rows.push([t("vehicleInformation.brandModel"), data[EVehicle.model]]);
        if (data[EVehicle.year]) rows.push([t("vehicleInformation.productionYear"), String(data[EVehicle.year])]);
        if (data[EVehicle.agency]) rows.push([t("vehicleInformation.operator"), data[EVehicle.agency]]);
    } else if (agency !== "default") rows.push([t("vehicleInformation.operatorId"), agency]);

    const url = data ? fleetUrl(data[EVehicle.url]) : "";

    return (
        <Box sx={{ mx: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {t("vehicleInformation.technicalData")}
            </Typography>
            <Table size="small">
                <TableBody>
                    {rows.map(([label, value]) => (
                        <TableRow key={label}>
                            <TableCell sx={{ pl: 0, opacity: 0.8 }}>{label}</TableCell>
                            <TableCell sx={{ pr: 0, fontWeight: 600 }} align="right">
                                {value}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {error && !data && (
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                    {t("vehicleDetails.noVehicleData")}
                </Typography>
            )}
            {url && settings.showVehiclePhotos && (
                <Button
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    variant="outlined"
                    fullWidth
                    endIcon={<OpenInNewIcon />}
                    sx={{ mt: 2 }}
                    className="text-default-text"
                >
                    {t("vehicleInformation.photoSrc")} ({new URL(url).hostname.replace("www.", "")})
                </Button>
            )}
        </Box>
    );
};
