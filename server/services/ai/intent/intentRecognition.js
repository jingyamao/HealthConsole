import KIMIChatService from '../chat/aiChat.js';

/**
 * AI 意图识别服务
 * 用于分析用户输入并分类为不同的意图类型
 */
class IntentRecognitionService {
  constructor() {
    this.kimiChatService = new KIMIChatService();
    this.intentTypes = {
      DATABASE_QUERY: 'database_query',      // 数据库查询
      MEDICAL_CHAT: 'medical_chat',          // 普通医疗对话
      VECTOR_SEARCH: 'vector_search',        // 向量搜索
      OTHER: 'other'                         // 其他功能
    };
  }

  /**
   * 分析用户意图
   * @param {string} userMessage - 用户输入的消息
   * @param {Object} options - 选项配置
   * @returns {Promise<Object>} - 返回意图分析结果
   */
  async analyzeIntent(userMessage, options = {}) {
    try {
      const systemPrompt = this.buildIntentRecognitionPrompt();
      const userPrompt = this.buildUserIntentPrompt(userMessage);
      
      const response = await this.kimiChatService.sendMessage(userPrompt, [
        {
          role: "system",
          content: systemPrompt
        }
      ], {
        temperature: 0.1, // 降低随机性，提高准确性
        maxTokens: 100,
        ...options
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          intent: this.intentTypes.OTHER
        };
      }

      const intentResult = this.parseIntentResponse(response.data.message);
      return {
        success: true,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        reasoning: intentResult.reasoning,
        originalMessage: userMessage,
        rawResponse: response.data.message
      };

    } catch (error) {
      console.error('意图识别失败:', error);
      return {
        success: false,
        error: {
          message: error.message,
          type: 'INTENT_RECOGNITION_ERROR'
        },
        intent: this.intentTypes.OTHER
      };
    }
  }

  /**
   * 构建意图识别系统提示词
   * @returns {string} - 系统提示词
   */
  buildIntentRecognitionPrompt() {
    return `你是一个专业的AI意图识别系统，专门用于分析医疗对话系统中的用户意图。

    你的任务是准确识别用户的真实意图，并将其分类为以下四种类型之一：

    1. **database_query** (数据库查询)
    - 用户想要查询数据库中的信息
    - 典型关键词："查询", "查找", "有哪些", "统计", "列出", "搜索患者", "筛选"
    - 示例：
        - "帮我查一下有哪些患者住在北京"
        - "糖尿病患者有多少人"
        - "列出所有高血压患者的信息"
        - "搜索最近就诊的患者"

    2. **medical_chat** (普通医疗对话)
    - 用户询问医疗健康问题、寻求医疗建议
    - 典型关键词："症状", "治疗", "药物", "疾病", "诊断", "预防", "建议"
    - 示例：
        - "我最近总是头痛，可能是什么原因"
        - "糖尿病患者饮食要注意什么"
        - "高血压应该如何治疗"
        - "感冒吃什么药比较好"

    3. **vector_search** (向量搜索)
    - 用户想要搜索知识库、查找相似病例或医疗文档
    - 典型关键词："相似", "相关知识", "文档", "指南", "病例", "类似"
    - 示例：
        - "查找与这个症状相似的病例"
        - "搜索相关的诊疗指南"
        - "有没有类似的病例参考"
        - "知识库中关于糖尿病的资料"

    4. **other** (其他功能)
    - 不属于以上三类的其他话题
    - 包括：闲聊、问候、非医疗问题、系统操作等
    - 示例：
        - "你好"
        - "今天天气怎么样"
        - "你会做什么"
        - "谢谢"

    **重要规则：**
    - 必须返回JSON格式，包含intent、confidence、reasoning字段
    - intent只能是上述四种类型之一
    - confidence是0-1之间的置信度分数
    - reasoning简要说明分类理由
    - 优先匹配最具体的意图类型

    **输出格式：**
    {"intent": "意图类型", "confidence": 0.95, "reasoning": "分类理由说明"}`;
  }

  /**
   * 构建用户意图分析提示词
   * @param {string} userMessage - 用户消息
   * @returns {string} - 用户提示词
   */
  buildUserIntentPrompt(userMessage) {
    return `请分析以下用户消息的意图，并按照指定格式返回分析结果：

    用户消息："${userMessage}"

    请根据上述分类标准，判断这条消息最可能属于哪种意图类型，并给出置信度和理由。`;
  }

