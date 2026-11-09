import { useState } from "react";
import { Heart } from "@untitledui/icons";
import type { MediaType } from "@/api/tmdb";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { PageHeading } from "@/components/catalogue/page-heading";
import { EmptyResults } from "@/components/catalogue/status-states";
import { TitleGrid } from "@/components/catalogue/title-grid";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useFavorites } from "@/lib/favorites";

type Filter = "all" | MediaType;

export const FavoritesPage = () => {
    useDocumentTitle("Favorites");
    const { favorites, isPersisted } = useFavorites();
    const [filter, setFilter] = useState<Filter>("all");

    const tabs: { id: Filter; label: string; count: number }[] = [
        { id: "all", label: "All", count: favorites.length },
        { id: "movie", label: "Movies", count: favorites.filter((f) => f.mediaType === "movie").length },
        { id: "tv", label: "Series", count: favorites.filter((f) => f.mediaType === "tv").length },
    ];

    return (
        <>
            <PageHeading title="Favorites" description="Saved on this device. Nothing leaves your browser." />

            {!isPersisted && (
                <p role="alert" className="mb-6 rounded-lg bg-warning-primary px-4 py-3 text-sm text-warning-primary">
                    Your browser blocked storage, so favorites will be lost when you close this tab.
                </p>
            )}

            {favorites.length === 0 ? (
                <EmptyResults
                    icon={Heart}
                    title="No favorites yet"
                    description="Use the heart on any movie or series to keep it here."
                    actions={
                        <>
                            <Button href="/movies" color="primary">
                                Browse movies
                            </Button>
                            <Button href="/series" color="secondary">
                                Browse series
                            </Button>
                        </>
                    }
                />
            ) : (
                <Tabs
                    selectedKey={filter}
                    onSelectionChange={(key) => {
                        setFilter(key === "movie" || key === "tv" ? key : "all");
                    }}
                    className="flex flex-col gap-6"
                >
                    <TabList
                        aria-label="Filter favorites"
                        type="underline"
                        size="sm"
                        items={tabs.map((tab) => ({ id: tab.id, label: tab.label, badge: String(tab.count) }))}
                    >
                        {(tab) => <Tab {...tab} />}
                    </TabList>
                    {tabs.map((tab) => {
                        const items = tab.id === "all" ? favorites : favorites.filter((f) => f.mediaType === tab.id);
                        return (
                            <TabPanel key={tab.id} id={tab.id}>
                                <h2 className="sr-only">{tab.label} favorites</h2>
                                <p role="status" aria-live="polite" className="pb-4 text-sm text-tertiary">
                                    {items.length} {items.length === 1 ? "favorite" : "favorites"}
                                </p>
                                {items.length > 0 ? (
                                    <TitleGrid titles={items} label={`${tab.label} favorites`} />
                                ) : (
                                    <EmptyResults
                                        title={`No ${tab.label.toLowerCase()} saved`}
                                        description="Favorites of this type will show up here."
                                        icon={Heart}
                                    />
                                )}
                            </TabPanel>
                        );
                    })}
                </Tabs>
            )}
        </>
    );
};
