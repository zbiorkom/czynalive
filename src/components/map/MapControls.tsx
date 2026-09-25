import FavoriteIcon from "@mui/icons-material/Favorite";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import LayersIcon from "@mui/icons-material/Layers";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { Box, CircularProgress } from "@mui/material";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useTranslation } from "react-i18next";

type Props = {
    map: MapLibreMap;
    filterActive: boolean;
    favouritesActive: boolean;
    located: boolean;
    locating: boolean;
    onFilter: () => void;
    onLayers: () => void;
    onFavourites: () => void;
    onLocate: () => void;
};

const stop = (event: React.SyntheticEvent) => event.stopPropagation();

// Bottom-right control stack (czynaczas: filter / layers / favourites bar, zoom, GPS).
export const MapControls = ({ map, filterActive, favouritesActive, located, locating, onFilter, onLayers, onFavourites, onLocate }: Props) => {
    const { t } = useTranslation();
    return (
        <Box className="mapgl-bottom-right" onPointerDown={stop} onWheel={stop} onDoubleClick={stop} sx={{ bottom: "calc(var(--map-pad-bottom) + 25px) !important" }}>
            <div className="mapgl-control mapgl-bar mapgl-controls" style={{ display: "block", overflow: "hidden", bottom: 0 }}>
                <button
                    type="button"
                    title={t("map.filterDialogHeader")}
                    aria-label={t("map.filterDialogHeader")}
                    className={`mapgl-filter-button ${filterActive ? "bg-primary text-white btn-filter-animate" : ""}`}
                    style={{ borderBottom: "1px solid var(--default-text)", width: 42, height: 42 }}
                    onClick={onFilter}
                >
                    <FilterAltIcon fontSize="small" />
                </button>
                <button
                    type="button"
                    title={t("map.layersHeader")}
                    aria-label={t("map.layersHeader")}
                    className="mapgl-filter-button"
                    style={{ borderBottom: "1px solid var(--default-text)", width: 42, height: 42 }}
                    onClick={onLayers}
                >
                    <LayersIcon fontSize="small" />
                </button>
                <button
                    type="button"
                    title={t("map.favouritesModeShowHide")}
                    aria-label={t("map.favouritesModeShowHide")}
                    className={`mapgl-filter-button ${favouritesActive ? "bg-primary text-white btn-filter-animate" : ""}`}
                    style={{ width: 42, height: 42 }}
                    onClick={onFavourites}
                >
                    <FavoriteIcon fontSize="small" />
                </button>
            </div>
            <div className="mapgl-control-zoom mapgl-bar mapgl-control">
                <button type="button" className="mapgl-control-zoom-in" title={t("global.zoomIn")} aria-label={t("global.zoomIn")} onClick={() => map.zoomIn()}>
                    <span aria-hidden="true">+</span>
                </button>
                <button type="button" className="mapgl-control-zoom-out" title={t("global.zoomOut")} aria-label={t("global.zoomOut")} onClick={() => map.zoomOut()}>
                    <span aria-hidden="true">−</span>
                </button>
            </div>
            <div className="mapgl-control mapgl-bar" style={{ overflow: "hidden", borderRadius: 4 }}>
                <button
                    type="button"
                    className={`mapgl-locate-button ${located ? "is-located" : ""}`}
                    title={t("map.findMyLocation")}
                    aria-label={t("map.findMyLocation")}
                    onClick={onLocate}
                >
                    {locating ? <CircularProgress size={18} /> : <MyLocationIcon fontSize="small" />}
                </button>
            </div>
        </Box>
    );
};
