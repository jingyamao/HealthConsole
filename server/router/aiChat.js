import Router from "@koa/router";
import * as aiChatController from "../controller/aiChat.js";

const router = new Router();

/**
 * AI 聊天 - 发送消息
 * POST /api/ai/chat
 * Body: { message, sessionId, userId }
 */
router.post("/chat", async (ctx, next) => {
  const { message, sessionId, userId } = ctx.request.body || {};
  console.log(`\n📥 [${new Date().toISOString()}] 收到AI聊天请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   用户ID: ${userId || '未提供'}`);
  console.log(`   会话ID: ${sessionId || '未提供'}`);
  console.log(`   消息内容: ${message?.substring(0, 100)}${message?.length > 100 ? '...' : ''}`);
  await aiChatController.chat(ctx);
  console.log(`📤 [${new Date().toISOString()}] AI聊天请求处理完成，状态: ${ctx.status}`);
});

/**
 * 创建新会话
 * POST /api/ai/conversations
 * Body: { userId, title? }
 */
router.post("/conversations", async (ctx, next) => {
  const { userId, title } = ctx.request.body || {};
  console.log(`\n📥 [${new Date().toISOString()}] 收到创建会话请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   用户ID: ${userId || '未提供'}`);
  console.log(`   会话标题: ${title || '默认标题'}`);
  await aiChatController.createConversation(ctx);
  console.log(`📤 [${new Date().toISOString()}] 创建会话请求处理完成，状态: ${ctx.status}`);
});

/**
 * 获取用户的所有会话
 * GET /api/ai/conversations/:userId
 */
router.get("/conversations/:userId", async (ctx, next) => {
  const { userId } = ctx.params;
  console.log(`\n📥 [${new Date().toISOString()}] 收到获取会话列表请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   用户ID: ${userId}`);
  await aiChatController.getUserConversations(ctx);
  console.log(`📤 [${new Date().toISOString()}] 获取会话列表请求处理完成，状态: ${ctx.status}`);
});

/**
 * 获取会话的聊天记录
 * GET /api/ai/chat-history/:sessionId
 * Query: { limit? }
 */
router.get("/chat-history/:sessionId", async (ctx, next) => {
  const { sessionId } = ctx.params;
  const { limit } = ctx.query;
  console.log(`\n📥 [${new Date().toISOString()}] 收到获取聊天记录请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   会话ID: ${sessionId}`);
  console.log(`   限制数量: ${limit || '默认'}`);
  await aiChatController.getChatHistory(ctx);
  console.log(`📤 [${new Date().toISOString()}] 获取聊天记录请求处理完成，状态: ${ctx.status}`);
});

/**
 * 更新会话标题
 * PUT /api/ai/conversations/:sessionId/title
 * Body: { title }
 */
router.put("/conversations/:sessionId/title", async (ctx, next) => {
  const { sessionId } = ctx.params;
  const { title } = ctx.request.body || {};
  console.log(`\n📥 [${new Date().toISOString()}] 收到更新会话标题请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   会话ID: ${sessionId}`);
  console.log(`   新标题: ${title || '未提供'}`);
  await aiChatController.updateConversationTitle(ctx);
  console.log(`📤 [${new Date().toISOString()}] 更新会话标题请求处理完成，状态: ${ctx.status}`);
});

/**
 * 删除会话
 * DELETE /api/ai/conversations/:sessionId
 */
router.delete("/conversations/:sessionId", async (ctx, next) => {
  const { sessionId } = ctx.params;
  console.log(`\n📥 [${new Date().toISOString()}] 收到删除会话请求`);
  console.log(`   请求IP: ${ctx.ip}`);
  console.log(`   会话ID: ${sessionId}`);
  await aiChatController.deleteConversation(ctx);
  console.log(`📤 [${new Date().toISOString()}] 删除会话请求处理完成，状态: ${ctx.status}`);
});

export default router;
