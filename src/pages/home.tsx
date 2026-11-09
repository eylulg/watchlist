import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "@untitledui/icons";
import { trendingQuery } from "@/api/queries";
import { MEDIA_LABEL, type MediaType, type TimeWindow } from "@/api/tmdb";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { ErrorState } from "@/components/catalogue/status-states";
import { TitleCard, TitleCardSkeleton } from "@/components/catalogue/title-card";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ROW_POSTER_SIZES } from "@/lib/images";
import { listPath } from "@/lib/paths";

const rowItemClass = "w-36 shrink-0 snap-start sm:w-44";
const rowClass = "-mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 md:-mx-8 md:scroll-px-8 md:px-8";

const TrendingRow = ({ mediaType, timeWindow, heading }: { mediaType: MediaType; timeWindow: TimeWindow; heading: string }) => {
    const { data, isPending, isError, error, refetch } = useQuery(trendingQuery(mediaType, timeWindow));
    const headingId = `trending-${mediaType}-${timeWindow}`;

    return (
        <section aria-labelledby={headingId} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <h2 id={headingId} className="text-lg font-semibold text-primary md:text-xl">
                    {heading}
                </h2>
                <Button href={listPath[mediaType]} color="link-color" size="sm" iconTrailing={ArrowRight}>
                    All {MEDIA_LABEL[mediaType].plural}
                </Button>
            </div>
            {isPending ? (
                <div role="status" aria-label={`Loading ${heading.toLowerCase()}`} className={rowClass}>
                    {Array.from({ length: 6 }, (_, i) => (
                        <TitleCardSkeleton key={i} className={rowItemClass} />
                    ))}
                </div>
            ) : isError ? (
                <ErrorState
                    title={`We could not load ${heading.toLowerCase()}`}
                    error={error}
                    onRetry={() => {
                        void refetch();
                    }}
                />
            ) : (
                <ul aria-labelledby={headingId} className={rowClass}>
                    {data.results.map((title, index) => (
                        <li key={title.id} className={rowItemClass}>
                            <TitleCard title={title} sizes={ROW_POSTER_SIZES} priority={index < 3} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

const windows: { id: TimeWindow; label: string }[] = [
    { id: "week", label: "This week" },
    { id: "day", label: "Today" },
];

export const HomePage = () => {
    useDocumentTitle(undefined);
    const [timeWindow, setTimeWindow] = useState<TimeWindow>("week");

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary md:text-display-md">Streaming catalogue</h1>
                <p className="max-w-2xl text-md text-tertiary md:text-lg">
                    What people are watching right now. Browse trending movies and series, open any title for cast and details, and keep a
                    list of favorites.
                </p>
            </div>

            <Tabs
                selectedKey={timeWindow}
                onSelectionChange={(key) => {
                    setTimeWindow(key === "day" ? "day" : "week");
                }}
                className="flex flex-col gap-6"
            >
                <TabList aria-label="Trending period" type="button-gray" size="sm" items={windows}>
                    {(item) => <Tab id={item.id}>{item.label}</Tab>}
                </TabList>
                {windows.map((w) => (
                    <TabPanel key={w.id} id={w.id} className="flex flex-col gap-10">
                        <TrendingRow mediaType="movie" timeWindow={w.id} heading="Trending movies" />
                        <TrendingRow mediaType="tv" timeWindow={w.id} heading="Trending series" />
                    </TabPanel>
                ))}
            </Tabs>
        </div>
    );
};
