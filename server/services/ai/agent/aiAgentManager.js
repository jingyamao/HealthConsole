import { ChatOpenAI } from "@langchain/openai";
import { Tool } from "@langchain/core/tools";
import aiService from "../aiService.js";

/**
 * 数据库查询工具
 * 用于处理患者信息查询、统计数据等数据库相关操作
 */
class DatabaseQueryTool extends Tool {
  constructor() {
    super();
    this.name = "database_query";
    this.description = "用于查询患者信息、统计数据、筛选患者等数据库操作。支持查询患者基本信息、疾病统计、就诊记录等。";
  }

  async _call(input) {
    try {
      console.log('📊 执行数据库查询:', input);
      
      // 这里可以集成实际的数据库查询逻辑
      // 目前返回模拟数据
      const mockResults = {
        patient_count: 156,
        beijing_patients: 23,
        diabetes_patients: 45,
        hypertension_patients: 67
      };
      
      return `数据库查询结果：
- 总患者数: ${mockResults.patient_count}
- 北京患者数: ${mockResults.beijing_patients}
- 糖尿病患者数: ${mockResults.diabetes_patients}
- 高血压患者数: ${mockResults.hypertension_patients}

注：此为演示数据，实际使用时需要连接真实数据库。`;
      
    } catch (error) {
      console.error('数据库查询失败:', error);
      return `数据库查询失败: ${error.message}`;
    }
  }
}

/**
 * 医疗对话工具
 * 用于处理症状咨询、治疗建议、健康指导等医疗相关问题
 */
class MedicalChatTool extends Tool {
  constructor() {
    super();
    this.name = "medical_chat";
    this.description = "用于回答医疗健康相关问题，提供症状分析、治疗建议、健康指导等专业医疗建议。";
  }

  async _call(input) {
    try {
      console.log('🏥 执行医疗对话:', input);
      
      // 使用KIMI模型进行医疗对话
      const response = await aiService.chatWithKIMI(input);
      
      if (response.success) {
        return response.data.message;
      } else {
        return `抱歉，我无法提供医疗建议：${response.error.message}`;
      }
      
    } catch (error) {
      console.error('医疗对话失败:', error);
      return `医疗对话处理失败: ${error.message}`;
    }
  }
}

/**
 * 向量搜索工具
 * 用于搜索知识库、查找相似病例、检索医疗文档等
 */
class VectorSearchTool extends Tool {
  constructor() {
    super();
    this.name = "vector_search";
    this.description = "用于搜索医疗知识库、查找相似病例、检索诊疗指南、搜索相关医疗文档等向量相似性搜索。";
  }

  async _call(input) {
    try {
      console.log('🔍 执行向量搜索:', input);
      
      // 使用AI服务的向量搜索功能
      const searchResults = await aiService.searchKnowledge(input);
      
      if (searchResults && searchResults.length > 0) {
        const formattedResults = searchResults.map((result, index) => {
          return `${index + 1}. ${result.content || result.text || '无内容'}\n   相似度: ${(result.score * 100).toFixed(1)}%`;
        }).join('\n\n');
        
        return `向量搜索结果（找到${searchResults.length}条相关内容）：\n\n${formattedResults}`;
      } else {
        return `抱歉，在知识库中没有找到与"${input}"相关的内容。建议您：
1. 尝试使用不同的关键词
2. 检查拼写是否正确
3. 使用更具体的搜索词`;
      }
      
    } catch (error) {
      console.error('向量搜索失败:', error);
      return `向量搜索失败: ${error.message}`;
    }
  }
}

/**
 * 简化的AI Agent管理器
 * 不使用复杂的LangChain框架，直接管理工具调用
 */
class AIAgentManager {
  constructor() {
    this.tools = {
      database_query: new DatabaseQueryTool(),
      medical_chat: new MedicalChatTool(),
      vector_search: new VectorSearchTool()
    };
    
    this.chatHistory = [];
    this.initializeAgent();
  }

  /**
   * 初始化AI Agent
   */
  async initializeAgent() {
    try {
      // 创建语言模型
      this.model = new ChatOpenAI({
        openAIApiKey: process.env.KIMI_API_KEY,
        configuration: {
          baseURL: "https://api.moonshot.cn/v1"
        },
        modelName: "moonshot-v1-8k",
        temperature: 0.7,
        maxTokens: 2048
      });

      console.log('✅ AI Agent初始化完成');
      
    } catch (error) {
      console.error('❌ AI Agent初始化失败:', error);
      throw error;
    }
  }

  /**
   * 使用AI判断应该调用哪个工具
   */
  async determineTool(userInput) {
    try {
      const systemPrompt = `你是一个专业的医疗助手AI，需要判断用户的问题应该使用哪个工具来处理。

可用工具：
1. database_query: 用于查询患者信息、统计数据、筛选患者等数据库操作
2. medical_chat: 用于回答医疗健康相关问题，提供症状分析、治疗建议
3. vector_search: 用于搜索医疗知识库、查找相似病例、检索诊疗指南

请根据用户的问题，选择最合适的工具。只返回工具名称，不要返回其他内容。`;

      const response = await this.model.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ]);

      const toolName = response.content.toLowerCase().trim();
      
      // 验证工具是否存在
      if (this.tools[toolName]) {
        return toolName;
      } else {
        // 默认使用医疗对话工具
        return 'medical_chat';
      }
      
    } catch (error) {
      console.error('工具选择失败:', error);
      return 'medical_chat'; // 默认使用医疗对话工具
    }
  }

  /**
   * 执行用户输入
   * @param {string} input - 用户输入
   * @param {Object} context - 上下文信息
   * @returns {Promise<Object>} - 执行结果
   */
  async execute(input, context = {}) {
    try {
      console.log('🤖 AI Agent执行用户输入:', input);
      
      // 添加到对话历史
      this.chatHistory.push({ role: 'user', content: input });
      
      // 判断使用哪个工具
      const toolName = await this.determineTool(input);
      console.log(`🔧 选择工具: ${toolName}`);
      
      // 执行工具
      const tool = this.tools[toolName];
      let toolResult;
      
      try {
        toolResult = await tool._call(input);
      } catch (error) {
        console.error(`工具 ${toolName} 执行失败:`, error);
        toolResult = `抱歉，处理您的请求时遇到了问题：${error.message}`;
      }
      
      // 添加到对话历史
      this.chatHistory.push({ role: 'assistant', content: toolResult });
      
      console.log('✅ AI Agent执行完成');
      
      return {
        success: true,
        output: toolResult,
        toolsUsed: [{
          tool: toolName,
          toolInput: input,
          result: toolResult
        }],
        input: input,
        toolName: toolName
      };
      
    } catch (error) {
      console.error('❌ AI Agent执行失败:', error);
      return {
        success: false,
        error: {
          message: error.message,
          type: 'AGENT_EXECUTION_ERROR'
        },
        input: input
      };
    }
  }

  /**
   * 获取Agent状态
   * @returns {Object} - Agent状态信息
   */
  getStatus() {
    return {
      initialized: this.model !== null,
      tools: Object.keys(this.tools),
      historyLength: this.chatHistory.length
    };
  }

  /**
   * 清除对话历史
   */
  clearHistory() {
    this.chatHistory = [];
    console.log('🧹 AI Agent对话历史已清除');
  }

  /**
   * 获取对话历史
   * @returns {Array} - 对话历史
   */
  getChatHistory() {
    return this.chatHistory;
  }
}

export default AIAgentManager;