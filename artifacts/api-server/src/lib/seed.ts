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
    ["computer", "computer", "Kompyuter savodxonligi", "Компьютерная грамотность"],
    ["ecommerce", "ecommerce", "Onlayn savdo va Uzum", "Онлайн-торговля и Uzum"],
    ["professions", "professions", "Kasb-hunar", "Профессиональные навыки"],
    ["beauty", "beauty", "Go‘zallik va parvarish", "Красота и уход"],
    ["cooking", "cooking", "Pazandachilik", "Кулинария"],
    ["finance", "finance", "Moliya va buxgalteriya", "Финансы и бухгалтерия"],
    ["other", "other", "Boshqa kurslar", "Другие курсы"],
  ];
  for (const [position, values] of categories.entries()) {
    await pool.query("INSERT INTO categories(id,key,name_uz,name_ru,position) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET name_uz=EXCLUDED.name_uz,name_ru=EXCLUDED.name_ru,position=EXCLUDED.position", [...values, position]);
  }
}

