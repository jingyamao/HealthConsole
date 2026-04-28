import Router from "@koa/router";
import * as treatmentPlanController from "../controller/treatmentPlan.js";

const router = new Router();

router.get("/", treatmentPlanController.list);
router.get("/:id", treatmentPlanController.detail);
router.post("/", treatmentPlanController.create);
router.put("/:id", treatmentPlanController.update);
router.delete("/:id", treatmentPlanController.remove);

export default router;
