import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coursesRouter from "./courses";
import teachersRouter from "./teachers";
import conversationsRouter from "./conversations";
import reviewsRouter from "./reviews";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(teachersRouter);
router.use(coursesRouter);
router.use(reviewsRouter);
router.use(storageRouter);

export default router;
