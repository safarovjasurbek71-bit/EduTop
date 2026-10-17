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

/** Explicitly labelled development-only examples; never seeded into production. */
export async function seedDevelopmentExamples() {
  if (process.env.NODE_ENV !== "development") return;
  const examples = [
    {
      id: "demo-ielts", teacher: "demo-language-teacher", name: "Namuna o‘qituvchi", nameRu: "Демо-преподаватель",
      title: "Namuna: IELTS tayyorlov kursi", titleRu: "Пример: подготовка к IELTS",
      category: "languages", price: 500000, original: 650000, mode: "online",
      description: "Bu EduTop imkoniyatlarini ko‘rsatish uchun namuna e’lon, haqiqiy kurs taklifi emas. IELTS bo‘yicha o‘qish, tinglash, yozish va gapirish dasturi qanday ko‘rinishini ko‘ring.",
      descriptionRu: "Это демонстрационное объявление EduTop, а не реальное предложение. Пример программы подготовки по чтению, аудированию, письму и разговорной речи IELTS.",
    },
    {
      id: "demo-frontend", teacher: "demo-tech-teacher", name: "Namuna IT mutaxassisi", nameRu: "Демо IT-специалист",
      title: "Namuna: Frontend dasturlash", titleRu: "Пример: Frontend-разработка",
      category: "technology", price: 0, original: null, mode: "online",
      description: "Bu haqiqiy kurs emas — EduTop’dagi bepul kurs e’loni namunasi. HTML, CSS va JavaScript asoslari, amaliy loyihalar va web dasturlash bilan tanishing.",
      descriptionRu: "Это не реальный курс, а пример бесплатного объявления EduTop. Знакомство с HTML, CSS, JavaScript и учебными веб-проектами.",
    },
    {
      id: "demo-design", teacher: "demo-design-teacher", name: "Namuna dizayn o‘qituvchisi", nameRu: "Демо-преподаватель дизайна",
      title: "Namuna: Grafik dizayn asoslari", titleRu: "Пример: основы графического дизайна",
      category: "design", price: 350000, original: 500000, mode: "offline",
      description: "EduTop’ning namuna e’loni — haqiqiy o‘quv kursi emas. Kompozitsiya, ranglar, tipografiya va portfolio tayyorlash bo‘yicha o‘quv dasturi misoli.",
      descriptionRu: "Демонстрационное объявление EduTop — не реальный учебный курс. Пример программы по композиции, цвету, типографике и созданию портфолио.",
    },
  ];
  for (const example of examples) {
    await pool.query(`INSERT INTO teachers(id,full_name_uz,full_name_ru,specialization_uz,specialization_ru,bio_uz,bio_ru,city_uz,city_ru)
      VALUES($1,$2,$3,$4,$4,$5,$6,'Toshkent','Ташкент') ON CONFLICT(id) DO NOTHING`,
      [example.teacher, example.name, example.nameRu, example.category, "Namuna profil — haqiqiy o‘qituvchi emas.", "Демонстрационный профиль, не реальный преподаватель."]);
    const start = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);
    const expiry = new Date(Date.now() + 150 * 86400000).toISOString();
    await pool.query(`INSERT INTO courses(id,teacher_id,title_uz,title_ru,description_uz,description_ru,category_id,delivery_mode,
      price_uzs,original_price_uzs,start_date,end_date,listing_expires_at,featured,city_uz,city_ru,schedule_uz,schedule_ru)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,'Toshkent','Ташкент','Haftada 3 marta','3 раза в неделю')
      ON CONFLICT(id) DO NOTHING`,
      [example.id, example.teacher, example.title, example.titleRu, example.description, example.descriptionRu, example.category, example.mode, example.price, example.original, start, end, expiry]);
  }
}
