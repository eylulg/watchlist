import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";
import { createQueryClient } from "@/api/queries";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import "@/styles/globals.css";

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
const queryClient = createQueryClient();

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
    <StrictMode>
        <AppProviders queryClient={queryClient}>
            <RouterProvider router={router} />
        </AppProviders>
    </StrictMode>,
);
