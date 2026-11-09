import { useTranslations } from "next-intl";
import { DetailSkeleton } from "./title-detail-view";

export const LoadingDetail = () => {
    const t = useTranslations("Common");
    return (
        <div aria-busy="true">
            <span className="sr-only" role="status">
                {t("loading")}
            </span>
            <DetailSkeleton />
        </div>
    );
};
