import Router from "@koa/router";
import * as aiChatController from "../controller/aiChat.js";

const router = new Router();

/**
 * AI 聊天 - 发送消息
 * POST /api/ai/chat
 * Body: { message, sessionId, userId }
 */
router.post("/chat", aiChatController.chat);

/**
 * 创建新会话
 * POST /api/ai/conversations
 * Body: { userId, title? }
 */
router.post("/conversations", aiChatController.createConversation);

/**
 * 获取用户的所有会话
 * GET /api/ai/conversations/:userId
 */
router.get("/conversations/:userId", aiChatController.getUserConversations);

/**
 * 获取会话的聊天记录
 * GET /api/ai/chat-history/:sessionId
 * Query: { limit? }
 */
router.get("/chat-history/:sessionId", aiChatController.getChatHistory);

/**
 * 更新会话标题
 * PUT /api/ai/conversations/:sessionId/title
 * Body: { title }
 */
router.put("/conversations/:sessionId/title", aiChatController.updateConversationTitle);

/**
 * 删除会话
 * DELETE /api/ai/conversations/:sessionId
 */
router.delete("/conversations/:sessionId", aiChatController.deleteConversation);

export default router;
