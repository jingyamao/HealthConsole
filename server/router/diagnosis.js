import Router from "@koa/router";
import * as diagnosisController from "../controller/diagnosis.js";

const router = new Router();

router.get("/", diagnosisController.list);
router.get("/:id", diagnosisController.detail);
router.post("/", diagnosisController.create);
router.put("/:id", diagnosisController.update);
router.delete("/:id", diagnosisController.remove);

export default router;
