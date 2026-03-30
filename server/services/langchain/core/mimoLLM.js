import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

/**
 * 小米 MIMO 大模型服务
 * 支持普通调用和联网调用两种模式
 */
class MIMOService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.MIMO_API_KEY,
      baseURL: "https://api.xiaomimimo.com/v1",
    });
    
    this.model = "mimo-v2-pro";
    this.temperature = 0.7;
    this.maxTokens = 4096;
    this.topP = 0.95;
  }

  /**
   * 获取系统提示词
   * @returns {string} 系统提示词
   */
  getSystemPrompt() {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `You are MiMo, an AI assistant developed by Xiaomi. Today is date: ${currentDate}. Your knowledge cutoff date is December 2024.`;
  }

  /**
   * 普通聊天调用（不联网）
   * @param {Array} messages - 消息数组
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 返回响应结果
   */
  async chat(messages, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          ...messages
        ],
        max_completion_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature ?? this.temperature,
        top_p: options.topP ?? this.topP,
        stream: options.stream || false,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        extra_body: {
          thinking: { type: "disabled" }
        }
      });

      return {
        success: true,
        data: {
          content: response.choices[0].message.content,
          usage: response.usage,
          model: response.model
        }
      };
    } catch (error) {
      console.error("MIMO 普通聊天 API 调用错误:", error);
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
   * 联网聊天调用（使用 web_search 工具）
   * @param {Array} messages - 消息数组
   * @param {Object} options - 配置选项
   * @param {Object} searchConfig - 搜索配置
   * @returns {Promise<Object>} - 返回响应结果
   */
  async chatWithWebSearch(messages, options = {}, searchConfig = {}) {
    try {
      const tools = [
        {
          type: "web_search",
          max_keyword: searchConfig.maxKeyword || 3,
          force_search: searchConfig.forceSearch ?? true,
          limit: searchConfig.limit || 5,
          user_location: {
            type: "approximate",
            country: searchConfig.country || "China",
            region: searchConfig.region || "Beijing",
            city: searchConfig.city || "Beijing"
          }
        }
      ];

      const response = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          ...messages
        ],
        max_completion_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature ?? this.temperature,
        top_p: options.topP ?? this.topP,
        stream: options.stream || false,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        extra_body: {
          thinking: { type: "disabled" }
        },
        tools: tools,
        tool_choice: "auto"
      });

      return {
        success: true,
        data: {
          content: response.choices[0].message.content,
          usage: response.usage,
          model: response.model,
          toolCalls: response.choices[0].message.tool_calls
        }
      };
    } catch (error) {
      console.error("MIMO 联网聊天 API 调用错误:", error);
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
   * 简单消息发送（快捷方法）
   * @param {string} message - 用户消息
   * @param {boolean} useWebSearch - 是否使用联网搜索
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 返回响应结果
   */
  async send(message, useWebSearch = false, options = {}) {
    if (useWebSearch) {
      return await this.chatWithWebSearch(
        [{ role: "user", content: message }],
        options,
        options.searchConfig || {}
      );
    } else {
      return await this.chat(
        [{ role: "user", content: message }],
        options
      );
    }
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} - 服务状态
   */
  async healthCheck() {
    try {
      const response = await this.send("你好", false, { maxTokens: 10 });
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

  /**
   * 获取可用模型列表
   * @returns {Array} - 可用模型列表
   */
  getAvailableModels() {
    return [
      "mimo-v2-pro",
      "mimo-v2-lite"
    ];
  }
}

// 创建单例实例
const mimoService = new MIMOService();

export default mimoService;
export { MIMOService };
