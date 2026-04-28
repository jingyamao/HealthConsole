import Router from "@koa/router";
import * as medicalHistoryController from "../controller/medicalHistory.js";

const router = new Router();

router.get("/", medicalHistoryController.list);
router.get("/:id", medicalHistoryController.detail);
router.post("/", medicalHistoryController.create);
router.put("/:id", medicalHistoryController.update);
router.delete("/:id", medicalHistoryController.remove);

export default router;
