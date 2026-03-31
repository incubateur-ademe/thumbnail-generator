import { useEffect, useState } from "react";
import { extractSvgInner } from "@/lib/svgUtils";

/**
 * Fetches and caches SVG content for extras that have a srcUrl.
 * Returns a record mapping srcUrl → extracted SVG inner HTML.
 */
export function useSvgCache(
  extras: Array<{ srcUrl?: string }>,
): Record<string, string> {
  const [cache, setCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const toFetch = extras.filter(
      (e) => e.srcUrl && !(e.srcUrl in cache),
    );
    if (!toFetch.length) return;
    let cancelled = false;
    Promise.all(
      toFetch.map(async (e) => {
        const res = await fetch(
          `${import.meta.env.BASE_URL}${e.srcUrl!.replace(/^\//, "")}`,
        );
        const text = await res.text();
        return [e.srcUrl!, extractSvgInner(text)] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled)
          setCache((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [extras, cache]);

  return cache;
}
