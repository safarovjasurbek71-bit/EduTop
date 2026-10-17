import type { ReactNode } from "react";
import { type Lang, tr } from "@/i18n";
import { useListCourses, type Course } from "@workspace/api-client-react";

export function CoursePriceShelves({ lang, renderCourse, onSelect }: {
  lang: Lang; renderCourse: (course: Course) => ReactNode;
  onSelect: (priceType: "free" | "discounted") => void;
}) {
  const free = useListCourses({ priceType: "free", pageSize: 3, sort: "rating" });
  const discounted = useListCourses({ priceType: "discounted", pageSize: 3, sort: "rating" });
  return <>{([
    { type: "free" as const, title: tr("Bepul kurslar", "Бесплатные курсы", lang), query: free },
    { type: "discounted" as const, title: tr("Chegirmali kurslar", "Курсы со скидкой", lang), query: discounted },
  ]).map(({ type, title, query }) => <section className="content-section" key={type}>
    <div className="section-heading"><h2>{title}</h2><button className="button button-outline" onClick={() => onSelect(type)}>{tr("Barchasini ko‘rish", "Смотреть все", lang)}</button></div>
    {query.isLoading ? <p className="subtle">{tr("Yuklanmoqda…", "Загрузка…", lang)}</p>
      : query.isError ? <button className="button button-outline" onClick={() => query.refetch()}>{tr("Qayta yuklash", "Повторить загрузку", lang)}</button>
      : query.data?.items.length ? <div className="course-grid">{query.data.items.map(renderCourse)}</div>
      : <p className="subtle">{tr("Hozircha faol e’lon yo‘q.", "Пока нет актуальных объявлений.", lang)}</p>}
  </section>)}</>;
}
