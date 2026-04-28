import Router from "@koa/router";
import * as kbController from "../controller/knowledgeBase.js";

const router = new Router();

router.get("/stats", kbController.stats);
router.get("/", kbController.list);
router.get("/:id", kbController.detail);
router.post("/", kbController.create);
router.put("/:id", kbController.update);
router.delete("/:id", kbController.remove);

export default router;
