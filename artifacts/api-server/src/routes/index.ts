import { Router, type IRouter } from "express";
import healthRouter from "./health";
import telegramAuthRouter from "./telegram-auth";
import coursesRouter from "./courses";
import teachersRouter from "./teachers";
import conversationsRouter from "./conversations";
import reviewsRouter from "./reviews";
import storageRouter from "./storage";
import seoRouter from "./seo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(telegramAuthRouter);
router.use(conversationsRouter);
router.use(teachersRouter);
router.use(coursesRouter);
router.use(reviewsRouter);
router.use(storageRouter);
router.use(seoRouter);

export default router;
