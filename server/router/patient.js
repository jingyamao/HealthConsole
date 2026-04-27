import Router from "@koa/router";
import * as patientController from "../controller/patient.js";

const router = new Router();

// 获取患者统计数据（必须在 /:id 之前）
router.get("/summary", patientController.summary);

// 获取患者列表
router.get("/", patientController.list);

// 获取患者详情
router.get("/:id", patientController.detail);

// 创建患者
router.post("/", patientController.create);

// 更新患者
router.put("/:id", patientController.update);

// 删除患者
router.delete("/:id", patientController.remove);

export default router;
