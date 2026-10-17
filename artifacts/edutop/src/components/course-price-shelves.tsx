import type { ReactNode } from "react";
import { useListCourses, type Course } from "@workspace/api-client-react";

export function CoursePriceShelves({ lang, renderCourse, onSelect }: {
  lang: "uz" | "ru"; renderCourse: (course: Course) => ReactNode;
  onSelect: (priceType: "free" | "discounted") => void;
}) {
  const free = useListCourses({ priceType: "free", pageSize: 3, sort: "rating" });
  const discounted = useListCourses({ priceType: "discounted", pageSize: 3, sort: "rating" });
  return <>{([
    { type: "free" as const, title: lang === "uz" ? "Bepul kurslar" : "Бесплатные курсы", query: free },
    { type: "discounted" as const, title: lang === "uz" ? "Chegirmali kurslar" : "Курсы со скидкой", query: discounted },
  ]).map(({ type, title, query }) => <section className="content-section" key={type}>
    <div className="section-heading"><h2>{title}</h2><button className="button button-outline" onClick={() => onSelect(type)}>{lang === "uz" ? "Barchasini ko‘rish" : "Смотреть все"}</button></div>
    {query.isLoading ? <p className="subtle">{lang === "uz" ? "Yuklanmoqda…" : "Загрузка…"}</p>
      : query.isError ? <button className="button button-outline" onClick={() => query.refetch()}>{lang === "uz" ? "Qayta yuklash" : "Повторить загрузку"}</button>
      : query.data?.items.length ? <div className="course-grid">{query.data.items.map(renderCourse)}</div>
      : <p className="subtle">{lang === "uz" ? "Hozircha faol e’lon yo‘q." : "Пока нет актуальных объявлений."}</p>}
  </section>)}</>;
}
