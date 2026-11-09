import { useSyncExternalStore } from "react";
import { vi } from "vitest";

/**
 * A stand-in for Next's app router: a URL that `replace` and `push` change, so components that read
 * `useSearchParams` re-render the way they do in the browser.
 */
let url = new URL("http://localhost:3000/en");
const listeners = new Set<() => void>();

const navigate = (href: string) => {
    url = new URL(href, url);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const router = {
    push: vi.fn(navigate),
    replace: vi.fn(navigate),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
};

export const setUrl = (href: string) => {
    url = new URL(href, "http://localhost:3000");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
};

export const currentUrl = () => url;

export const navigationMock = {
    useRouter: () => router,
    usePathname: () => useSyncExternalStore(subscribe, () => url.pathname),
    useSearchParams: () => new URLSearchParams(useSyncExternalStore(subscribe, () => url.search)),
    useParams: () => ({ locale: url.pathname.split("/")[1] ?? "en" }),
    notFound: () => {
        throw new Error("NEXT_NOT_FOUND");
    },
    redirect: (href: string) => {
        throw new Error(`NEXT_REDIRECT ${href}`);
    },
    permanentRedirect: (href: string) => {
        throw new Error(`NEXT_REDIRECT ${href}`);
    },
};
