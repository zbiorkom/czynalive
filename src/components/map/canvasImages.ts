import type { Map as MapLibreMap } from "maplibre-gl";
import { ICON_PATHS, cssVar } from "./icons";

const pixelRatio = () => Math.min(Math.ceil(window.devicePixelRatio || 1), 3);
const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
const FONT = `700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;

let measureContext: CanvasRenderingContext2D | null = null;
const measure = () => (measureContext ??= document.createElement("canvas").getContext("2d"));

const drawImage = (map: MapLibreMap, id: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (map.hasImage(id)) return;
    const ratio = pixelRatio();
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    draw(ctx);
    map.addImage(id, ctx.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio: ratio });
};

// Colors may be CSS vars ("--bus") or literal ("#bd0c00").
const resolveColor = (color: string) => (color.startsWith("--") ? cssVar(color) : color);
const contrastStroke = () => (isDark() ? cssVar("--default-text", "#ccc") : "#ffffff");

// Image ids carry everything needed to redraw them (used by `styleimagemissing`).
export const themeKey = () => (isDark() ? "d" : "l");
export const vehicleRoundId = (color: string) => `veh-round|${color}|${themeKey()}`;
export const vehicleTearId = (color: string) => `veh-tear|${color}|${themeKey()}`;
export const vehicleNumberId = (label: string) => `veh-num|${label}|${themeKey()}`;
export const stopIconId = (colors: string[]) => `stop|${colors.join(",")}|${themeKey()}`;
export const stopArrowId = (color: string) => `stop-arrow|${color}|${themeKey()}`;
export const tripStopId = (color: string) => `trip-stop|${color}|${themeKey()}`;

const SIZE = 30;
const STOP = 26;
const ARROW = 48;

export const generateImage = (map: MapLibreMap, id: string) => {
    const [kind, param] = id.split("|");
    switch (kind) {
        case "veh-round":
            return drawImage(map, id, SIZE, SIZE, (ctx) => {
                ctx.beginPath();
                ctx.arc(SIZE / 2, SIZE / 2, 10, 0, Math.PI * 2);
                ctx.fillStyle = resolveColor(param);
                ctx.fill();
            });
        case "veh-tear":
            return drawImage(map, id, SIZE, SIZE, (ctx) => {
                ctx.translate(SIZE / 2, SIZE / 2);
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(-10, -10);
                ctx.lineTo(0, -10);
                ctx.arcTo(10, -10, 10, 0, 10);
                ctx.arcTo(10, 10, 0, 10, 10);
                ctx.arcTo(-10, 10, -10, 0, 10);
                ctx.closePath();
                ctx.fillStyle = resolveColor(param);
                ctx.fill();
            });
        case "veh-num": {
            const context = measure();
            if (!context) return;
            context.font = FONT;
            const width = Math.max(Math.ceil(context.measureText(param).width) + 2, 8);
            return drawImage(map, id, width, 14, (ctx) => {
                ctx.font = FONT;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = isDark() ? cssVar("--default-text", "#ddd") : "#ffffff";
                ctx.fillText(param, width / 2, 7.5);
            });
        }
        case "stop":
            return drawImage(map, id, STOP, STOP, (ctx) => {
                const colors = param.split(",").map(resolveColor);
                const center = STOP / 2;
                const radius = 12;
                ctx.save();
                ctx.beginPath();
                ctx.arc(center, center, radius, 0, Math.PI * 2);
                ctx.clip();
                if (colors.length > 1) {
                    const gradient = ctx.createLinearGradient(0, 0, STOP, STOP);
                    gradient.addColorStop(0, colors[0]);
                    gradient.addColorStop(0.49, colors[0]);
                    gradient.addColorStop(0.49, "#ffffff");
                    gradient.addColorStop(0.51, "#ffffff");
                    gradient.addColorStop(0.51, colors[1]);
                    gradient.addColorStop(1, colors[1]);
                    ctx.fillStyle = gradient;
                } else ctx.fillStyle = colors[0];
                ctx.fillRect(0, 0, STOP, STOP);
                ctx.restore();
                ctx.beginPath();
                ctx.arc(center, center, radius - 0.5, 0, Math.PI * 2);
                ctx.lineWidth = 1;
                ctx.strokeStyle = contrastStroke();
                ctx.stroke();
                const icon = 15;
                ctx.save();
                ctx.translate(center - icon / 2, center - icon / 2);
                ctx.scale(icon / 24, icon / 24);
                ctx.fillStyle = contrastStroke();
                ctx.fill(new Path2D(ICON_PATHS.stopBoard));
                ctx.restore();
            });
        case "stop-arrow":
            return drawImage(map, id, ARROW, ARROW, (ctx) => {
                const scale = 34 / 24;
                ctx.translate(ARROW / 2 - 17, ARROW / 2 - 16 - 17);
                ctx.scale(scale, scale);
                const path = new Path2D(ICON_PATHS.stopArrow);
                ctx.fillStyle = resolveColor(param);
                ctx.fill(path);
                ctx.lineWidth = 1;
                ctx.strokeStyle = contrastStroke();
                ctx.stroke(path);
            });
        case "trip-stop":
            return drawImage(map, id, 16, 16, (ctx) => {
                ctx.beginPath();
                ctx.arc(8, 8, 5.5, 0, Math.PI * 2);
                ctx.fillStyle = isDark() ? "#222" : "#ffffff";
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = resolveColor(param);
                ctx.stroke();
            });
    }
};

export const installImageGenerator = (map: MapLibreMap) => {
    map.on("styleimagemissing", (event) => generateImage(map, event.id));
};
