import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  ListCategoriesResponse, ListCoursesQueryParams, ListCoursesResponse,
  ListFeaturedCoursesResponse, GetCourseParams, GetCourseResponse,
  CreateCourseBody, CreateCourseResponse, UpdateCourseParams, UpdateCourseBody,
  UpdateCourseResponse, DeleteCourseParams,
} from "@workspace/api-zod";
import { activeCourse, courseOutput, courseSelect, findCourse, HttpError, myTeacher, newId, ownedImage, ownedVideo, safeUrl, userId, optionalUserId } from "../lib/edutop";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const { rows } = await pool.query(`SELECT cat.id,cat.key,cat.name_uz AS "nameUz",cat.name_ru AS "nameRu",
    (SELECT COUNT(*)::int FROM courses c WHERE c.category_id=cat.id AND ${activeCourse}) AS "courseCount"
    FROM categories cat ORDER BY cat.position`);
  res.json(ListCategoriesResponse.parse(rows));
});

router.get("/courses", async (req, res): Promise<void> => {
  const q = ListCoursesQueryParams.parse(req.query);
  const params: unknown[] = [];
  const where = [activeCourse];
  function bind(value: unknown) { params.push(value); return `$${params.length}`; }
  if (q.q?.trim()) {
    const p = bind(`%${q.q.trim().replace(/[%_\\]/g, "\\$&")}%`);
    where.push(`(c.title_uz ILIKE ${p} OR c.title_ru ILIKE ${p} OR c.description_uz ILIKE ${p} OR c.description_ru ILIKE ${p} OR t.full_name_uz ILIKE ${p} OR t.full_name_ru ILIKE ${p})`);
  }
  if (q.category) where.push(`c.category_id=${bind(q.category)}`);
  if (q.deliveryMode) where.push(`c.delivery_mode=${bind(q.deliveryMode)}`);
  if (q.priceType === "free") where.push("c.price_uzs=0");
  if (q.priceType === "discounted") where.push("c.original_price_uzs>c.price_uzs");
  if (q.priceType === "paid") where.push("c.price_uzs>0");
  if (q.city?.trim()) {
    const p = bind(`%${q.city.trim()}%`);
    where.push(`(c.city_uz ILIKE ${p} OR c.city_ru ILIKE ${p})`);
  }
  if (q.minPrice != null) where.push(`c.price_uzs>=${bind(q.minPrice)}`);
  if (q.maxPrice != null) where.push(`c.price_uzs<=${bind(q.maxPrice)}`);
  const predicate = where.join(" AND ");
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM courses c JOIN teachers t ON t.id=c.teacher_id WHERE ${predicate}`, params);
  const orders: Record<string, string> = {
    relevance: "c.featured DESC, rating DESC, rating_count DESC, c.created_at DESC",
    rating: "rating DESC, rating_count DESC, c.created_at DESC",
    newest: "c.created_at DESC",
    priceAsc: "c.price_uzs ASC, rating DESC",
    priceDesc: "c.price_uzs DESC, rating DESC",
  };
  const page = q.page ?? 1, pageSize = q.pageSize ?? 12;
  params.push(pageSize, (page - 1) * pageSize);
  const { rows } = await pool.query(`${courseSelect} WHERE ${predicate} ORDER BY ${orders[q.sort ?? "relevance"]} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json(ListCoursesResponse.parse({ items: rows.map(courseOutput), total: count.rows[0].total, page, pageSize }));
});

router.get("/courses/featured", async (_req, res): Promise<void> => {
  const { rows } = await pool.query(`${courseSelect} WHERE ${activeCourse} AND c.featured=true ORDER BY rating DESC,c.created_at DESC LIMIT 6`);
  res.json(ListFeaturedCoursesResponse.parse(rows.map(courseOutput)));
});

router.get("/courses/:courseId", async (req, res): Promise<void> => {
  const { courseId } = GetCourseParams.parse(req.params);
  let course;
  try { course = await findCourse(courseId); }
  catch (error) {
    if (!(error instanceof HttpError) || !optionalUserId(req)) throw error;
    const teacher = await myTeacher(req);
    course = await findCourse(courseId, teacher.id);
  }
  res.json(GetCourseResponse.parse(course));
});

const fields: Record<string, string> = {
  titleUz: "title_uz", titleRu: "title_ru", descriptionUz: "description_uz", descriptionRu: "description_ru",
  categoryId: "category_id", deliveryMode: "delivery_mode", priceUzs: "price_uzs",
  originalPriceUzs: "original_price_uzs", imageUrl: "image_url", startDate: "start_date",
  endDate: "end_date", listingExpiresAt: "listing_expires_at", status: "status",
  featured: "featured", cityUz: "city_uz", cityRu: "city_ru", scheduleUz: "schedule_uz",
  scheduleRu: "schedule_ru", paymentUrl: "payment_url",
  discountPercent: "discount_percent", resourceUrl: "resource_url",
  videoUrl: "video_url",
};

