import Router from "@koa/router";
import aiChatRouter from "./aiChat.js";
import userRouter from "./user.js";
import patientRouter from "./patient.js";
import dashboardRouter from "./dashboard.js";
import reportRouter from "./report.js";

const router = new Router({
  prefix: "/api",
});

router.use("/ai", aiChatRouter.routes(), aiChatRouter.allowedMethods());
router.use("/user", userRouter.routes(), userRouter.allowedMethods());
router.use("/patients", patientRouter.routes(), patientRouter.allowedMethods());
router.use("/dashboard", dashboardRouter.routes(), dashboardRouter.allowedMethods());
router.use("/reports", reportRouter.routes(), reportRouter.allowedMethods());

router.get("/health", (ctx) => {
  ctx.body = {
    success: true,
    message: "HealthConsole API Server is running",
    timestamp: new Date().toISOString()
  };
});

export default router;
