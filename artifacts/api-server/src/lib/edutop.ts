import { createHash, randomUUID } from "node:crypto";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import type { Request } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const newId = () => randomUUID();

export function optionalUserId(req: Request): string | null {
  return getAuth(req).userId || req.telegramPrincipal || null;
}

export function userId(req: Request): string {
  const id = optionalUserId(req);
  if (!id) throw new HttpError(401, "Kirish talab qilinadi / Требуется вход");
  return id;
}

export async function myTeacher(req: Request) {
  const id = userId(req);
  await pool.query(
    `INSERT INTO teachers (id,clerk_id,full_name_uz,full_name_ru)
     VALUES ($1,$2,$3,$4) ON CONFLICT (clerk_id) DO NOTHING`,
    [newId(), id, req.telegramDisplayName || "O‘qituvchi", req.telegramDisplayName || "Преподаватель"],
  );
  const { rows } = await pool.query("SELECT * FROM teachers WHERE clerk_id=$1", [id]);
  return rows[0];
}

export function camel(row: Record<string, unknown>): Record<string, any> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
    value instanceof Date ? value.toISOString() : value,
  ]));
}

export const teacherColumns = `t.*, COALESCE((SELECT ROUND(AVG(stars)::numeric,1) FROM reviews WHERE teacher_id=t.id),0)::float AS rating,
 (SELECT COUNT(*)::int FROM reviews WHERE teacher_id=t.id) AS rating_count, false AS verified`;

export const courseSelect = `SELECT c.*,
 COALESCE((SELECT ROUND(AVG(stars)::numeric,1) FROM reviews WHERE course_id=c.id),0)::float AS rating,
 (SELECT COUNT(*)::int FROM reviews WHERE course_id=c.id) AS rating_count,
 jsonb_build_object('id',t.id,'fullNameUz',t.full_name_uz,'fullNameRu',t.full_name_ru,
 'avatarUrl',t.avatar_url,'cityUz',t.city_uz,'cityRu',t.city_ru,
 'rating',COALESCE((SELECT ROUND(AVG(stars)::numeric,1) FROM reviews WHERE teacher_id=t.id),0),
 'ratingCount',(SELECT COUNT(*) FROM reviews WHERE teacher_id=t.id),'verified',false) AS teacher
 FROM courses c JOIN teachers t ON t.id=c.teacher_id`;
export const activeCourse = `c.status='published' AND c.listing_expires_at>NOW()`;

export function courseOutput(row: Record<string, any>) {
  const result = camel(row);
  if (result.status === "published" && new Date(result.listingExpiresAt).getTime() <= Date.now()) result.status = "expired";
  return result;
}

export async function findCourse(id: string, ownerId?: string) {
  const { rows } = await pool.query(`${courseSelect} WHERE c.id=$1 AND ${
    ownerId ? "c.teacher_id=$2 AND c.status<>'deleted'" : activeCourse
  }`, ownerId ? [id, ownerId] : [id]);
  if (!rows[0]) throw new HttpError(404, "Kurs topilmadi / Курс не найден");
  return courseOutput(rows[0]);
}

export async function throttle(req: Request, action: string, limit: number, minutes: number) {
  const key = hashToken(`${action}:${req.ip ?? "unknown"}`);
  const { rows } = await pool.query(
    `INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,NOW()+($2*INTERVAL '1 minute'))
     ON CONFLICT(key) DO UPDATE SET
       count=CASE WHEN rate_limits.reset_at<NOW() THEN 1 ELSE rate_limits.count+1 END,
       reset_at=CASE WHEN rate_limits.reset_at<NOW() THEN NOW()+($2*INTERVAL '1 minute') ELSE rate_limits.reset_at END
     RETURNING count`,
    [key, minutes],
  );
  if (rows[0].count > limit) throw new HttpError(429, "Juda ko‘p so‘rov. Keyinroq urinib ko‘ring / Слишком много запросов");
}

export function safeUrl(value: string | null | undefined, image = false) {
  if (!value) return null;
  if (image && (value.startsWith("/objects/") || value.startsWith("/api/storage/objects/"))) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error();
    return value;
  } catch {
    throw new HttpError(400, "Havola https:// bilan boshlanishi kerak / Ссылка должна начинаться с https://");
  }
}

export async function ownedImage(value: string | null | undefined, owner: string) {
  const url = safeUrl(value, true);
  if (url?.startsWith("/")) {
    const path = url.replace(/^\/api\/storage/, "");
    const { rowCount } = await pool.query("SELECT 1 FROM uploads WHERE object_path=$1 AND owner_id=$2", [path, owner]);
    if (!rowCount) throw new HttpError(403, "Bu rasm sizga tegishli emas / Нет доступа к изображению");
  }
  return url;
}
