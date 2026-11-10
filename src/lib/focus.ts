/** Library selects and buttons render their own focusable element, so focus the first one inside a wrapper. */
export const focusFirstControl = (container: HTMLElement | null) => {
    container?.querySelector<HTMLElement>("button, a[href], input, textarea")?.focus();
};
