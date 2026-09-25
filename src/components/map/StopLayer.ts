import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { EStopTuple, type Point, type StopTuple } from "@/api/types";
import { stopArrowId, stopIconId, tripStopId } from "./canvasImages";
import { typeClass } from "./icons";

const STOPS = "cnc-stops";
const ARROWS = "cnc-stop-arrows";
const TRIP_LINE = "cnc-trip-line";
const TRIP_STOPS = "cnc-trip-stops";

export const STOPS_ZOOM = 14;

const collection = (features: GeoJSON.Feature[] = []): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features });

const stopColors = (stop: StopTuple) => {
    const types = [...new Set(stop[EStopTuple.vehicleTypes].map(typeClass))].slice(0, 2);
    return (types.length ? types : ["bus"]).map((name) => `--${name}`);
};

export type TripOverlayData = {
    shape: Point[];
    passedIndex: number;
    color: string;
    stops: { id: string; name: string; location: Point }[];
};

// Stops (canvas stop-board icons + bearing arrows) and the selected trip's shape.
export class StopLayer {
    private stops: StopTuple[] = [];
    private trip: TripOverlayData | null = null;
    private highlighted: string | null = null;
    private visible = true;

    constructor(private map: MapLibreMap) {
        this.install();
        map.on("style.load", this.install);
    }

    destroy() {
        this.map.off("style.load", this.install);
    }

    private install = () => {
        const map = this.map;
        if (map.getSource(STOPS)) return;
        map.addSource(TRIP_LINE, { type: "geojson", data: collection() });
        map.addSource(TRIP_STOPS, { type: "geojson", data: collection() });
        map.addSource(STOPS, { type: "geojson", data: collection() });
        map.addSource(ARROWS, { type: "geojson", data: collection() });
        map.addLayer({
            id: "cnc-trip-casing",
            type: "line",
            source: TRIP_LINE,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 5, 16, 9], "line-opacity": 0.8 },
        });
        map.addLayer({
            id: "cnc-trip-line",
            type: "line",
            source: TRIP_LINE,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
                "line-color": ["get", "color"],
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3, 16, 6],
            },
        });
        map.addLayer({
            id: "cnc-trip-stops",
            type: "symbol",
            source: TRIP_STOPS,
            layout: { "icon-image": ["get", "icon"], "icon-allow-overlap": true, "icon-ignore-placement": true },
        });
        map.addLayer({
            id: "cnc-stop-arrows",
            type: "symbol",
            source: ARROWS,
            layout: {
                "icon-image": ["get", "icon"],
                "icon-rotate": ["get", "angle"],
                "icon-rotation-alignment": "map",
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
            },
        });
        map.addLayer({
            id: "cnc-stops",
            type: "symbol",
            source: STOPS,
            layout: {
                "icon-image": ["get", "icon"],
                "icon-size": ["case", ["get", "highlighted"], 1.25, 1],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
            },
        });
        this.render();
    };

    setStops(stops: StopTuple[], visible: boolean) {
        this.stops = stops;
        this.visible = visible;
        this.render();
    }

    setHighlighted(stopId: string | null) {
        this.highlighted = stopId;
        this.render();
    }

    setTrip(trip: TripOverlayData | null) {
        this.trip = trip;
        this.render();
    }

    refresh() {
        this.render();
    }

    private render = () => {
        const map = this.map;
        const stopFeatures: GeoJSON.Feature[] = [];
        const arrowFeatures: GeoJSON.Feature[] = [];
        if (this.visible) {
            for (const stop of this.stops) {
                const colors = stopColors(stop);
                const id = stop[EStopTuple.stopId];
                const highlighted = this.highlighted === id;
                if (this.highlighted && !highlighted && this.trip) continue;
                stopFeatures.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: stop[EStopTuple.location] },
                    properties: { id, city: stop[EStopTuple.city], name: stop[EStopTuple.stopName], icon: stopIconId(colors), highlighted },
                });
                const bearing = stop[EStopTuple.bearing];
                if (bearing !== null && bearing !== undefined) {
                    arrowFeatures.push({
                        type: "Feature",
                        geometry: { type: "Point", coordinates: stop[EStopTuple.location] },
                        properties: { icon: stopArrowId(colors[0]), angle: bearing },
                    });
                }
            }
        }
        (map.getSource(STOPS) as GeoJSONSource | undefined)?.setData(collection(stopFeatures));
        (map.getSource(ARROWS) as GeoJSONSource | undefined)?.setData(collection(arrowFeatures));

        const lineFeatures: GeoJSON.Feature[] = [];
        const tripStopFeatures: GeoJSON.Feature[] = [];
        if (this.trip && this.trip.shape.length > 1) {
            const { shape, passedIndex, color, stops } = this.trip;
            const split = Math.max(0, Math.min(shape.length - 1, passedIndex));
            if (split > 0) {
                lineFeatures.push({
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: shape.slice(0, split + 1) },
                    properties: { color: "#9e9e9e" },
                });
            }
            lineFeatures.push({ type: "Feature", geometry: { type: "LineString", coordinates: shape.slice(split) }, properties: { color } });
            for (const stop of stops) {
                tripStopFeatures.push({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: stop.location },
                    properties: { id: stop.id, name: stop.name, icon: tripStopId(color) },
                });
            }
        }
        (map.getSource(TRIP_LINE) as GeoJSONSource | undefined)?.setData(collection(lineFeatures));
        (map.getSource(TRIP_STOPS) as GeoJSONSource | undefined)?.setData(collection(tripStopFeatures));
    };
}
