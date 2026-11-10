"use client";

import { Button } from "@eylulg/ui/button";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/app/states";

/** Next passes `error` too; its message is not shown because it can carry server details. */
export default function ErrorPage({ reset }: { reset: () => void }) {
    const t = useTranslations("Errors");

    return (
        <div className="flex flex-col gap-4">
            <h1 className="sr-only">{t("pageTitle")}</h1>
            <ErrorState
                title={t("pageTitle")}
                message={t("pageMessage")}
                actions={
                    <Button size="md" onPress={reset}>
                        {t("retry")}
                    </Button>
                }
            />
        </div>
    );
}
