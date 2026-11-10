"use client";

import type { ReactNode } from "react";
import { buttonSizes, buttonVariants } from "@eylulg/ui/button";
import { cx } from "@eylulg/ui/cx";
import { useLocale } from "next-intl";
import { Link } from "react-aria-components";
import { getPathname } from "@/i18n/navigation";

interface LinkButtonProps {
    href: string;
    variant?: keyof typeof buttonVariants;
    children: ReactNode;
}

const linkButtonClass =
    "inline-flex h-control-md cursor-pointer items-center justify-center gap-2 rounded-md px-control-x text-sm font-semibold whitespace-nowrap outline-none transition-colors data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-focus";

/** A link that looks like a Button. The library has no link button yet, so it reuses the Button variants. */
export const LinkButton = ({ href, variant = "primary", children }: LinkButtonProps) => {
    const locale = useLocale();
    return (
        <Link href={getPathname({ href, locale })} className={cx(linkButtonClass, buttonSizes.md, buttonVariants[variant])}>
            {children}
        </Link>
    );
};
