import Router from "@koa/router";
import * as dashboardController from "../controller/dashboard.js";

const router = new Router();

// 获取首页仪表盘汇总数据
router.get("/overview", dashboardController.overview);

// 获取仪表盘详细数据（趋势、科室、热力图、预警）
router.get("/detail", dashboardController.detail);

export default router;
