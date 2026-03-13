import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { defaultLLM } from "../../core/llm.js";

// 意图类型定义
const INTENT_TYPES = {
  DATABASE_QUERY: 'database_query',
  MEDICAL_CHAT: 'medical_chat',
  VECTOR_SEARCH: 'vector_search',
  OTHER: 'other'
};

/**
 * 解析意图识别响应
 * @param {string} responseText - LLM响应文本
 * @returns {Object} - 解析后的意图结果
 */
function parseIntentResponse(responseText) {
  try {
    // 尝试提取JSON格式的响应
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: validateIntentType(parsed.intent),
        confidence: parseFloat(parsed.confidence) || 0.8,
        reasoning: parsed.reasoning || '未提供理由'
      };
    }

    // 如果无法解析JSON，使用备用方案
    return fallbackIntentRecognition(responseText);

  } catch (error) {
    console.warn('意图响应解析失败，使用备用方案:', error);
    return fallbackIntentRecognition(responseText);
  }
}

/**
 * 验证意图类型是否有效
 * @param {string} intent - 意图类型
 * @returns {string} - 验证后的意图类型
 */
function validateIntentType(intent) {
  const validIntents = Object.values(INTENT_TYPES);
  return validIntents.includes(intent) ? intent : INTENT_TYPES.MEDICAL_CHAT;
}

/**
 * 备用意图识别方案（关键词匹配）
 * @param {string} message - 用户消息
 * @returns {Object} - 意图识别结果
 */
function fallbackIntentRecognition(message) {
  const messageLower = message.toLowerCase();

  // 数据库查询关键词
  const dbKeywords = ['查询', '查找', '有哪些', '统计', '列出', '搜索患者', '筛选', '找出'];
  if (dbKeywords.some(keyword => messageLower.includes(keyword))) {
    return {
      intent: INTENT_TYPES.DATABASE_QUERY,
      confidence: 0.7,
      reasoning: '检测到数据库查询相关关键词'
    };
  }

  // 向量搜索关键词
  const vectorKeywords = ['相似', '相关知识', '文档', '指南', '病例', '类似', '知识库', '资料'];
  if (vectorKeywords.some(keyword => messageLower.includes(keyword))) {
    return {
      intent: INTENT_TYPES.VECTOR_SEARCH,
      confidence: 0.7,
      reasoning: '检测到向量搜索相关关键词'
    };
  }

  // 默认分类为医疗对话
  return {
    intent: INTENT_TYPES.MEDICAL_CHAT,
    confidence: 0.6,
    reasoning: '默认分类为医疗咨询'
  };
}

/**
 * 意图识别工具
 * 用于分析用户输入并识别其意图类型
 */
export const intentRecognitionTool = new DynamicStructuredTool({
  name: "intent_recognition",
  description: "用于分析用户消息的意图，判断用户是想要进行医疗咨询、数据库查询还是知识库搜索。",
  schema: z.object({
    message: z.string().describe("用户输入的消息内容")
  }),
  func: async ({ message }) => {
    try {
      console.log("🎯 执行意图识别:", message);

      const systemPrompt = `你是一个专业的AI意图识别系统，用于分析医疗对话系统中用户的意图。
        请将用户意图分类为以下四种类型之一：

        1. **database_query** (数据库查询)
        - 用户想要查询数据库中的信息
        - 典型关键词："查询", "查找", "有哪些", "统计", "列出", "搜索患者", "筛选"
        - 示例："帮我查一下有哪些患者住在北京", "糖尿病患者有多少人"

        2. **medical_chat** (普通医疗对话)
        - 用户询问医疗健康问题、寻求医疗建议
        - 典型关键词："症状", "治疗", "药物", "疾病", "诊断", "预防", "建议"
        - 示例："我最近总是头痛，可能是什么原因", "高血压应该如何治疗"

        3. **vector_search** (向量搜索)
        - 用户想要搜索知识库、查找相似病例或医疗文档
        - 典型关键词："相似", "相关知识", "文档", "指南", "病例", "类似", "知识库"
        - 示例："查找与这个症状相似的病例", "搜索相关的诊疗指南"

        4. **other** (其他功能)
        - 不属于以上三类的其他话题
        - 包括：闲聊、问候、非医疗问题等
        - 示例："你好", "今天天气怎么样", "谢谢"

        **输出格式（必须严格返回JSON）：**
        {"intent": "意图类型", "confidence": 0.95, "reasoning": "分类理由说明"}`;

      const userPrompt = `请分析以下用户消息的意图：
        用户消息："${message}"
        请按照指定格式返回JSON结果。`;

      const response = await defaultLLM.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]);

      const result = parseIntentResponse(response.content);

      return JSON.stringify(result);

    } catch (error) {
      console.error("❌ 意图识别失败:", error);
      return JSON.stringify({
        intent: INTENT_TYPES.MEDICAL_CHAT,
        confidence: 0.5,
        reasoning: "意图识别失败，默认使用医疗对话"
      });
    }
  }
});
