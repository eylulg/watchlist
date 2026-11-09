import type { ReactNode } from "react";

export const PageHeading = ({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) => (
    <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
            <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">{title}</h1>
            {description && <p className="text-md text-tertiary">{description}</p>}
        </div>
        {children}
    </div>
);
