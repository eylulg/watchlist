import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("only publishes the value after it has been stable for the delay", () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: "" } });

        rerender({ value: "d" });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        rerender({ value: "du" });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        rerender({ value: "dune" });
        act(() => {
            vi.advanceTimersByTime(299);
        });
        expect(result.current).toBe("");

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe("dune");
    });
});
