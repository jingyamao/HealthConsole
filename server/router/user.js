import Router from "@koa/router";
import UserController from "../controller/user.js";

const router = new Router({
  prefix: "/user"
});

const userController = new UserController();

/**
 * 用户登录接口
 * POST /user/login
 * 接受参数: userId, userName
 */
router.post("/login", userController.login.bind(userController));

/**
 * 用户登出接口
 * POST /user/logout
 */
router.post("/logout", userController.logout.bind(userController));

export default router;