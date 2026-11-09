import { useEffect } from "react";

export const useDocumentTitle = (title: string | undefined) => {
    useEffect(() => {
        document.title = title ? `${title} | Streaming catalogue` : "Streaming catalogue";
    }, [title]);
};
