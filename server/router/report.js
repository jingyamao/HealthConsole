import Router from "@koa/router";
import * as reportController from "../controller/report.js";

const router = new Router();

// 患者统计报表
router.get("/patients", reportController.patientReport);

// 诊疗统计报表
router.get("/diagnosis", reportController.diagnosisReport);

// 费用统计报表
router.get("/financial", reportController.financialReport);

export default router;