  /**
   * 解析KIMI返回的意图识别结果
   * @param {string} responseText - KIMI的响应文本
   * @returns {Object} - 解析后的意图结果
   */
  parseIntentResponse(responseText) {
    try {
      // 尝试提取JSON格式的响应
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: this.validateIntentType(parsed.intent),
          confidence: parseFloat(parsed.confidence) || 0.8,
          reasoning: parsed.reasoning || '未提供理由'
        };
      }
      
      // 如果无法解析JSON，进行关键词匹配
      return this.fallbackIntentRecognition(responseText);
      
    } catch (error) {
      console.warn('意图响应解析失败，使用备用方案:', error);
      return this.fallbackIntentRecognition(responseText);
    }
  }

  /**
   * 验证意图类型是否有效
   * @param {string} intent - 意图类型
   * @returns {string} - 验证后的意图类型
   */
  validateIntentType(intent) {
    const validIntents = Object.values(this.intentTypes);
    return validIntents.includes(intent) ? intent : this.intentTypes.OTHER;
  }

  /**
   * 备用意图识别方案（关键词匹配）
   * @param {string} message - 用户消息
   * @returns {Object} - 意图识别结果
   */
  fallbackIntentRecognition(message) {
    const messageLower = message.toLowerCase();
    
    // 数据库查询关键词
    const dbKeywords = ['查询', '查找', '有哪些', '统计', '列出', '搜索患者', '筛选', '筛选出', '找出', '统计'];
    if (dbKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        intent: this.intentTypes.DATABASE_QUERY,
        confidence: 0.7,
        reasoning: '检测到数据库查询相关关键词'
      };
    }
    
    // 向量搜索关键词
    const vectorKeywords = ['相似', '相关知识', '文档', '指南', '病例', '类似', '知识库', '资料'];
    if (vectorKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        intent: this.intentTypes.VECTOR_SEARCH,
        confidence: 0.7,
        reasoning: '检测到向量搜索相关关键词'
      };
    }
    
    // 医疗相关关键词
    const medicalKeywords = ['症状', '治疗', '药物', '疾病', '诊断', '预防', '建议', '原因', '怎么办', '如何', '应该'];
    if (medicalKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        intent: this.intentTypes.MEDICAL_CHAT,
        confidence: 0.7,
        reasoning: '检测到医疗咨询相关关键词'
      };
    }
    
    // 默认分类为其他
    return {
      intent: this.intentTypes.OTHER,
      confidence: 0.5,
      reasoning: '未检测到特定领域关键词'
    };
  }

  /**
   * 批量分析多个消息的意图
   * @param {string[]} messages - 消息数组
   * @param {Object} options - 选项配置
   * @returns {Promise<Array>} - 意图分析结果数组
   */
  async analyzeMultipleIntents(messages, options = {}) {
    const results = [];
    
    for (const message of messages) {
      const result = await this.analyzeIntent(message, options);
      results.push({
        message,
        ...result
      });
    }
    
    return results;
  }

  /**
   * 获取意图类型定义
   * @returns {Object} - 意图类型定义
   */
  getIntentTypes() {
    return { ...this.intentTypes };
  }

  /**
   * 获取意图类型说明
   * @returns {Object} - 意图类型详细说明
   */
  getIntentDescriptions() {
    return {
      [this.intentTypes.DATABASE_QUERY]: {
        name: '数据库查询',
        description: '用户想要查询数据库中的患者信息、统计数据等',
        examples: ['有哪些患者住在北京', '糖尿病患者有多少人', '统计高血压患者数量']
      },
      [this.intentTypes.MEDICAL_CHAT]: {
        name: '医疗对话',
        description: '用户询问医疗健康问题、寻求医疗建议',
        examples: ['头痛是什么原因', '糖尿病饮食注意什么', '高血压如何治疗']
      },
      [this.intentTypes.VECTOR_SEARCH]: {
        name: '向量搜索',
        description: '用户想要搜索知识库、查找相似病例或医疗文档',
        examples: ['查找相似病例', '搜索诊疗指南', '知识库中关于糖尿病的资料']
      },
      [this.intentTypes.OTHER]: {
        name: '其他功能',
        description: '不属于以上三类的其他话题，如闲聊、问候等',
        examples: ['你好', '今天天气如何', '谢谢']
      }
    };
  }
}

export default IntentRecognitionService;