import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { defaultLLM } from "../../core/llm.js";

// 意图类型定义
const INTENT_TYPES = {
  DATABASE_QUERY: 'database_query',
  MEDICAL_CHAT: 'medical_chat',
  VECTOR_SEARCH: 'vector_search',
  LIST_KNOWLEDGE_BASE: 'list_knowledge_base',
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

  // 知识库列表查询 - 最高优先级
  const listKnowledgeKeywords = ['有哪些', '有什么', '列表', '所有', '全部', '目录', '列举'];
  const hasKnowledgeBase = messageLower.includes('知识库') || messageLower.includes('知识文档') || 
                           messageLower.includes('文档') || messageLower.includes('指南');
  
  if (hasKnowledgeBase && listKnowledgeKeywords.some(kw => messageLower.includes(kw))) {
    return {
      intent: INTENT_TYPES.LIST_KNOWLEDGE_BASE,
      confidence: 0.9,
      reasoning: '用户想查看知识库中的所有文档列表'
    };
  }

  // 数据库查询关键词 - 更具体的患者数据查询
  const dbKeywords = ['患者', '病人', '病例', '张三', '李四', '统计', '筛选', '找出'];
  const dbContextKeywords = ['查询患者', '查找病人', '统计病例', '筛选患者'];
  
  // 只有当明确提到患者/病人相关查询时才使用数据库查询
  if (dbContextKeywords.some(keyword => messageLower.includes(keyword)) ||
      (dbKeywords.some(keyword => messageLower.includes(keyword)) && 
       (messageLower.includes('查询') || messageLower.includes('查找')))) {
    return {
      intent: INTENT_TYPES.DATABASE_QUERY,
      confidence: 0.7,
      reasoning: '检测到患者数据查询相关关键词'
    };
  }

  // 向量搜索关键词 - 更广泛的知识搜索
  const vectorKeywords = ['文档', '指南', '知识库', '资料', '相似', '类似', '相关知识', '搜索', '查找'];
  const vectorContextKeywords = ['诊疗指南', '知识文档', '相似病例', '相关文档'];
  
  // 如果涉及知识搜索但未明确提到患者查询，使用向量搜索
  if (vectorContextKeywords.some(keyword => messageLower.includes(keyword)) ||
      (vectorKeywords.some(keyword => messageLower.includes(keyword)) && 
       !messageLower.includes('患者') && !messageLower.includes('病人'))) {
    return {
      intent: INTENT_TYPES.VECTOR_SEARCH,
      confidence: 0.7,
      reasoning: '检测到知识库搜索相关关键词'
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
        请将用户意图分类为以下五种类型之一：

        1. **list_knowledge_base** (知识库列表查询) - 最高优先级
        - 用户想查看知识库中的所有文档、列表、目录
        - 典型场景：询问知识库有哪些内容、列举所有文档、查看知识库列表
        - 关键特征：包含"有哪些"、"有什么"、"列表"、"所有"、"全部"、"目录"、"列举"等词
        - 示例："知识库有哪些内容", "列举所有文档", "查看知识库列表", "数据库有哪些知识文档"
        - 注意：只要用户询问知识库的列表或目录，优先使用此类型

        2. **database_query** (数据库查询)
        - 用户明确要求查询数据库中的结构化患者数据
        - 典型场景：查询具体患者信息、统计患者数量、筛选特定条件的患者
        - 关键特征：包含具体查询条件（如姓名、年龄、疾病类型、住址等）
        - 示例："帮我查一下张三的病例信息", "统计糖尿病患者数量", "找出住在北京的患者"
        - 注意：如果只是查询知识文档、诊疗指南等非结构化信息，应归类为向量搜索或列表查询

        3. **medical_chat** (普通医疗对话)
        - 用户询问医疗健康问题、寻求医疗建议
        - 典型场景：症状咨询、治疗方案、药物使用、疾病预防
        - 关键特征：不涉及具体的数据查询，主要是医疗知识咨询
        - 示例："我最近总是头痛，可能是什么原因", "高血压应该如何治疗"

        4. **vector_search** (向量搜索)
        - 用户想要搜索知识库中的具体内容、查找相似病例或医疗文档
        - 典型场景：查询特定知识文档、诊疗指南、相似病例、医疗资料
        - 关键特征：涉及非结构化信息的搜索，如文档、指南、知识库内容
        - 示例："查找高血压的诊疗指南", "搜索与这个症状相似的病例", "糖尿病的治疗方法"
        - 特别注意：以下情况应归类为向量搜索：
           - 查询特定知识文档内容
           - 查找相似病例或症状
           - 搜索医疗知识库中的具体内容

        5. **other** (其他功能)
        - 不属于以上四类的其他话题
        - 包括：闲聊、问候、非医疗问题等
        - 示例："你好", "今天天气怎么样", "谢谢"

        **重要判断原则（按优先级）：**
        1. 如果用户询问知识库有哪些内容/文档/列表 → 使用 list_knowledge_base
        2. 如果用户的问题涉及查询具体患者的数据（如姓名、ID、具体病例）→ 使用 database_query
        3. 如果用户的问题涉及搜索特定知识、文档、指南内容 → 使用 vector_search
        4. 如果用户只是咨询医疗问题，不涉及数据查询 → 使用 medical_chat

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
