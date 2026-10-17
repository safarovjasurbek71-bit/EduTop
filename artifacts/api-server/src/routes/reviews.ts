import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  ListCourseReviewsParams, ListCourseReviewsResponse,
  CreateCourseReviewParams, CreateCourseReviewBody, CreateCourseReviewResponse,
} from "@workspace/api-zod";
import { camel, findCourse, hashToken, HttpError, newId, throttle } from "../lib/edutop";

const router: IRouter = Router();
router.get("/courses/:courseId/reviews", async (req, res): Promise<void> => {
  const { courseId } = ListCourseReviewsParams.parse(req.params);
  await findCourse(courseId);
  const { rows } = await pool.query("SELECT id,reviewer_name,stars,comment,created_at FROM reviews WHERE course_id=$1 ORDER BY created_at DESC LIMIT 100", [courseId]);
  res.json(ListCourseReviewsResponse.parse(rows.map(camel)));
});
router.post("/courses/:courseId/reviews", async (req, res): Promise<void> => {
  const { courseId } = CreateCourseReviewParams.parse(req.params);
  const data = CreateCourseReviewBody.parse(req.body);
  if (!data.reviewerName.trim() || !data.comment.trim()) throw new HttpError(400, "Ism va izohni kiriting / Укажите имя и отзыв");
  await throttle(req, "review", 5, 1440);
  const course = await findCourse(courseId);
  const owner = await pool.query("SELECT clerk_id FROM teachers WHERE id=$1", [course.teacher.id]);
  if (!owner.rows[0]?.clerk_id) throw new HttpError(409, "Namuna kursni baholab bo‘lmaydi / Нельзя оценить демонстрационный курс");
  const { rows } = await pool.query(`INSERT INTO reviews(id,course_id,teacher_id,reviewer_name,stars,comment,visitor_hash)
    VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(course_id,visitor_hash) DO NOTHING
    RETURNING id,reviewer_name,stars,comment,created_at`,
    [newId(), courseId, course.teacher.id, data.reviewerName.trim(), data.stars, data.comment.trim(), hashToken(`review:${req.ip}`)]);
  if (!rows[0]) throw new HttpError(409, "Bu kursga allaqachon baho bergansiz / Вы уже оценили этот курс");
  res.status(201).json(CreateCourseReviewResponse.parse(camel(rows[0])));
});
export default router;
