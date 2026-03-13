import Router from "@koa/router";
import * as userController from "../controller/user.js";

const router = new Router();

/**
 * 用户登录接口
 * POST /api/user/login
 */
router.post("/login", userController.login);

/**
 * 用户登出接口
 * POST /api/user/logout
 */
router.post("/logout", userController.logout);

export default router;
