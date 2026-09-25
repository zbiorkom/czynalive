import { createPersistedStore } from "./persisted";

export type FavouriteStop = { id: string; name: string; code?: string };
export type FavouriteRoute = { id: string; name: string; type: number; color?: string; textColor?: string };
export type FavouriteVehicle = { id: string; name: string; type: number };

export type CityFavourites = {
    stops: FavouriteStop[];
    routes: FavouriteRoute[];
    vehicles: FavouriteVehicle[];
};

export const EMPTY_FAVOURITES: CityFavourites = { stops: [], routes: [], vehicles: [] };

export const favouritesStore = createPersistedStore<Record<string, CityFavourites>>("czynalive:favourites", {});

export const useFavourites = (city: string) => {
    const [all, set] = favouritesStore.useStore();
    const favourites = all[city] ?? EMPTY_FAVOURITES;

    const toggle = <K extends keyof CityFavourites>(kind: K, item: CityFavourites[K][number]) => {
        set((prev) => {
            const current = prev[city] ?? EMPTY_FAVOURITES;
            const list = current[kind] as { id: string }[];
            const exists = list.some((entry) => entry.id === item.id);
            return {
                [city]: {
                    ...current,
                    [kind]: exists ? list.filter((entry) => entry.id !== item.id) : [...list, item],
                },
            };
        });
    };

    const reorder = <K extends keyof CityFavourites>(kind: K, items: CityFavourites[K]) => {
        set((prev) => ({ [city]: { ...(prev[city] ?? EMPTY_FAVOURITES), [kind]: items } }));
    };

    const has = (kind: keyof CityFavourites, id: string) => (favourites[kind] as { id: string }[]).some((entry) => entry.id === id);

    return { favourites, toggle, reorder, has };
};
