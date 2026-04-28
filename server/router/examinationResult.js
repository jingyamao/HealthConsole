import Router from "@koa/router";
import * as examinationResultController from "../controller/examinationResult.js";

const router = new Router();

router.get("/", examinationResultController.list);
router.get("/:id", examinationResultController.detail);
router.post("/", examinationResultController.create);
router.put("/:id", examinationResultController.update);
router.delete("/:id", examinationResultController.remove);

export default router;
