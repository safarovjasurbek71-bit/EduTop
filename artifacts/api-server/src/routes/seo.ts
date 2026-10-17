import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { activeCourse, HttpError } from "../lib/edutop";

const router: IRouter = Router();
const xml = (value: string) => value.replace(/[<>&"']/g, character =>
  ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);

router.get("/seo/sitemap.xml", async (_req, res): Promise<void> => {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (!configured) throw new HttpError(503, "Publish va haqiqiy domen tanlangach PUBLIC_SITE_URL sozlanadi / Configure PUBLIC_SITE_URL after publishing");
  let site: URL;
  try { site = new URL(configured); } catch { throw new HttpError(503, "PUBLIC_SITE_URL noto‘g‘ri / Invalid PUBLIC_SITE_URL"); }
  if (site.protocol !== "https:" || site.username || site.password || site.pathname !== "/" ||
      site.search || site.hash || site.hostname.endsWith(".replit.dev") || site.hostname === "localhost") {
    throw new HttpError(503, "PUBLIC_SITE_URL haqiqiy nashr qilingan HTTPS domen bo‘lsin / Set the published HTTPS origin");
  }
  const { rows } = await pool.query(`SELECT c.id,c.teacher_id,c.created_at FROM courses c WHERE ${activeCourse} ORDER BY c.created_at DESC`);
  const paths = ["/", ...rows.map(row => `/courses/${encodeURIComponent(row.id)}`),
    ...Array.from(new Set(rows.map(row => row.teacher_id as string))).map(id => `/teachers/${encodeURIComponent(id)}`)];
  if (paths.length > 50000) throw new HttpError(503, "Sitemap needs splitting into smaller files");
  res.type("application/xml").set("Cache-Control", "public, max-age=300").send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
      paths.map(path => `<url><loc>${xml(new URL(path, site.origin).href)}</loc></url>`).join("")
    }</urlset>`);
});

export default router;
