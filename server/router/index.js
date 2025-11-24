import Router from "@koa/router";
import { getUsers, postUser } from "../controller/index.js";
import { getQuestions, getSearchQuestions,postQuestions,postQuestionsList,deleteQuestion,generateAI } from "../controller/questions.js";


const router = new Router({
  prefix: "/api",
});

router.get("/users", getUsers);
router.post("/users", postUser);

router.get("/questions", getQuestions);
router.get("/questions/search", getSearchQuestions);
router.post("/postquestions", postQuestions);
router.post("/postquestionslist", postQuestionsList);
router.delete("/deletequestions", deleteQuestion);
router.post("/generateai", generateAI);


export default router;
