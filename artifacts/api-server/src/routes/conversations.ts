import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  StartCourseConversationParams, StartCourseConversationBody, StartCourseConversationResponse,
  GetGuestConversationParams, GetGuestConversationResponse, SendGuestMessageParams,
  SendGuestMessageBody, SendGuestMessageResponse, ListMyConversationsResponse,
  GetTeacherConversationParams, GetTeacherConversationResponse,
  ReplyToConversationParams, ReplyToConversationBody, ReplyToConversationResponse,
} from "@workspace/api-zod";
import { camel, findCourse, hashToken, HttpError, myTeacher, newId, throttle } from "../lib/edutop";

const router: IRouter = Router();
const threadSelect = `SELECT v.id,v.course_id,v.guest_name,v.updated_at,c.title_uz AS course_title_uz,c.title_ru AS course_title_ru
 FROM conversations v JOIN courses c ON c.id=v.course_id`;

router.post("/courses/:courseId/conversations", async (req, res): Promise<void> => {
  const { courseId } = StartCourseConversationParams.parse(req.params);
  const input = StartCourseConversationBody.parse(req.body);
  await throttle(req, "new-conversation", 10, 60);
  const course = await findCourse(courseId);
  const owner = await pool.query("SELECT clerk_id FROM teachers WHERE id=$1", [course.teacher.id]);
  if (!owner.rows[0]?.clerk_id) throw new HttpError(409, "Bu namuna e’lon. Haqiqiy o‘qituvchining e’lonidan yozing / Это демонстрационное объявление");
  const token = randomBytes(32).toString("hex"), id = newId();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO conversations(id,course_id,teacher_id,guest_name,token_hash) VALUES($1,$2,$3,$4,$5)",
      [id, courseId, course.teacher.id, input.guestName.trim(), hashToken(token)]);
    await client.query("INSERT INTO conversation_messages(id,conversation_id,sender_type,sender_name,content) VALUES($1,$2,'guest',$3,$4)",
      [newId(), id, input.guestName.trim(), input.firstMessage.trim()]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json(StartCourseConversationResponse.parse({
    conversationId: id, accessToken: token, returnUrl: `/guest-chat/${token}`,
  }));
});

router.get("/guest/conversations/:accessToken", async (req, res): Promise<void> => {
  const { accessToken } = GetGuestConversationParams.parse(req.params);
  const { rows } = await pool.query(`${threadSelect} WHERE v.token_hash=$1`, [hashToken(accessToken)]);
  if (!rows[0]) throw new HttpError(404, "Suhbat topilmadi / Переписка не найдена");
  const messages = await pool.query("SELECT id,sender_type,sender_name,content,created_at FROM conversation_messages WHERE conversation_id=$1 ORDER BY created_at,id", [rows[0].id]);
  res.setHeader("Cache-Control", "no-store");
  res.json(GetGuestConversationResponse.parse({ ...camel(rows[0]), messages: messages.rows.map(camel) }));
});

router.post("/guest/conversations/:accessToken", async (req, res): Promise<void> => {
  const { accessToken } = SendGuestMessageParams.parse(req.params);
  const input = SendGuestMessageBody.parse(req.body);
  if (!input.content.trim()) throw new HttpError(400, "Xabar bo‘sh / Сообщение пустое");
  await throttle(req, "guest-message", 60, 60);
  const client = await pool.connect();
  let message;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("UPDATE conversations SET unread_count=unread_count+1,updated_at=NOW() WHERE token_hash=$1 RETURNING id,guest_name", [hashToken(accessToken)]);
    if (!rows[0]) throw new HttpError(404, "Suhbat topilmadi / Переписка не найдена");
    const saved = await client.query("INSERT INTO conversation_messages(id,conversation_id,sender_type,sender_name,content) VALUES($1,$2,'guest',$3,$4) RETURNING id,sender_type,sender_name,content,created_at",
      [newId(), rows[0].id, rows[0].guest_name, input.content.trim()]);
    message = camel(saved.rows[0]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  res.status(201).json(SendGuestMessageResponse.parse(message));
});

router.get("/teachers/me/conversations", async (req, res): Promise<void> => {
  const teacher = await myTeacher(req);
  const { rows } = await pool.query(`SELECT v.id,v.course_id,v.guest_name,v.updated_at,v.unread_count,
    c.title_uz AS course_title_uz,c.title_ru AS course_title_ru,
    COALESCE((SELECT content FROM conversation_messages WHERE conversation_id=v.id ORDER BY created_at DESC,id DESC LIMIT 1),'') AS last_message
    FROM conversations v JOIN courses c ON c.id=v.course_id WHERE v.teacher_id=$1 ORDER BY v.updated_at DESC`, [teacher.id]);
  res.setHeader("Cache-Control", "no-store");
  res.json(ListMyConversationsResponse.parse(rows.map(camel)));
});

router.get("/teachers/me/conversations/:conversationId/messages", async (req, res): Promise<void> => {
  const { conversationId } = GetTeacherConversationParams.parse(req.params);
  const teacher = await myTeacher(req);
  const client = await pool.connect();
  let result;
  try {
    await client.query("BEGIN");
    const found = await client.query("UPDATE conversations SET unread_count=0 WHERE id=$1 AND teacher_id=$2 RETURNING id", [conversationId, teacher.id]);
    if (!found.rows[0]) throw new HttpError(404, "Suhbat topilmadi / Переписка не найдена");
    const { rows } = await client.query(`${threadSelect} WHERE v.id=$1`, [conversationId]);
    const messages = await client.query("SELECT id,sender_type,sender_name,content,created_at FROM conversation_messages WHERE conversation_id=$1 ORDER BY created_at,id", [conversationId]);
    result = { ...camel(rows[0]), messages: messages.rows.map(camel) };
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  res.setHeader("Cache-Control", "no-store");
  res.json(GetTeacherConversationResponse.parse(result));
});

router.post("/teachers/me/conversations/:conversationId/messages", async (req, res): Promise<void> => {
  const { conversationId } = ReplyToConversationParams.parse(req.params);
  const input = ReplyToConversationBody.parse(req.body);
  if (!input.content.trim()) throw new HttpError(400, "Xabar bo‘sh / Сообщение пустое");
  const teacher = await myTeacher(req);
  await throttle(req, `teacher-reply:${teacher.id}`, 120, 60);
  const client = await pool.connect();
  let result;
  try {
    await client.query("BEGIN");
    const found = await client.query("UPDATE conversations SET updated_at=NOW() WHERE id=$1 AND teacher_id=$2 RETURNING id", [conversationId, teacher.id]);
    if (!found.rows[0]) throw new HttpError(404, "Suhbat topilmadi / Переписка не найдена");
    const saved = await client.query("INSERT INTO conversation_messages(id,conversation_id,sender_type,sender_name,content) VALUES($1,$2,'teacher',$3,$4) RETURNING id,sender_type,sender_name,content,created_at",
      [newId(), conversationId, teacher.full_name_uz, input.content.trim()]);
    result = camel(saved.rows[0]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  res.status(201).json(ReplyToConversationResponse.parse(result));
});

export default router;
