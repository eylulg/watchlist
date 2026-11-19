import { useTranslations } from "next-intl";
import Image from "next/image";
import { CirclePlay } from "@/components/app/icons";
import { sectionTitleClass } from "@/components/app/styles";
import type { Video } from "@/lib/tmdb/types";

const videoLinkClass = "group flex flex-col gap-2 rounded-xl outline-focus focus-visible:outline-2 focus-visible:outline-offset-4";

/** Video thumbnails that link out to YouTube or Vimeo. Nothing is embedded, so no third party loads until clicked. */
export const VideoList = ({ videos }: { videos: Video[] }) => {
    const t = useTranslations("Detail");
    if (videos.length === 0) return null;

    return (
        <section aria-labelledby="videos" className="flex flex-col gap-4">
            <h2 id="videos" className={sectionTitleClass}>
                {t("videos")}
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {videos.map((video) => (
                    <li key={video.key}>
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className={videoLinkClass}>
                            <div className="relative aspect-video overflow-hidden rounded-xl bg-tertiary ring-1 ring-default">
                                {video.thumbnailUrl && (
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt=""
                                        fill
                                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                                        className="object-cover"
                                    />
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40">
                                    <CirclePlay aria-hidden="true" className="size-12 text-white drop-shadow" />
                                </span>
                            </div>
                            <span className="line-clamp-2 text-sm font-semibold text-primary group-hover:underline">{video.name}</span>
                            <span className="text-xs text-tertiary">
                                {video.type} · {video.site}
                                <span className="sr-only"> {t("opensInNewTab", { site: video.site })}</span>
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
};
