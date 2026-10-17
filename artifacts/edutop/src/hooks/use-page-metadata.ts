import { useEffect } from "react";
import type { Lang } from "@/i18n";

declare const __EDUTOP_PUBLIC_SITE_URL__: string;

export const HOME_SEO = {
  uz: { title: "EduTop — Kurs topish: bepul, onlayn va oflayn kurslar", description: "EduTop’da IT, kompyuter, Uzum savdosi, til va kasb-hunar kurslarini toping. Bepul va chegirmali kurslar, o‘qituvchi profillari va bevosita muloqot." },
  ru: { title: "EduTop — Найти курсы: бесплатно, онлайн и офлайн", description: "Найдите курсы IT, компьютерных навыков, торговли на Uzum, языков и профессий. Бесплатные курсы, скидки, отзывы и прямое общение с преподавателями." },
  en: { title: "EduTop — Find courses: free, online and in person", description: "Find IT, computer skills, Uzum selling, language and professional courses. Browse free courses and discounts, read reviews and contact teachers directly." },
};

function meta(key: string, value: string, property = false) {
  const attribute = property ? "property" : "name";
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}

export function setPageMetadata(title: string, description: string) {
  document.title = title;
  meta("description", description.replace(/\s+/g, " ").trim().slice(0, 170));
  meta("og:title", title, true);
  meta("og:description", description, true);
  meta("twitter:title", title);
  meta("twitter:description", description);
}

export function usePublicPageMetadata(title: string, description: string, lang: Lang) {
  useEffect(() => { setPageMetadata(title, description); }, [title, description, lang]);
}

export function setIndexingMetadata(path: string, privatePage: boolean) {
  meta("robots", privatePage || import.meta.env.DEV ? "noindex, nofollow" : "index, follow");
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (privatePage || !__EDUTOP_PUBLIC_SITE_URL__) {
    canonical?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
    return;
  }
  const url = new URL(path.split("?")[0], `${__EDUTOP_PUBLIC_SITE_URL__}/`).href;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = url;
  meta("og:url", url, true);
}
