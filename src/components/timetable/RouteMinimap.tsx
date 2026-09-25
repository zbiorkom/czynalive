import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { EStopTuple, EVehiclePosition, type Point, type StopTuple, type VehiclePosition } from "@/api/types";
import { mapStyleFor } from "@/components/map/mapStyle";
import { vehicleTypeName } from "@/components/departures/VehicleTypeIcon";
import { decodePolyline6, parseVehicleId } from "@/lib/transit";
import { useThemeMode } from "./common";

type Props = {
    shapes: string[];
    stops: StopTuple[];
    vehicles: VehiclePosition[];
    showVehicles: boolean;
    color: string;
    routeType: number;
    center: Point;
    activeStop?: StopTuple;
    fitKey: number;
    onStopClick?: (stop: StopTuple) => void;
    onVehicleClick?: (vehicle: VehiclePosition) => void;
    style?: React.CSSProperties;
};

const EMPTY = { type: "FeatureCollection" as const, features: [] };

const boundsOf = (lines: [number, number][][]) => {
    const bounds = new maplibregl.LngLatBounds();
    for (const line of lines) for (const point of line) bounds.extend(point);
    return bounds;
};

export const RouteMinimap = ({ shapes, stops, vehicles, showVehicles, color, routeType, center, activeStop, fitKey, onStopClick, onVehicleClick, style }: Props) => {
    const container = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<MapLibreMap | null>(null);
    const markers = useRef(new Map<string, maplibregl.Marker>());
    const mode = useThemeMode();
    const callbacks = useRef({ onStopClick, onVehicleClick });
    callbacks.current = { onStopClick, onVehicleClick };
    const stopsRef = useRef(stops);
    stopsRef.current = stops;
    const vehiclesRef = useRef(vehicles);
    vehiclesRef.current = vehicles;

    useEffect(() => {
        if (!container.current) return;
        let instance: MapLibreMap | null = null;
        try {
            instance = new maplibregl.Map({
                container: container.current,
                style: mapStyleFor("osm", mode === "dark"),
                center,
                zoom: 11,
                attributionControl: false,
                dragRotate: false,
                pitchWithRotate: false,
                touchPitch: false,
            });
        } catch {
            return;
        }
        instance.touchZoomRotate.disableRotation();
        instance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
        instance.on("load", () => {
            if (!instance) return;
            instance.addSource("route-lines", { type: "geojson", data: EMPTY });
            instance.addSource("route-stops", { type: "geojson", data: EMPTY });
            instance.addLayer({ id: "route-lines-casing", type: "line", source: "route-lines", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#fff", "line-width": 7 } });
            instance.addLayer({ id: "route-lines", type: "line", source: "route-lines", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": ["get", "opacity"] } });
            instance.addLayer({
                id: "route-stops",
                type: "circle",
                source: "route-stops",
                paint: {
                    "circle-radius": ["case", ["get", "active"], 7, 4.5],
                    "circle-color": "#fff",
                    "circle-stroke-color": ["get", "color"],
                    "circle-stroke-width": ["case", ["get", "active"], 4, 2.5],
                },
            });
            instance.on("click", "route-stops", (event) => {
                const index = event.features?.[0]?.properties?.index;
                const stop = typeof index === "number" ? stopsRef.current[index] : undefined;
                if (stop) callbacks.current.onStopClick?.(stop);
            });
            instance.on("mouseenter", "route-stops", () => (instance!.getCanvas().style.cursor = "pointer"));
            instance.on("mouseleave", "route-stops", () => (instance!.getCanvas().style.cursor = ""));
            setMap(instance);
        });
        return () => {
            markers.current.forEach((marker) => marker.remove());
            markers.current.clear();
            instance?.remove();
            setMap(null);
        };
    }, [mode]);

    useEffect(() => {
        if (!map) return;
        const lines = shapes.map((shape) => decodePolyline6(shape));
        (map.getSource("route-lines") as GeoJSONSource | undefined)?.setData({
            type: "FeatureCollection",
            features: lines.map((coordinates, index) => ({
                type: "Feature",
                properties: { color, opacity: index === 0 ? 1 : 0.75 },
                geometry: { type: "LineString", coordinates },
            })),
        });
        (map.getSource("route-stops") as GeoJSONSource | undefined)?.setData({
            type: "FeatureCollection",
            features: stops.map((stop, index) => ({
                type: "Feature",
                properties: { color, index, active: !!activeStop && stop[EStopTuple.stopId] === activeStop[EStopTuple.stopId] },
                geometry: { type: "Point", coordinates: stop[EStopTuple.location] },
            })),
        });
    }, [map, shapes, stops, color, activeStop]);

    useEffect(() => {
        if (!map) return;
        const lines = shapes.map((shape) => decodePolyline6(shape)).filter((line) => line.length > 1);
        const all = lines.length ? lines : [stops.map((stop) => stop[EStopTuple.location] as [number, number])];
        const bounds = boundsOf(all);
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 30, duration: 300, maxZoom: 16 });
    }, [map, fitKey, shapes]);

    useEffect(() => {
        if (!map || !activeStop) return;
        map.easeTo({ center: activeStop[EStopTuple.location], zoom: Math.max(map.getZoom(), 14), duration: 400 });
    }, [map, activeStop]);

    useEffect(() => {
        if (!map) return;
        const seen = new Set<string>();
        const typeName = vehicleTypeName(routeType);
        for (const vehicle of showVehicles ? vehicles : []) {
            const id = vehicle[EVehiclePosition.id];
            seen.add(id);
            const html = `<div class="bg-${typeName}" style="color:#fff;font:600 11px/1 sans-serif;padding:3px 5px;border-radius:8px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);white-space:nowrap">${parseVehicleId(id).number}</div>`;
            let marker = markers.current.get(id);
            if (!marker) {
                const element = document.createElement("div");
                element.style.cursor = "pointer";
                element.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const current = vehiclesRef.current.find((entry) => entry[EVehiclePosition.id] === id);
                    if (current) callbacks.current.onVehicleClick?.(current);
                });
                marker = new maplibregl.Marker({ element }).setLngLat(vehicle[EVehiclePosition.location]).addTo(map);
                markers.current.set(id, marker);
            } else marker.setLngLat(vehicle[EVehiclePosition.location]);
            const element = marker.getElement();
            if (element.innerHTML !== html) element.innerHTML = html;
        }
        markers.current.forEach((marker, id) => {
            if (seen.has(id)) return;
            marker.remove();
            markers.current.delete(id);
        });
    }, [map, vehicles, showVehicles, color, routeType]);

    return <div ref={container} className="minimapgl noselect" style={{ width: "100%", height: "100%", ...style }} />;
};
