import { useTranslations } from "next-intl";
import { stableHeightClass } from "@/components/app/styles";
import { DetailSkeleton } from "./title-detail-view";

export const LoadingDetail = () => {
    const t = useTranslations("Common");
    return (
        <div aria-busy="true" className={stableHeightClass}>
            <span className="sr-only" role="status">
                {t("loading")}
            </span>
            <DetailSkeleton />
        </div>
    );
};
