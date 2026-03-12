import IntentRecognitionService from './intent/intentRecognition.js';

/**
 * 智能对话处理器
 * 整合意图识别和对应的处理逻辑
 */
class SmartDialogueProcessor {
  constructor(aiService) {
    this.aiService = aiService;
    this.intentService = new IntentRecognitionService();
    this.intentTypes = this.intentService.getIntentTypes();
    
    // 处理函数映射
    this.processors = {
      [this.intentTypes.DATABASE_QUERY]: this.processDatabaseQuery.bind(this),
      [this.intentTypes.MEDICAL_CHAT]: this.processMedicalChat.bind(this),
      [this.intentTypes.VECTOR_SEARCH]: this.processVectorSearch.bind(this),
      [this.intentTypes.OTHER]: this.processOther.bind(this)
    };
  }

  /**
   * 处理用户消息的主入口
   * @param {string} userMessage - 用户输入的消息
   * @param {Object} context - 上下文信息（可选）
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processMessage(userMessage, context = {}, options = {}) {
    console.log('🔍 开始处理用户消息:', userMessage);
    
    try {
      // 1. 意图识别
      console.log('🎯 进行意图识别...');
      const intentResult = await this.intentService.analyzeIntent(userMessage, options);
      
      if (!intentResult.success) {
        return {
          success: false,
          error: intentResult.error,
          intent: intentResult.intent,
          response: '抱歉，我无法理解您的意图，请重新表述您的问题。'
        };
      }

      console.log('✅ 意图识别完成:', intentResult);

      // 2. 根据意图类型调用相应的处理器
      const processor = this.processors[intentResult.intent];
      if (!processor) {
        return {
          success: false,
          error: { message: '未找到对应的处理器', type: 'PROCESSOR_NOT_FOUND' },
          intent: intentResult.intent,
          response: '抱歉，暂时无法处理此类请求。'
        };
      }

      console.log(`🔄 调用 ${intentResult.intent} 处理器...`);
      const result = await processor(userMessage, context, options);
      
      return {
        success: true,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        reasoning: intentResult.reasoning,
        ...result
      };

    } catch (error) {
      console.error('❌ 消息处理失败:', error);
      return {
        success: false,
        error: {
          message: error.message,
          type: 'MESSAGE_PROCESSING_ERROR'
        },
        response: '抱歉，处理您的请求时出现了错误，请稍后再试。'
      };
    }
  }

  /**
   * 处理数据库查询意图
   * @param {string} message - 用户消息
   * @param {Object} context - 上下文
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processDatabaseQuery(message, context = {}, options = {}) {
    console.log('📊 处理数据库查询请求...');
    
    // 这里可以集成具体的数据库查询逻辑
    // 暂时返回模拟响应，后续可以接入实际的数据库查询服务
    
    const mockResponse = `我理解您想要查询数据库信息："${message}"
    
目前数据库查询功能正在开发中，您可以：
1. 提供更具体的查询条件
2. 联系系统管理员获取帮助
3. 使用其他可用的功能`;

    return {
      type: 'database_query',
      response: mockResponse,
      suggestion: '建议使用更具体的查询条件，如患者姓名、疾病类型等。'
    };
  }

  /**
   * 处理医疗对话意图
   * @param {string} message - 用户消息
   * @param {Object} context - 上下文
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processMedicalChat(message, context = {}, options = {}) {
    console.log('🏥 处理医疗对话请求...');
    
    try {
      // 使用AI服务的KIMI聊天功能
      const response = await this.aiService.chatWithKIMI(message, context.conversationHistory || [], options);
      
      if (response.success) {
        return {
          type: 'medical_chat',
          response: response.data.message,
          usage: response.data.usage,
          conversationId: response.data.conversationId
        };
      } else {
        return {
          type: 'medical_chat',
          response: '抱歉，我无法提供医疗建议，请咨询专业医生。',
          error: response.error
        };
      }
    } catch (error) {
      console.error('医疗对话处理失败:', error);
      return {
        type: 'medical_chat',
        response: '抱歉，处理您的医疗咨询时出现了错误。',
        error: { message: error.message }
      };
    }
  }

  /**
   * 处理向量搜索意图
   * @param {string} message - 用户消息
   * @param {Object} context - 上下文
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processVectorSearch(message, context = {}, options = {}) {
    console.log('🔍 处理向量搜索请求...');
    
    try {
      // 使用AI服务的向量搜索功能
      const searchResults = await this.aiService.searchKnowledge(message, options);
      
      if (searchResults && searchResults.length > 0) {
        const formattedResults = this.formatSearchResults(searchResults);
        return {
          type: 'vector_search',
          response: `根据您的搜索请求"${message}"，我找到了以下相关信息：\n\n${formattedResults}`,
          results: searchResults,
          resultCount: searchResults.length
        };
      } else {
        return {
          type: 'vector_search',
          response: `抱歉，在知识库中没有找到与"${message}"相关的内容。\n\n建议：\n1. 尝试使用不同的关键词\n2. 检查拼写是否正确\n3. 使用更具体的搜索词`,
          results: [],
          resultCount: 0
        };
      }
    } catch (error) {
      console.error('向量搜索处理失败:', error);
      return {
        type: 'vector_search',
        response: '抱歉，搜索知识库时出现了错误。',
        error: { message: error.message }
      };
    }
  }

  /**
   * 处理其他类型意图
   * @param {string} message - 用户消息
   * @param {Object} context - 上下文
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processOther(message, context = {}, options = {}) {
    console.log('💬 处理其他类型请求...');
    
    // 对于非医疗相关的问题，提供友好的响应
    const otherResponses = [
      "您好！我是一个专业的医疗助手，主要提供医疗健康相关的服务。",
      "我可以帮助您查询患者信息、提供医疗建议、搜索医疗知识库等。",
      "如果您有医疗健康相关的问题，我很乐意为您提供帮助！"
    ];
    
    const randomResponse = otherResponses[Math.floor(Math.random() * otherResponses.length)];
    
    return {
      type: 'other',
      response: randomResponse,
      suggestion: '您可以询问医疗健康相关的问题，如症状、治疗、药物等。'
    };
  }

  /**
   * 格式化搜索结果
   * @param {Array} results - 搜索结果数组
   * @returns {string} - 格式化后的结果文本
   */
  formatSearchResults(results) {
    return results.map((result, index) => {
      return `${index + 1}. ${result.content || result.text || '无内容'}\n   相似度: ${(result.score * 100).toFixed(1)}%`;
    }).join('\n\n');
  }

  /**
   * 批量处理多个消息
   * @param {Array} messages - 消息数组
   * @param {Object} context - 上下文
   * @param {Object} options - 选项
   * @returns {Promise<Array>} - 处理结果数组
   */
  async processMultipleMessages(messages, context = {}, options = {}) {
    const results = [];
    
    for (const message of messages) {
      const result = await this.processMessage(message, context, options);
      results.push({
        message,
        ...result
      });
    }
    
    return results;
  }

  /**
   * 获取支持的意图类型
   * @returns {Object} - 意图类型定义
   */
  getSupportedIntents() {
    return this.intentService.getIntentDescriptions();
  }
}

export default SmartDialogueProcessor;