import { agentManager } from "../services/langchain/index.js";
import * as chatModel from "../model/chat.js";

/**
 * AI 聊天 - 发送消息
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function chat(ctx) {
  try {
    const { message, sessionId, userId } = ctx.request.body;

    // 参数验证
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'INVALID_MESSAGE', message: '消息内容不能为空' }
      };
      return;
    }

    if (!sessionId || !userId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_PARAMS', message: '缺少 sessionId 或 userId' }
      };
      return;
    }

    console.log('🤖 AI聊天请求:', { message, sessionId, userId });

    // 保存用户消息
    await chatModel.saveMessage(sessionId, userId, 'user', message);

    // 使用 Agent 处理消息
    const result = await agentManager.execute(message);

    if (result.success) {
      // 保存 AI 回复
      await chatModel.saveMessage(sessionId, userId, 'assistant', result.output);

      ctx.body = {
        success: true,
        data: {
          message: result.output,
          sessionId,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: { code: 'AGENT_ERROR', message: result.error }
      };
    }

  } catch (error) {
    console.error('❌ AI聊天错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    };
  }
}

/**
 * 创建新会话
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function createConversation(ctx) {
  try {
    const { userId, title } = ctx.request.body;

    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_USER_ID', message: '缺少 userId' }
      };
      return;
    }

    // 如果没有提供标题，使用默认标题
    const conversationTitle = title || `新对话 ${new Date().toLocaleString('zh-CN')}`;

    const result = await chatModel.createConversation(userId, conversationTitle);

    if (result.success) {
      ctx.body = {
        success: true,
        data: {
          conversation: result.data,
          message: '会话创建成功'
        }
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ 创建会话错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    };
  }
}

/**
 * 获取用户的所有会话
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function getUserConversations(ctx) {
  try {
    const { userId } = ctx.params;

    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_USER_ID', message: '缺少 userId' }
      };
      return;
    }

    const conversations = await chatModel.getUserConversations(userId);

    ctx.body = {
      success: true,
      data: {
        userId,
        conversations,
        count: conversations.length
      }
    };

  } catch (error) {
    console.error('❌ 获取用户会话错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    };
  }
}

/**
 * 获取会话的聊天记录
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function getChatHistory(ctx) {
  try {
    const { sessionId } = ctx.params;
    const { limit = 50 } = ctx.query;

    if (!sessionId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_SESSION_ID', message: '缺少 sessionId' }
      };
      return;
    }

    const messages = await chatModel.getChatHistory(sessionId, parseInt(limit));

    ctx.body = {
      success: true,
      data: {
        sessionId,
        messages,
        count: messages.length
      }
    };

  } catch (error) {
    console.error('❌ 获取聊天记录错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    };
  }
}

/**
 * 删除会话
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function deleteConversation(ctx) {
  try {
    const { sessionId } = ctx.params;

    if (!sessionId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_SESSION_ID', message: '缺少 sessionId' }
      };
      return;
    }

    const result = await chatModel.deleteConversation(sessionId);

    if (result.success) {
      ctx.body = {
        success: true,
        data: {
          message: '会话删除成功',
          sessionId
        }
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ 删除会话错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    };
  }
}

/**
 * 更新会话标题
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function updateConversationTitle(ctx) {
  try {
    const { sessionId } = ctx.params;
    const { title } = ctx.request.body;

    if (!sessionId || !title) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_PARAMS', message: '缺少 sessionId 或 title' }
      };
      return;
    }

    const result = await chatModel.updateConversationTitle(sessionId, title);

    if (result.success) {
      ctx.body = {
        success: true,
        data: {
          message: '会话标题更新成功',
          sessionId,
          title
        }
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ 更新会话标题错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    };
  }
}
