"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@eylulg/ui/empty-state";
import { CircleAlert, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { posterGridClass } from "./styles";

interface ErrorStateProps {
    title: string;
    message: string;
    /** For example a retry button. */
    actions?: ReactNode;
}

interface EmptyResultsProps {
    title: string;
    /** Use h1 when the empty state is the whole page. */
    headingAs?: "h1" | "h2" | "h3";
    description: ReactNode;
    icon?: LucideIcon;
    actions?: ReactNode;
}

const HEADING_LEVELS = { h1: 2, h2: 2, h3: 3 } as const;

export const ErrorState = ({ title, message, actions }: ErrorStateProps) => (
    <div role="alert">
        <EmptyState title={title} description={message} icon={CircleAlert} primaryAction={actions} />
    </div>
);

/** The library's EmptyState starts at h2, so a page that is only an empty state gets a hidden h1 above it. */
export const EmptyResults = ({ title, headingAs = "h2", description, icon = Search, actions }: EmptyResultsProps) => {
    const t = useTranslations("Nav");
    return (
        <>
            {headingAs === "h1" && <h1 className="sr-only">{t("brand")}</h1>}
            <EmptyState
                title={title}
                headingLevel={HEADING_LEVELS[headingAs]}
                description={description}
                icon={icon}
                primaryAction={actions}
            />
        </>
    );
};

/** Responsive poster grid: 2 columns on phones up to 6 on wide screens. */
export const CardGrid = ({ children }: { children: ReactNode }) => <ul className={posterGridClass}>{children}</ul>;
