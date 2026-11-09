import { Heart } from "@untitledui/icons";
import type { TitleSummary } from "@/api/tmdb";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useFavorites } from "@/lib/favorites";
import { cx } from "@/utils/cx";

/** Compact heart button used on cards. */
export const FavoriteToggle = ({ title, className }: { title: TitleSummary; className?: string }) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const active = isFavorite(title);
    const label = active ? `Remove ${title.title} from favorites` : `Add ${title.title} to favorites`;

    return (
        <ButtonUtility
            aria-label={label}
            aria-pressed={active}
            color="secondary"
            size="sm"
            className={cx("bg-primary/90 backdrop-blur", className)}
            icon={<Heart data-icon aria-hidden="true" className={cx(active && "fill-current text-fg-error-primary")} />}
            onPress={() => {
                toggleFavorite(title);
            }}
        />
    );
};