async function validateCourse(data: Record<string, any>, owner: string, changes: Record<string, any>) {
  data.titleUz = data.titleUz?.trim();
  if (!data.titleUz || data.titleUz.length < 3) throw new HttpError(400, "Kurs nomini kiriting / Укажите название курса");
  data.titleRu = data.titleRu?.trim() || data.titleUz;
  data.descriptionUz ??= "";
  data.descriptionRu = data.descriptionRu?.trim() || data.descriptionUz;
  data.deliveryMode ??= "online";
  data.priceUzs ??= 0;
  if (changes.priceType === "free") {
    data.priceUzs = 0;
    data.originalPriceUzs = null;
    data.discountPercent = null;
  } else if (changes.priceType === "paid") {
    if (data.priceUzs <= 0) throw new HttpError(400, "Pullik kurs narxini kiriting / Укажите цену платного курса");
    data.originalPriceUzs = null;
    data.discountPercent = null;
  } else if (changes.priceType === "discounted" || changes.discountPercent != null ||
    ((changes.originalPriceUzs !== undefined || changes.priceUzs !== undefined) && data.discountPercent != null)) {
    const percent = data.discountPercent;
    const original = data.originalPriceUzs;
    if (!Number.isInteger(original) || original <= 0) throw new HttpError(400, "Asl narxni kiriting / Укажите исходную цену");
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) throw new HttpError(400, "Chegirma foizi 1–100 orasida bo‘lsin / Скидка должна быть от 1 до 100%");
    data.priceUzs = Math.round(original * (100 - percent) / 100);
  } else if (data.originalPriceUzs == null) {
    data.discountPercent = null;
  }
  data.startDate ??= null;
  data.endDate ??= null;
  data.listingExpiresAt ??= new Date(Date.now() + 90 * 86400000);
  if (data.startDate && data.endDate && new Date(data.startDate).getTime() > new Date(data.endDate).getTime()) throw new HttpError(400, "Tugash sanasi boshlanishdan oldin bo‘lmasin / Проверьте даты");
  const expiry = new Date(data.listingExpiresAt);
  if (!Number.isFinite(expiry.getTime())) throw new HttpError(400, "Noto‘g‘ri sana / Неверная дата");
  if (data.status !== "draft" && expiry.getTime() <= Date.now()) throw new HttpError(400, "E’lon muddati kelajakda bo‘lishi kerak / Укажите будущую дату");
  if (data.originalPriceUzs != null && data.originalPriceUzs <= data.priceUzs) {
    throw new HttpError(400, "Eski narx yangi narxdan yuqori bo‘lsin / Старая цена должна быть выше");
  }
  const { rowCount } = await pool.query("SELECT 1 FROM categories WHERE id=$1", [data.categoryId]);
  if (!rowCount) throw new HttpError(400, "Yo‘nalishni tanlang / Выберите категорию");
  data.paymentUrl = safeUrl(data.paymentUrl);
  data.resourceUrl = safeUrl(data.resourceUrl);
  data.imageUrl = await ownedImage(data.imageUrl, owner);
  data.videoUrl = await ownedVideo(data.videoUrl, owner);
}

router.post("/courses", async (req, res): Promise<void> => {
  const data = CreateCourseBody.parse(req.body);
  const teacher = await myTeacher(req);
  const input: Record<string, any> = { ...data, status: data.status ?? "published" };
  await validateCourse(input, userId(req), data);
  const entries = Object.entries(input).filter(([key]) => fields[key]);
  const id = newId();
  const columns = entries.map(([key]) => fields[key]);
  const values = entries.map(([, value]) => value);
  await pool.query(`INSERT INTO courses(id,teacher_id,${columns.join(",")}) VALUES($1,$2,${values.map((_, i) => `$${i + 3}`).join(",")})`, [id, teacher.id, ...values]);
  res.status(201).json(CreateCourseResponse.parse(await findCourse(id, teacher.id)));
});

router.patch("/courses/:courseId", async (req, res): Promise<void> => {
  const { courseId } = UpdateCourseParams.parse(req.params);
  const data = UpdateCourseBody.parse(req.body);
  const teacher = await myTeacher(req);
  const old = await findCourse(courseId, teacher.id);
  const input = { ...old, ...data, status: data.status ?? (old.status === "expired" ? "published" : old.status) };
  if (input.status === "published" && old.status === "expired" && !data.listingExpiresAt) input.listingExpiresAt = new Date(Date.now() + 90 * 86400000);
  await validateCourse(input, userId(req), data);
  const entries = Object.entries(input).filter(([key]) => fields[key]);
  await pool.query(`UPDATE courses SET ${entries.map(([key], i) => `${fields[key]}=$${i + 1}`).join(",")} WHERE id=$${entries.length + 1} AND teacher_id=$${entries.length + 2}`, [...entries.map(([, value]) => value), courseId, teacher.id]);
  res.json(UpdateCourseResponse.parse(await findCourse(courseId, teacher.id)));
});

router.delete("/courses/:courseId", async (req, res): Promise<void> => {
  const { courseId } = DeleteCourseParams.parse(req.params);
  const teacher = await myTeacher(req);
  const { rowCount } = await pool.query("UPDATE courses SET status='deleted' WHERE id=$1 AND teacher_id=$2 AND status<>'deleted'", [courseId, teacher.id]);
  if (!rowCount) throw new HttpError(404, "Kurs topilmadi / Курс не найден");
  res.status(204).end();
});

export default router;
