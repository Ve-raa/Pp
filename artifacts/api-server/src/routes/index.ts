import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentsRouter from "./payments";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paymentsRouter);
router.use(ordersRouter);

export default router;
