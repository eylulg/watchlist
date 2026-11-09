"use client";

import type { ReactNode } from "react";
import { AlertCircle, SearchLg } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
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
    icon?: typeof SearchLg;
    actions?: ReactNode;
}

export const ErrorState = ({ title, message, actions }: ErrorStateProps) => (
    <div role="alert" className="overflow-hidden py-12">
        <EmptyState size="md">
            <EmptyState.Header pattern="none">
                <EmptyState.FeaturedIcon color="error" icon={AlertCircle} />
            </EmptyState.Header>
            <EmptyState.Content>
                <EmptyState.Title as="h2" className="text-center">
                    {title}
                </EmptyState.Title>
                <EmptyState.Description>{message}</EmptyState.Description>
            </EmptyState.Content>
            {actions && <EmptyState.Footer className="flex-wrap justify-center">{actions}</EmptyState.Footer>}
        </EmptyState>
    </div>
);

export const EmptyResults = ({ title, headingAs = "h2", description, icon = SearchLg, actions }: EmptyResultsProps) => (
    <div className="overflow-hidden py-12">
        <EmptyState size="md">
            <EmptyState.Header pattern="circle">
                <EmptyState.FeaturedIcon color="gray" icon={icon} />
            </EmptyState.Header>
            <EmptyState.Content>
                <EmptyState.Title as={headingAs} className="text-center">
                    {title}
                </EmptyState.Title>
                <EmptyState.Description>{description}</EmptyState.Description>
            </EmptyState.Content>
            {actions && <EmptyState.Footer className="flex-wrap justify-center">{actions}</EmptyState.Footer>}
        </EmptyState>
    </div>
);

/** Responsive poster grid: 2 columns on phones up to 6 on wide screens. */
export const CardGrid = ({ children }: { children: ReactNode }) => <ul className={posterGridClass}>{children}</ul>;
