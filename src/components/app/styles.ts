import { cx } from "@eylulg/ui/cx";

/** Class strings shared by several components, so each lives in exactly one place. */

export const pageTitleClass = "text-2xl font-semibold text-primary md:text-3xl";
export const pageIntroClass = "max-w-prose text-md text-tertiary";
export const sectionTitleClass = "text-lg font-semibold text-primary md:text-xl";
export const panelClass = "flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-default md:p-6";
export const panelTitleClass = "text-lg font-semibold text-primary";
export const inlineLinkClass = "font-semibold text-brand underline-offset-2 outline-focus hover:underline focus-visible:outline-2";
export const backLinkClass = cx(inlineLinkClass, "flex items-center gap-1 self-start text-sm");
export const sideLinkClass = cx(inlineLinkClass, "self-start text-sm");
export const cardClass = "h-full";
export const posterGridClass = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6";
export const statusTextClass = "text-sm text-tertiary";
