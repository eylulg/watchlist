import type { ReactNode } from "react";
import { AlertCircle, SearchLg } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";

interface ErrorStateProps {
    title?: string;
    error: unknown;
    onRetry?: () => void;
}

export const ErrorState = ({ title = "Something went wrong", error, onRetry }: ErrorStateProps) => {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";

    return (
        <div role="alert" className="overflow-hidden py-12">
            <EmptyState size="md">
                <EmptyState.Header pattern="none">
                    <EmptyState.FeaturedIcon color="error" icon={AlertCircle} />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title className="text-center">{title}</EmptyState.Title>
                    <EmptyState.Description>{message}</EmptyState.Description>
                </EmptyState.Content>
                {onRetry && (
                    <EmptyState.Footer>
                        <Button color="primary" size="md" onClick={onRetry}>
                            Try again
                        </Button>
                    </EmptyState.Footer>
                )}
            </EmptyState>
        </div>
    );
};

interface EmptyResultsProps {
    title: string;
    /** Heading level for the title. Use h1 when the empty state is the whole page. */
    headingAs?: "h1" | "h2" | "h3";
    description: string;
    icon?: typeof SearchLg;
    actions?: ReactNode;
}

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
