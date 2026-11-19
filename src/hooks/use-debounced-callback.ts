import { useEffect, useRef, useState } from "react";

interface Debounced<A extends unknown[]> {
    /** Calls the callback once `delay` ms have passed without another call. */
    run: (...args: A) => void;
    cancel: () => void;
}

/** A debounced version of `callback` that keeps the same identity for the life of the component. */
export const useDebouncedCallback = <A extends unknown[]>(callback: (...args: A) => void, delay: number): Debounced<A> => {
    const latest = useRef(callback);
    const timer = useRef<number | undefined>(undefined);
    const [debounced] = useState<Debounced<A>>(() => ({
        run: (...args) => {
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
                latest.current(...args);
            }, delay);
        },
        cancel: () => {
            window.clearTimeout(timer.current);
        },
    }));

    useEffect(() => {
        latest.current = callback;
    }, [callback]);

    useEffect(() => debounced.cancel, [debounced]);

    return debounced;
};
