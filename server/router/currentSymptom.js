import Router from "@koa/router";
import * as currentSymptomController from "../controller/currentSymptom.js";

const router = new Router();

router.get("/", currentSymptomController.list);
router.get("/:id", currentSymptomController.detail);
router.post("/", currentSymptomController.create);
router.put("/:id", currentSymptomController.update);
router.delete("/:id", currentSymptomController.remove);

export default router;
