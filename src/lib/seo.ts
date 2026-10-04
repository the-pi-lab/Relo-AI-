import { useEffect } from "react";
import { absUrl } from "./site";

/**
 * Per-route document metadata (AEO/GEO).
 *
 * index.html ships the site-wide tags and JSON-LD statically so crawlers see
 * them without executing JS. This hook keeps the head correct for routes as
 * the user navigates within the SPA, so Google and answer engines that do run
 * JS get the right title/description per page.
 */
interface Seo {
  title: string;
  description: string;
  /** Public path, e.g. "/privacy". Omit for the home page. */
  path?: string;
  /** Set false for pages that should not be indexed (auth, demo). */
  index?: boolean;
}

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeo({ title, description, path = "/", index = true }: Seo) {
  useEffect(() => {
    document.title = title;

    const url = absUrl(path);
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", index ? "index, follow" : "noindex, nofollow");
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, path, index]);
}
