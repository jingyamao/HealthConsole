import Router from "@koa/router";
import * as medicalTeamController from "../controller/medicalTeam.js";

const router = new Router();

router.get("/", medicalTeamController.list);
router.get("/:id", medicalTeamController.detail);
router.post("/", medicalTeamController.create);
router.put("/:id", medicalTeamController.update);
router.delete("/:id", medicalTeamController.remove);

export default router;
