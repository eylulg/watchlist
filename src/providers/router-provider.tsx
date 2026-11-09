import { type PropsWithChildren } from "react";
import { RouterProvider } from "react-aria-components";
import { useHref, useNavigate } from "react-router";
import type { NavigateOptions } from "react-router";

declare module "react-aria-components" {
    interface RouterConfig {
        routerOptions: NavigateOptions;
    }
}

/** Lets Untitled UI (React Aria) links navigate through React Router, including the GitHub Pages basename. */
export const RouteProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();

    return (
        <RouterProvider
            navigate={(to, options) => {
                void navigate(to, options);
            }}
            useHref={useHref}
        >
            {children}
        </RouterProvider>
    );
};
