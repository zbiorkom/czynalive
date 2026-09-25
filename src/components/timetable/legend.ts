import { EStopTuple, type RouteLegendEntry } from "@/api/types";

const stopName = (entry: RouteLegendEntry, index: number) => {
    const stop = entry.stops[index];
    return stop ? `${stop[EStopTuple.stopName]}${stop[EStopTuple.stopCode] ? ` ${stop[EStopTuple.stopCode]}` : ""}` : "";
};

// Human text of a timetable note letter (backend `ETripNote`).
export const legendText = (entry: RouteLegendEntry): string => {
    const a = stopName(entry, 0);
    const b = stopName(entry, 1);
    switch (entry.kind) {
        case "skipsStops":
            return b ? `nie zatrzymuje się na przystankach między ${a} a ${b}` : `nie zatrzymuje się na przystanku ${a}`;
        case "endsAt":
            return `kurs skrócony — kończy bieg na przystanku ${a}`;
        case "extendedTo":
            return `kurs wydłużony do przystanku ${a}`;
        case "leavesTo":
            return b ? `kurs jedzie trasą do przystanku ${a}, a następnie do przystanku ${b}` : `kurs zjeżdża z trasy przy przystanku ${a}`;
        case "via":
            return b ? `kurs jedzie wariantem trasy przez ${a} – ${b}` : `kurs jedzie wariantem trasy przez ${a}`;
        case "offTrunk":
            return b ? `kurs jedzie trasą wariantową ${a} – ${b}` : `kurs jedzie trasą wariantową przez ${a}`;
        default:
            return a;
    }
};
