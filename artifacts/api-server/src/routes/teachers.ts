import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  GetTeacherParams, GetTeacherResponse, GetMyTeacherProfileResponse,
  SaveMyTeacherProfileBody, SaveMyTeacherProfileResponse, GetTeacherDashboardResponse,
  ListMyCoursesResponse, ListTeacherCoursesParams, ListTeacherCoursesResponse,
} from "@workspace/api-zod";
import { activeCourse, camel, courseOutput, courseSelect, HttpError, myTeacher, ownedImage, safeUrl, teacherColumns, userId } from "../lib/edutop";

const router: IRouter = Router();
async function profile(id: string) {
  const { rows } = await pool.query(`SELECT ${teacherColumns} FROM teachers t WHERE t.id=$1`, [id]);
  if (!rows[0]) throw new HttpError(404, "O‘qituvchi topilmadi / Преподаватель не найден");
  const result = camel(rows[0]);
  delete result.clerkId;
  return result;
}

router.get("/teachers/me", async (req, res): Promise<void> => {
  const teacher = await myTeacher(req);
  res.json(GetMyTeacherProfileResponse.parse(await profile(teacher.id)));
});

router.put("/teachers/me", async (req, res): Promise<void> => {
  const data = SaveMyTeacherProfileBody.parse(req.body);
  if (data.fullNameUz.trim().length < 2) throw new HttpError(400, "Ismingizni kiriting / Укажите имя");
  const teacher = await myTeacher(req);
  const owner = userId(req);
  const avatarUrl = data.avatarUrl === undefined ? teacher.avatar_url : await ownedImage(data.avatarUrl, owner);
  const certificates = await Promise.all((data.certificates ?? teacher.certificates ?? []).map(async (certificate: {titleUz: string; titleRu?: string; issuer?: string | null; imageUrl?: string | null}) => ({
    ...certificate, titleRu: certificate.titleRu?.trim() || certificate.titleUz, imageUrl: await ownedImage(certificate.imageUrl, owner),
  })));
  if (certificates.length > 20) throw new HttpError(400, "Sertifikatlar soni 20 tadan oshmasin / Не более 20 сертификатов");
  const telegramUrl = safeUrl(data.telegramUrl === undefined ? teacher.telegram_url : data.telegramUrl);
  if (telegramUrl && !["t.me", "telegram.me", "www.t.me"].includes(new URL(telegramUrl).hostname)) throw new HttpError(400, "Telegram havolasi t.me orqali bo‘lsin / Укажите ссылку t.me");
  await pool.query(`UPDATE teachers SET full_name_uz=$1,full_name_ru=$2,specialization_uz=$3,specialization_ru=$4,
    bio_uz=$5,bio_ru=$6,avatar_url=$7,experience_years=$8,certificates=$9::jsonb,phone=$10,telegram_url=$11,
    website_url=$12,youtube_url=$13,city_uz=$14,city_ru=$15 WHERE id=$16`,
    [data.fullNameUz.trim(), data.fullNameRu?.trim() || data.fullNameUz.trim(),
      data.specializationUz?.trim() ?? teacher.specialization_uz, data.specializationRu?.trim() ?? data.specializationUz?.trim() ?? teacher.specialization_ru,
      data.bioUz ?? teacher.bio_uz, data.bioRu ?? data.bioUz ?? teacher.bio_ru, avatarUrl,
      data.experienceYears ?? teacher.experience_years, JSON.stringify(certificates),
      data.phone === undefined ? teacher.phone : data.phone || null, telegramUrl,
      safeUrl(data.websiteUrl === undefined ? teacher.website_url : data.websiteUrl),
      safeUrl(data.youtubeUrl === undefined ? teacher.youtube_url : data.youtubeUrl),
      data.cityUz === undefined ? teacher.city_uz : data.cityUz || null,
      data.cityRu === undefined ? (data.cityUz ?? teacher.city_ru) : data.cityRu || null, teacher.id]);
  res.json(SaveMyTeacherProfileResponse.parse(await profile(teacher.id)));
});

router.get("/teachers/me/dashboard", async (req, res): Promise<void> => {
  const teacher = await myTeacher(req);
  const { rows } = await pool.query(`SELECT
    COUNT(*) FILTER(WHERE status='published' AND listing_expires_at>NOW())::int AS "activeCourses",
    COUNT(*) FILTER(WHERE status='draft')::int AS "draftCourses",
    COUNT(*) FILTER(WHERE status='expired' OR (status='published' AND listing_expires_at<=NOW()))::int AS "expiredCourses",
    (SELECT COUNT(*)::int FROM conversations WHERE teacher_id=$1 AND unread_count>0) AS "unreadConversations",
    COALESCE((SELECT ROUND(AVG(stars)::numeric,1) FROM reviews WHERE teacher_id=$1),0)::float AS "averageRating",
    (SELECT COUNT(*)::int FROM reviews WHERE teacher_id=$1) AS "totalReviews"
    FROM courses WHERE teacher_id=$1 AND status<>'deleted'`, [teacher.id]);
  res.json(GetTeacherDashboardResponse.parse(rows[0]));
});

router.get("/teachers/me/courses", async (req, res): Promise<void> => {
  const teacher = await myTeacher(req);
  const { rows } = await pool.query(`${courseSelect} WHERE c.teacher_id=$1 AND c.status<>'deleted' ORDER BY c.created_at DESC`, [teacher.id]);
  res.json(ListMyCoursesResponse.parse(rows.map(courseOutput)));
});

router.get("/teachers/:teacherId/courses", async (req, res): Promise<void> => {
  const { teacherId } = ListTeacherCoursesParams.parse(req.params);
  const { rows } = await pool.query(`${courseSelect} WHERE c.teacher_id=$1 AND ${activeCourse} ORDER BY rating DESC,c.created_at DESC`, [teacherId]);
  res.json(ListTeacherCoursesResponse.parse(rows.map(courseOutput)));
});

router.get("/teachers/:teacherId", async (req, res): Promise<void> => {
  const { teacherId } = GetTeacherParams.parse(req.params);
  res.json(GetTeacherResponse.parse(await profile(teacherId)));
});

export default router;
