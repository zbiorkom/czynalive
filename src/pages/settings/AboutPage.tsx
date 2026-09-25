import { Box, Divider, Link, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useCity } from "@/api/cities";
import { PageHeader } from "@/components/PageHeader";
import { APP_VERSION, AppLogo } from "@/components/settings/SimpleSections";
import { useSettings } from "@/store/settings";

type DataSource = { type: string; provider: string; providerUrl?: string };

const SOURCE_TYPES: Record<string, string> = {
    officialGTFS: "Rozkład jazdy (oficjalny GTFS)",
    GTFS: "Rozkład jazdy (GTFS)",
    officialGPS: "Pozycje pojazdów (oficjalne)",
    GPS: "Pozycje pojazdów",
    officialDelays: "Opóźnienia (oficjalne)",
    Delays: "Opóźnienia",
};

const FEATURES = [
    "mapa pojazdów komunikacji miejskiej na żywo z kierunkiem jazdy, brygadą i opóźnieniem,",
    "odjazdy z przystanków w czasie rzeczywistym i tablice odjazdów,",
    "rozkłady jazdy linii i przystanków, także rozkłady brygadowe,",
    "komunikaty o utrudnieniach i odwołanych kursach,",
    "statystyki i ranking opóźnień miast.",
];

export default function AboutPage() {
    const [settings] = useSettings();
    const city = useCity(settings.city ?? undefined);
    const sources = Object.values(city?.agencies ?? {}).flatMap((agency) =>
        (((agency as { dataSources?: DataSource[] }).dataSources ?? []) as DataSource[]).map((source) => ({ agency: agency.name, ...source })),
    );

    return (
        <>
            <PageHeader title="O aplikacji" back="/ustawienia" />
            <div className="page">
                <Box sx={{ my: 3 }}>
                    <AppLogo />
                </Box>
                <Typography variant="body1" paragraph>
                    <strong>Czynalive</strong> to aplikacja do śledzenia autobusów, tramwajów i pociągów na żywo. Pokazuje, gdzie jest Twój pojazd, czy
                    przyjedzie na czas i kiedy odjeżdża następny kurs.
                </Typography>
                <Typography variant="body1">W aplikacji znajdziesz:</Typography>
                <List dense>
                    {FEATURES.map((feature) => (
                        <ListItem key={feature} sx={{ py: 0 }}>
                            <ListItemText primary={`• ${feature}`} />
                        </ListItem>
                    ))}
                </List>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h4" gutterBottom>
                    Skąd są dane?
                </Typography>
                <Typography variant="body1" paragraph>
                    Wszystkie dane — rozkłady, pozycje pojazdów, opóźnienia i komunikaty — pochodzą z otwartego API{" "}
                    <Link href="https://zbiorkom.live" target="_blank" rel="noopener noreferrer">
                        zbiorkom.live
                    </Link>
                    , które zbiera i łączy dane przewoźników i organizatorów transportu z całej Polski. Czynalive nie jest powiązany z żadnym
                    przewoźnikiem — w razie rozbieżności wiążący jest rozkład organizatora.
                </Typography>
                {city && sources.length > 0 && (
                    <>
                        <Typography variant="h5" gutterBottom>
                            <strong>Źródła danych: {city.name}</strong>
                        </Typography>
                        <List dense>
                            {sources.map((source, index) => (
                                <ListItem key={`${source.agency}-${source.type}-${index}`} divider>
                                    <ListItemText
                                        primary={SOURCE_TYPES[source.type] ?? source.type}
                                        secondary={
                                            <>
                                                {source.agency} ·{" "}
                                                {source.providerUrl ? (
                                                    <Link href={source.providerUrl} target="_blank" rel="noopener noreferrer">
                                                        {source.provider}
                                                    </Link>
                                                ) : (
                                                    source.provider
                                                )}
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h4" gutterBottom>
                    Prywatność
                </Typography>
                <Typography variant="body1" paragraph>
                    Aplikacja nie wymaga konta. Ulubione, ustawienia i ostatnia pozycja mapy są zapisywane tylko w pamięci Twojej przeglądarki — możesz je
                    przenieść na inne urządzenie funkcją Import/Export ustawień. Lokalizacja GPS jest używana wyłącznie na urządzeniu, do pokazania
                    najbliższych przystanków.
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" align="center">
                    Czynalive v{APP_VERSION} · dane: zbiorkom.live
                </Typography>
            </div>
        </>
    );
}
