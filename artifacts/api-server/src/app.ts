import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import { HttpError } from "./lib/edutop";
import type { ErrorRequestHandler } from "express";

const app: Express = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0]?.replace(/(\/guest\/conversations\/)[^/]+/, "$1[private]"),
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use("/api", (req, res, next) => {
  const origin = req.get("origin");
  if (origin) {
    try {
      if (new URL(origin).hostname !== req.hostname) {
        res.status(403).json({ error: "Cross-origin requests are not allowed" });
        return;
      }
    } catch {
      res.status(400).json({ error: "Invalid origin" });
      return;
    }
  }
  next();
});
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(getClerkProxyHost(req) ?? "", process.env.CLERK_PUBLISHABLE_KEY),
})));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use("/api", router);
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error?.name === "ZodError") {
    res.status(400).json({ error: "Ma’lumotlarni tekshiring / Проверьте введённые данные", details: error.issues });
    return;
  }
  req.log.error({ err: error }, "Request failed");
  res.status(500).json({ error: "Server xatosi / Ошибка сервера" });
};
app.use(errorHandler);

export default app;
