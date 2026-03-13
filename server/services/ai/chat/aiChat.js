import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

/**
 * KIMI 聊天对话服务
 * 使用 Moonshot AI 的 KIMI 模型进行智能对话
 */
class KIMIChatService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.KIMI_API_KEY,
      baseURL: "https://api.moonshot.cn/v1", // KIMI API 基础地址
    });
    
    this.model = "moonshot-v1-8k"; // KIMI 默认模型，支持 8k 上下文
    this.temperature = 0.7;
    this.maxTokens = 2048;
  }

  /**
   * 发送聊天消息
   * @param {string} message - 用户消息
   * @param {Array} conversationHistory - 对话历史（可选）
   * @param {Object} options - 其他选项
   * @returns {Promise<Object>} - 返回AI响应
   */
  async sendMessage(message, conversationHistory = [], options = {}) {
    try {
      const messages = [
        {
          role: "system",
          content: "你是一个专业的医疗助手，具备丰富的医学知识。请用中文回答用户的问题，提供准确、有用的医疗建议。如果问题涉及严重疾病或紧急情况，请提醒用户及时就医。"
        },
        ...conversationHistory,
        {
          role: "user", 
          content: message
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: options.model || this.model,
        messages: messages,
        temperature: options.temperature || this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
        stream: options.stream || false,
      });

      return {
        success: true,
        data: {
          message: response.choices[0].message.content,
          usage: response.usage,
          model: response.model,
          conversationId: options.conversationId || this.generateConversationId()
        }
      };
    } catch (error) {
      console.error("KIMI 聊天API调用错误:", error);
      return {
        success: false,
        error: {
          message: error.message,
          type: error.type || "API_ERROR"
        }
      };
    }
  }

  /**
   * 流式聊天响应（用于实时对话）
   * @param {string} message - 用户消息
   * @param {Array} conversationHistory - 对话历史
   * @param {Function} onChunk - 处理每个响应块的回调函数
   * @param {Object} options - 其他选项
   */
  async streamMessage(message, conversationHistory = [], onChunk, options = {}) {
    try {
      const messages = [
        {
          role: "system",
          content: "你是一个专业的医疗助手，具备丰富的医学知识。请用中文回答用户的问题，提供准确、有用的医疗建议。"
        },
        ...conversationHistory,
        {
          role: "user",
          content: message
        }
      ];

      const stream = await this.openai.chat.completions.create({
        model: options.model || this.model,
        messages: messages,
        temperature: options.temperature || this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
        stream: true,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullResponse += content;
        if (onChunk) {
          onChunk(content, fullResponse);
        }
      }

      return {
        success: true,
        data: {
          message: fullResponse,
          conversationId: options.conversationId || this.generateConversationId()
        }
      };
    } catch (error) {
      console.error("KIMI 流式聊天API调用错误:", error);
      return {
        success: false,
        error: {
          message: error.message,
          type: error.type || "STREAM_ERROR"
        }
      };
    }
  }

  /**
   * 生成对话ID
   * @returns {string} - 唯一的对话ID
   */
  generateConversationId() {
    return `kimi-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取可用模型列表
   * @returns {Array} - 可用模型列表
   */
  getAvailableModels() {
    return [
      "moonshot-v1-8k",   // 8K上下文长度
      "moonshot-v1-32k",  // 32K上下文长度  
      "moonshot-v1-128k"  // 128K上下文长度
    ];
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} - 服务状态
   */
  async healthCheck() {
    try {
      const response = await this.sendMessage("你好", [], { maxTokens: 10 });
      return {
        status: response.success ? "healthy" : "unhealthy",
        model: this.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default KIMIChatService;