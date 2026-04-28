import Router from "@koa/router";
import * as physicalExaminationController from "../controller/physicalExamination.js";

const router = new Router();

router.get("/", physicalExaminationController.list);
router.get("/:id", physicalExaminationController.detail);
router.post("/", physicalExaminationController.create);
router.put("/:id", physicalExaminationController.update);
router.delete("/:id", physicalExaminationController.remove);

export default router;
