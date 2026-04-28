import Router from "@koa/router";
import * as aiAnalysisController from "../controller/aiAnalysis.js";

const router = new Router();

// AI 分析统计
router.get("/stats", aiAnalysisController.aiStats);

// 单患者 AI 综合分析
router.post("/:patientId/analyze", aiAnalysisController.analyze);

// 单患者 AI 诊疗建议
router.post("/:patientId/suggest", aiAnalysisController.suggest);

// 单患者 AI 状态
router.get("/:patientId/status", aiAnalysisController.status);

export default router;
