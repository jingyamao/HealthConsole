import Router from "@koa/router";
import aiChatRouter from "./aiChat.js";
import userRouter from "./user.js";

const router = new Router({
  prefix: "/api",
});

// 注册AI聊天相关路由
router.use("/ai", aiChatRouter.routes(), aiChatRouter.allowedMethods());

// 注册用户相关路由
router.use("/user", userRouter.routes(), userRouter.allowedMethods());

// 健康检查接口
router.get("/health", (ctx) => {
  ctx.body = {
    success: true,
    message: "HealthConsole API Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  };
});

// API信息接口
router.get("/info", (ctx) => {
  ctx.body = {
    success: true,
    data: {
      name: "HealthConsole API",
      version: "1.0.0",
      description: "医疗健康控制台API服务",
      features: [
        "AI智能对话",
        "意图识别",
        "向量搜索",
        "知识库管理",
        "用户管理"
      ],
      endpoints: [
        "POST /api/ai/chat - AI聊天",
        "POST /api/user/login - 用户登录",
        "GET /api/health - 健康检查"
      ]
    }
  };
});

export default router;