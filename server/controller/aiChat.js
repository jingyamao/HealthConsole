import { agentManager } from "../services/langchain/index.js";
import { defaultLLM } from "../services/langchain/core/llm.js";
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
        data: { code: 'MISSING_PARAMS', message: '缺少 sessionId 或 userId' }
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
 * 使用AI生成会话标题
 * @param {string} firstMessage - 用户第一条消息
 * @returns {Promise<string>} - AI生成的标题
 */
async function generateAITitle(firstMessage) {
  try {
    const prompt = `请根据用户的医疗健康问题，生成一个简洁、准确的会话标题。
    用户问题："${firstMessage}"

    要求：
    1. 标题长度不超过15个字符
    2. 准确概括问题的核心内容
    3. 使用中文，简洁明了
    4. 如果是症状描述，突出主要症状
    5. 如果是咨询类问题，突出咨询主题

    请直接返回标题，不要其他内容。`;

    const response = await defaultLLM.invoke([
      { role: "system", content: "你是一个专业的医疗助手，擅长总结医疗问题并生成简洁的标题。" },
      { role: "user", content: prompt }
    ]);

    // 清理响应，确保只返回标题
    let title = response.content.trim();
    
    // 移除可能的引号或特殊字符
    title = title.replace(/["']/g, '');
    
    // 限制长度
    if (title.length > 15) {
      title = title.substring(0, 15) + '...';
    }

    console.log('🤖 AI生成标题:', { originalMessage: firstMessage, generatedTitle: title });
    return title;
  } catch (error) {
    console.error('❌ AI生成标题失败:', error);
    return `新对话 ${new Date().toLocaleString('zh-CN')}`;
  }
}

/**
 * 创建新会话
 * @param {Object} ctx - Koa上下文
 * @returns {Promise<void>}
 */
export async function createConversation(ctx) {
  try {
    const { userId, title, firstMessage } = ctx.request.body;

    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_USER_ID', message: '缺少 userId' }
      };
      return;
    }

    let conversationTitle;

    // 如果提供了标题，直接使用
    if (title) {
      conversationTitle = title;
    }
    // 如果提供了第一条消息，使用AI生成标题
    else if (firstMessage && firstMessage.trim().length > 0) {
      conversationTitle = await generateAITitle(firstMessage.trim());
    }
    // 否则使用默认标题
    else {
      conversationTitle = `新对话 ${new Date().toLocaleString('zh-CN')}`;
    }

    const result = await chatModel.createConversation(userId, conversationTitle);

    if (result.success) {
      // 如果提供了第一条消息，保存到会话中
      if (firstMessage && firstMessage.trim().length > 0) {
        await chatModel.saveMessage(result.data.id, userId, 'user', firstMessage.trim());
        console.log('💬 第一条消息已保存到会话:', { sessionId: result.data.id, message: firstMessage.trim() });
      }

      ctx.body = {
        success: true,
        data: {
          conversation: result.data,
          message: '会话创建成功',
          titleGenerated: !title // 标记标题是否为AI生成
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

    if (!sessionId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: { code: 'MISSING_SESSION_ID', message: '缺少 sessionId' }
      };
      return;
    }

    const messages = await chatModel.getChatHistory(sessionId);
    const conversation = await chatModel.getConversationById(sessionId);

    ctx.body = {
      success: true,
      data: {
        sessionId,
        title: conversation?.title || '未知会话',
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
