import Router from "@koa/router";
import * as aiChatController from "../controller/aiChat.js";

const router = new Router();

router.post("/chat", async (ctx) => {
  const { userId, sessionId } = ctx.request.body || {};
  console.log(`[AI] chat userId=${userId} session=${sessionId?.slice(0, 8)}`);
  await aiChatController.chat(ctx);
});

router.post("/chat-stream", async (ctx) => {
  const { userId, sessionId } = ctx.request.body || {};
  console.log(`[AI] chat-stream userId=${userId} session=${sessionId?.slice(0, 8)}`);
  await aiChatController.chatStream(ctx);
});

router.post("/conversations", async (ctx) => {
  const { userId } = ctx.request.body || {};
  console.log(`[AI] create-conversation userId=${userId}`);
  await aiChatController.createConversation(ctx);
});

router.get("/conversations/:userId", async (ctx) => {
  await aiChatController.getUserConversations(ctx);
});

router.get("/chat-history/:sessionId", async (ctx) => {
  await aiChatController.getChatHistory(ctx);
});

router.put("/conversations/:sessionId/title", async (ctx) => {
  await aiChatController.updateConversationTitle(ctx);
});

router.delete("/conversations/:sessionId", async (ctx) => {
  const { sessionId } = ctx.params;
  console.log(`[AI] delete-conversation session=${sessionId?.slice(0, 8)}`);
  await aiChatController.deleteConversation(ctx);
});

export default router;
