import Router from "@koa/router";
import * as progressNoteController from "../controller/progressNote.js";

const router = new Router();

router.get("/", progressNoteController.list);
router.get("/:id", progressNoteController.detail);
router.post("/", progressNoteController.create);
router.put("/:id", progressNoteController.update);
router.delete("/:id", progressNoteController.remove);

export default router;
