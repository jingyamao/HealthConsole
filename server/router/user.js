import Router from "@koa/router";
import * as userController from "../controller/user.js";

const router = new Router();

router.post("/login", async (ctx) => {
  const { userId } = ctx.request.body || {};
  console.log(`[Auth] login userId=${userId}`);
  await userController.login(ctx);
});

router.post("/logout", async (ctx) => {
  console.log(`[Auth] logout userId=${ctx.session?.userId || '?'}`);
  await userController.logout(ctx);
});

export default router;
