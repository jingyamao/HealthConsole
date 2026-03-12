import Router from "@koa/router";
import aiService from "../services/ai/aiService.js";
import AIAgentManager from "../services/ai/agent/aiAgentManager.js";

const router = new Router({
  prefix: "/ai"
});

// 创建AI Agent管理器实例
const aiAgent = new AIAgentManager();

/**
 * AI聊天接口 - 主入口
 * 接收前端用户对话，进行意图识别并调用相应的AI功能
 */
router.post("/chat", async (ctx) => {
  try {
    const { message, context = {}, sessionId, userId } = ctx.request.body;
    
    // 参数验证
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_MESSAGE',
          message: '消息内容不能为空'
        }
      };
      return;
    }

    console.log('🤖 AI聊天请求:', { message, sessionId, userId });

    // 构建请求上下文
    const requestContext = {
      sessionId: sessionId || ctx.session?.id || `session-${Date.now()}`,
      userId: userId || ctx.state?.user?.id,
      userInfo: context.userInfo || ctx.state?.user,
      chatHistory: context.chatHistory || [],
      timestamp: new Date().toISOString(),
      ip: ctx.ip,
      userAgent: ctx.get('User-Agent')
    };

    // 使用AI Agent处理消息
    const agentResult = await aiAgent.execute(message, requestContext);

    if (agentResult.success) {
      // 构建响应数据
      const responseData = {
        success: true,
        data: {
          message: agentResult.output,
          sessionId: requestContext.sessionId,
          toolsUsed: agentResult.toolsUsed,
          timestamp: new Date().toISOString(),
          metadata: {
            inputLength: message.length,
            outputLength: agentResult.output.length,
            processingTime: Date.now() - new Date(requestContext.timestamp).getTime()
          }
        }
      };

      // 获取对话历史
      const chatHistory = await aiAgent.getChatHistory();
      if (chatHistory && chatHistory.length > 0) {
        responseData.data.chatHistory = chatHistory.slice(-10); // 只返回最近10条记录
      }

      ctx.body = responseData;
      
    } else {
      // Agent执行失败
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'AGENT_EXECUTION_ERROR',
          message: agentResult.error.message,
          type: agentResult.error.type
        }
      };
    }

  } catch (error) {
    console.error('❌ AI聊天接口错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误',
        details: error.message
      }
    };
  }
});

/**
 * 意图识别接口
 * 单独提供意图识别功能，用于前端预览或调试
 */
router.post("/analyze-intent", async (ctx) => {
  try {
    const { message } = ctx.request.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_MESSAGE',
          message: '消息内容不能为空'
        }
      };
      return;
    }

    console.log('🔍 意图识别请求:', message);

    // 使用AI服务进行意图识别
    const intentResult = await aiService.analyzeIntent(message);

    if (intentResult.success) {
      ctx.body = {
        success: true,
        data: {
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          reasoning: intentResult.reasoning,
          message: message,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTENT_ANALYSIS_ERROR',
          message: intentResult.error.message,
          type: intentResult.error.type
        }
      };
    }

  } catch (error) {
    console.error('❌ 意图识别接口错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误',
        details: error.message
      }
    };
  }
});

/**
 * 获取AI Agent状态
 * 用于前端了解Agent的可用性和配置信息
 */
router.get("/agent-status", async (ctx) => {
  try {
    const agentStatus = aiAgent.getStatus();
    
    ctx.body = {
      success: true,
      data: {
        status: agentStatus,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
  } catch (error) {
    console.error('❌ 获取Agent状态错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'STATUS_CHECK_ERROR',
        message: '获取Agent状态失败',
        details: error.message
      }
    };
  }
});

/**
 * 清除对话历史
 * 用于重置特定会话的对话历史
 */
router.delete("/chat-history/:sessionId", async (ctx) => {
  try {
    const { sessionId } = ctx.params;
    
    if (!sessionId) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_SESSION_ID',
          message: '会话ID不能为空'
        }
      };
      return;
    }

    console.log('🧹 清除对话历史请求:', sessionId);

    // 清除对话历史
    aiAgent.clearHistory();

    ctx.body = {
      success: true,
      data: {
        message: '对话历史已清除',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ 清除对话历史错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'CLEAR_HISTORY_ERROR',
        message: '清除对话历史失败',
        details: error.message
      }
    };
  }
});

/**
 * 获取支持的意图类型
 * 用于前端了解系统支持的意图分类
 */
router.get("/supported-intents", async (ctx) => {
  try {
    const supportedIntents = await aiService.getSupportedIntents();
    
    ctx.body = {
      success: true,
      data: {
        intents: supportedIntents,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ 获取支持意图错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'GET_INTENTS_ERROR',
        message: '获取支持的意图类型失败',
        details: error.message
      }
    };
  }
});

/**
 * 智能对话处理器（备用方案）
 * 如果Agent出现问题，可以使用传统的智能对话处理器
 */
router.post("/smart-chat", async (ctx) => {
  try {
    const { message, context = {} } = ctx.request.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: {
          code: 'INVALID_MESSAGE',
          message: '消息内容不能为空'
        }
      };
      return;
    }

    console.log('🧠 智能对话处理器请求:', message);

    // 使用传统的智能对话处理器
    const smartResult = await aiService.processSmartDialogue(message, context);

    if (smartResult.success) {
      ctx.body = {
        success: true,
        data: {
          message: smartResult.response,
          intent: smartResult.intent,
          confidence: smartResult.confidence,
          type: smartResult.type,
          metadata: smartResult,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: {
          code: 'SMART_PROCESSING_ERROR',
          message: smartResult.error?.message || '处理失败',
          type: smartResult.error?.type
        }
      };
    }

  } catch (error) {
    console.error('❌ 智能对话处理器错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误',
        details: error.message
      }
    };
  }
});

export default router;