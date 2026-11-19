"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@eylulg/ui/empty-state";
import { CircleAlert, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { posterGridClass } from "./styles";

interface ErrorStateProps {
    title: string;
    message: string;
    headingLevel?: 1 | 2 | 3;
    /** For example a retry button. */
    actions?: ReactNode;
}

interface EmptyResultsProps {
    title: string;
    /** 1 when the empty state is the whole page. */
    headingLevel?: 1 | 2 | 3;
    description: ReactNode;
    icon?: LucideIcon;
    actions?: ReactNode;
}

export const ErrorState = ({ title, message, headingLevel, actions }: ErrorStateProps) => (
    <div role="alert">
        <EmptyState title={title} headingLevel={headingLevel} description={message} icon={CircleAlert} primaryAction={actions} />
    </div>
);

export const EmptyResults = ({ title, headingLevel, description, icon = Search, actions }: EmptyResultsProps) => (
    <EmptyState title={title} headingLevel={headingLevel} description={description} icon={icon} primaryAction={actions} />
);

/** Responsive poster grid: 2 columns on phones up to 6 on wide screens. */
export const CardGrid = ({ children }: { children: ReactNode }) => <ul className={posterGridClass}>{children}</ul>;
