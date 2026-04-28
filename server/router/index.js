import Router from "@koa/router";
import aiChatRouter from "./aiChat.js";
import userRouter from "./user.js";
import patientRouter from "./patient.js";
import dashboardRouter from "./dashboard.js";
import reportRouter from "./report.js";
import aiAnalysisRouter from "./aiAnalysis.js";
import knowledgeBaseRouter from "./knowledgeBase.js";
import medicalHistoryRouter from "./medicalHistory.js";
import currentSymptomRouter from "./currentSymptom.js";
import physicalExaminationRouter from "./physicalExamination.js";
import examinationResultRouter from "./examinationResult.js";
import diagnosisRouter from "./diagnosis.js";
import treatmentPlanRouter from "./treatmentPlan.js";
import progressNoteRouter from "./progressNote.js";
import financialInfoRouter from "./financialInfo.js";
import medicalTeamRouter from "./medicalTeam.js";

const router = new Router({
  prefix: "/api",
});

router.use("/ai", aiChatRouter.routes(), aiChatRouter.allowedMethods());
router.use("/analysis", aiAnalysisRouter.routes(), aiAnalysisRouter.allowedMethods());
router.use("/user", userRouter.routes(), userRouter.allowedMethods());
router.use("/patients", patientRouter.routes(), patientRouter.allowedMethods());
router.use("/dashboard", dashboardRouter.routes(), dashboardRouter.allowedMethods());
router.use("/reports", reportRouter.routes(), reportRouter.allowedMethods());
router.use("/knowledge-base", knowledgeBaseRouter.routes(), knowledgeBaseRouter.allowedMethods());

// 患者子记录路由
router.use("/patients/:patientId/medical-history", medicalHistoryRouter.routes(), medicalHistoryRouter.allowedMethods());
router.use("/patients/:patientId/symptoms", currentSymptomRouter.routes(), currentSymptomRouter.allowedMethods());
router.use("/patients/:patientId/physical-exam", physicalExaminationRouter.routes(), physicalExaminationRouter.allowedMethods());
router.use("/patients/:patientId/examination-results", examinationResultRouter.routes(), examinationResultRouter.allowedMethods());
router.use("/patients/:patientId/diagnoses", diagnosisRouter.routes(), diagnosisRouter.allowedMethods());
router.use("/patients/:patientId/treatment-plans", treatmentPlanRouter.routes(), treatmentPlanRouter.allowedMethods());
router.use("/patients/:patientId/progress-notes", progressNoteRouter.routes(), progressNoteRouter.allowedMethods());
router.use("/patients/:patientId/financial-info", financialInfoRouter.routes(), financialInfoRouter.allowedMethods());
router.use("/patients/:patientId/medical-team", medicalTeamRouter.routes(), medicalTeamRouter.allowedMethods());

router.get("/health", (ctx) => {
  ctx.body = {
    success: true,
    message: "HealthConsole API Server is running",
    timestamp: new Date().toISOString()
  };
});

export default router;
