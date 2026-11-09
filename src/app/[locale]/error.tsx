"use client";

import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/app/states";
import { Button } from "@/components/base/buttons/button";

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
                    <Button size="md" onClick={reset}>
                        {t("retry")}
                    </Button>
                }
            />
        </div>
    );
}
