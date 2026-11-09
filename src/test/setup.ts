import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";
import { requests, server } from "./server";

expect.extend(axeMatchers);

// jsdom gaps that the UI library and layout rely on.
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
window.scrollTo = vi.fn();

beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
    cleanup();
    server.resetHandlers();
    requests.length = 0;
    window.localStorage.clear();
    document.documentElement.classList.remove("dark-mode");
});

afterAll(() => {
    server.close();
});
