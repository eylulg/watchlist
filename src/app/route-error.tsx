import { isRouteErrorResponse, useRouteError } from "react-router";
import { ErrorState } from "@/components/catalogue/status-states";

/** Last line of defence for errors thrown while rendering or loading a route chunk. */
export const RouteError = () => {
    const error = useRouteError();
    const message = isRouteErrorResponse(error) ? `${String(error.status)} ${error.statusText}` : error;

    return (
        <div className="mx-auto max-w-7xl px-4 md:px-8">
            <ErrorState
                error={message instanceof Error ? message : new Error(typeof message === "string" ? message : "The page failed to load.")}
                onRetry={() => {
                    window.location.reload();
                }}
            />
        </div>
    );
};
