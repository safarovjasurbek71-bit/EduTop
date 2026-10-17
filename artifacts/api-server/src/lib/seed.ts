import { pool } from "@workspace/db";

export async function seedTaxonomy() {
  const categories = [
    ["languages", "languages", "Chet tillari", "Иностранные языки"],
    ["technology", "technology", "Dasturlash va IT", "Программирование и IT"],
    ["design", "design", "Dizayn", "Дизайн"],
    ["business", "business", "Biznes va marketing", "Бизнес и маркетинг"],
    ["science", "science", "Aniq fanlar", "Точные науки"],
    ["creative", "creative", "Ijod va san’at", "Творчество и искусство"],
    ["personal", "personal", "Shaxsiy rivojlanish", "Личное развитие"],
    ["other", "other", "Boshqa kurslar", "Другие курсы"],
  ];
  for (const [position, values] of categories.entries()) {
    await pool.query("INSERT INTO categories(id,key,name_uz,name_ru,position) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING", [...values, position]);
  }
}

