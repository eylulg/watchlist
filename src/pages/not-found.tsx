import { FileQuestion02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { EmptyResults } from "@/components/catalogue/status-states";
import { useDocumentTitle } from "@/hooks/use-document-title";

export const NotFoundPage = ({ title = "Page not found", description }: { title?: string; description?: string }) => {
    useDocumentTitle(title);

    return (
        <div>
            <EmptyResults
                headingAs="h1"
                icon={FileQuestion02}
                title={title}
                description={description ?? "The page you are looking for does not exist or has moved."}
                actions={
                    <>
                        <Button href="/" color="primary">
                            Go to home
                        </Button>
                        <Button href="/movies" color="secondary">
                            Browse movies
                        </Button>
                    </>
                }
            />
        </div>
    );
};
