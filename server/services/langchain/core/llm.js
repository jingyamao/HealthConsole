import { ChatOpenAI } from "@langchain/openai";

/**
 * 创建LLM实例
 * 使用KIMI (Moonshot)作为底层模型
 * @param {Object} options - 配置选项
 * @param {string} options.modelName - 模型名称，默认从环境变量读取
 * @param {number} options.temperature - 温度参数，控制输出随机性 (0-1)
 * @param {number} options.maxTokens - 最大令牌数
 * @returns {ChatOpenAI} LLM实例
 */
export function createLLM(options = {}) {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    console.error("KIMI_API_KEY 环境变量未设置");
  }

  return new ChatOpenAI({
    apiKey: apiKey,
    configuration: {
      baseURL: "https://api.moonshot.cn/v1"
    },
    model: options.modelName || process.env.KIMI_MODEL || "moonshot-v1-8k",
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens || 2048,
    ...options
  });
}

/**
 * 默认LLM实例
 * 使用环境变量中的配置
 */
export const defaultLLM = createLLM();
