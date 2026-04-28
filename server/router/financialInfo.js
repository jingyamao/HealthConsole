import Router from "@koa/router";
import * as financialInfoController from "../controller/financialInfo.js";

const router = new Router();

router.get("/", financialInfoController.list);
router.get("/:id", financialInfoController.detail);
router.post("/", financialInfoController.create);
router.put("/:id", financialInfoController.update);
router.delete("/:id", financialInfoController.remove);

export default router;
