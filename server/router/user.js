import Router from "@koa/router";
import * as userController from "../controller/user.js";

const router = new Router();

/**
 * 用户登录接口
 * POST /api/user/login
 */
router.post("/login", async (ctx, next) => {
  console.log(`\n📥 [${new Date().toISOString()}] 收到登录请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   请求体:`, JSON.stringify(ctx.request.body, null, 2));
  await userController.login(ctx);
  console.log(`📤 [${new Date().toISOString()}] 登录请求处理完成，状态: ${ctx.status}`);
});

/**
 * 用户登出接口
 * POST /api/user/logout
 */
router.post("/logout", async (ctx, next) => {
  console.log(`\n📥 [${new Date().toISOString()}] 收到登出请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   会话用户: ${ctx.session?.userId || '未登录'}`);
  await userController.logout(ctx);
  console.log(`📤 [${new Date().toISOString()}] 登出请求处理完成，状态: ${ctx.status}`);
});

export default router;
