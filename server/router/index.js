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
  console.log(`\n📥 [${new Date().toISOString()}] 收到健康检查请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  ctx.body = {
    success: true,
    message: "HealthConsole API Server is running",
    timestamp: new Date().toISOString()
  };
  console.log(`📤 [${new Date().toISOString()}] 健康检查请求处理完成`);
});

export default router;
