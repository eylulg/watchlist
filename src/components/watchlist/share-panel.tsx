"use client";

import { useState } from "react";
import { Button } from "@eylulg/ui/button";
import { Checkbox } from "@eylulg/ui/checkbox";
import { Input } from "@eylulg/ui/input";
import { Copy, Link } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { panelClass, panelTitleClass } from "@/components/app/styles";
import { useClipboard } from "@/hooks/use-clipboard";
import type { WatchlistItem } from "@/lib/watchlist/schema";
import { MAX_SHARED_ITEMS, buildShareUrl, encodeSharedList } from "@/lib/watchlist/share";

/** Builds a read only share link. The list lives entirely in the URL fragment; nothing is uploaded. */
export const SharePanel = ({ items }: { items: WatchlistItem[] }) => {
    const t = useTranslations("Share");
    const locale = useLocale();
    const { copy, copied } = useClipboard();
    const [name, setName] = useState("");
    const [includeNotes, setIncludeNotes] = useState(false);
    /** Set when the user asks for a link; the link itself is derived, so it follows later edits. */
    const [origin, setOrigin] = useState<string | null>(null);
    const [copyFailed, setCopyFailed] = useState(false);

    const url = origin === null ? "" : buildShareUrl(origin, locale, encodeSharedList(items, { name, includeNotes }));

    function handleCreate() {
        setOrigin(window.location.origin);
    }

    function handleCopyResult(result: { success: boolean } | undefined) {
        setCopyFailed(!result?.success);
    }

    function handleCopy() {
        copy(url).then(handleCopyResult, handleCopyResult);
    }

    return (
        <section aria-labelledby="share" className={panelClass}>
            <div className="flex flex-col gap-1">
                <h2 id="share" className={panelTitleClass}>
                    {t("title")}
                </h2>
                <p className="text-sm text-tertiary">{t("description")}</p>
                {items.length > MAX_SHARED_ITEMS && <p className="text-sm text-warning">{t("truncated", { max: MAX_SHARED_ITEMS })}</p>}
            </div>
            <Input
                label={t("nameLabel")}
                placeholder={t("namePlaceholder")}
                maxLength={80}
                value={name}
                onChange={setName}
                className="max-w-md"
            />
            <Checkbox isSelected={includeNotes} onChange={setIncludeNotes}>
                {t("includeNotes")}
            </Checkbox>
            <div>
                <Button variant="primary" size="md" iconLeading={Link} onPress={handleCreate}>
                    {t("create")}
                </Button>
            </div>
            {url && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Input label={t("linkLabel")} value={url} isReadOnly className="min-w-0 flex-1" inputClassName="truncate" />
                    <Button variant="secondary" size="md" iconLeading={Copy} onPress={handleCopy}>
                        {copied ? t("copied") : t("copy")}
                    </Button>
                </div>
            )}
            <p role="status" aria-live="polite" className="text-sm text-tertiary">
                {copied ? t("copiedStatus") : copyFailed ? t("copyFailed") : ""}
            </p>
        </section>
    );
};
