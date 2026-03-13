import VectorService from './vector/vectorService.js';
import KnowledgeBaseService from './knowledge/knowledgeBaseService.js';
import { aliyunEmbeddings } from './embedding/aliyunEmbedding.js';
import KIMIChatService from './chat/aiChat.js';

/**
 * AI 主服务 - 整合所有 AI 功能
 */
class AIService {
  constructor() {
    this.vectorService = new VectorService();
    this.knowledgeBaseService = new KnowledgeBaseService();
    this.kimiChatService = new KIMIChatService();
    this.embeddings = aliyunEmbeddings;
    
    // 延迟初始化智能对话处理器，避免循环依赖
    this.smartDialogueProcessor = null;
    this.smartDialogueProcessorPromise = null;
  }
  
  /**
   * 获取智能对话处理器（延迟初始化）
   * @returns {Promise<SmartDialogueProcessor>} - 智能对话处理器实例
   */
  async getSmartDialogueProcessor() {
    if (!this.smartDialogueProcessor) {
      if (!this.smartDialogueProcessorPromise) {
        this.smartDialogueProcessorPromise = this.initializeSmartDialogueProcessor();
      }
      this.smartDialogueProcessor = await this.smartDialogueProcessorPromise;
    }
    return this.smartDialogueProcessor;
  }
  
  /**
   * 初始化智能对话处理器
   * @returns {Promise<SmartDialogueProcessor>} - 智能对话处理器实例
   */
  async initializeSmartDialogueProcessor() {
    try {
      const { default: SmartDialogueProcessor } = await import('./smartDialogueProcessor.js');
      return new SmartDialogueProcessor(this);
    } catch (error) {
      console.error('初始化智能对话处理器失败:', error);
      throw error;
    }
  }

  /**
   * 初始化服务
   */
  async initialize() {
    console.log('AI 服务初始化中...');
    // 可以在这里添加初始化逻辑
  }

  /**
   * 执行向量相似性搜索
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   */
  async similaritySearch(query, options = {}) {
    return await this.vectorService.similaritySearch(query, options);
  }

  /**
   * 搜索知识库
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   */
  async searchKnowledge(query, options = {}) {
    return await this.knowledgeBaseService.searchKnowledge(query, options);
  }

  /**
   * 搜索患者记录
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   */
  async searchPatients(query, options = {}) {
    return await this.knowledgeBaseService.searchPatients(query, options);
  }

  /**
   * 加载知识库文档
   * @param {string} knowledgeBaseDir - 知识库目录路径
   */
  async loadKnowledgeBase(knowledgeBaseDir = '../../knowledge_base') {
    return await this.knowledgeBaseService.loadKnowledgeDocuments(knowledgeBaseDir);
  }

  /**
   * 生成文本嵌入
   * @param {string} text - 输入文本
   */
  async generateEmbedding(text) {
    return await this.vectorService.generateEmbedding(text);
  }

  /**
   * 批量生成文本嵌入
   * @param {string[]} texts - 输入文本数组
   */
  async generateEmbeddings(texts) {
    return await this.vectorService.generateEmbeddings(texts);
  }

  /**
   * 存储患者向量数据
   * @param {Object} params - 参数对象
   */
  async storePatientVector(params) {
    return await this.vectorService.storePatientVector(params);
  }

  /**
   * 存储知识文档向量数据
   * @param {Object} params - 参数对象
   */
  async storeKnowledgeVector(params) {
    return await this.vectorService.storeKnowledgeVector(params);
  }

  /**
   * KIMI 聊天对话
   * @param {string} message - 用户消息
   * @param {Array} conversationHistory - 对话历史
   * @param {Object} options - 选项配置
   * @returns {Promise<Object>} - 返回AI响应
   */
  async chatWithKIMI(message, conversationHistory = [], options = {}) {
    return await this.kimiChatService.sendMessage(message, conversationHistory, options);
  }

  /**
   * KIMI 流式聊天对话
   * @param {string} message - 用户消息
   * @param {Array} conversationHistory - 对话历史
   * @param {Function} onChunk - 处理每个响应块的回调函数
   * @param {Object} options - 选项配置
   */
  async streamChatWithKIMI(message, conversationHistory = [], onChunk, options = {}) {
    return await this.kimiChatService.streamMessage(message, conversationHistory, onChunk, options);
  }

  /**
   * 获取KIMI服务状态
   * @returns {Promise<Object>} - 服务状态
   */
  async getKIMIHealthStatus() {
    return await this.kimiChatService.healthCheck();
  }

  /**
   * 获取KIMI可用模型列表
   * @returns {Array} - 可用模型列表
   */
  getKIMIAvailableModels() {
    return this.kimiChatService.getAvailableModels();
  }

  /**
   * 智能对话处理 - 主入口
   * @param {string} message - 用户消息
   * @param {Object} context - 上下文信息
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processSmartDialogue(message, context = {}, options = {}) {
    const processor = await this.getSmartDialogueProcessor();
    return await processor.processMessage(message, context, options);
  }

  /**
   * 分析用户意图
   * @param {string} message - 用户消息
   * @param {Object} options - 选项配置
   * @returns {Promise<Object>} - 意图分析结果
   */
  async analyzeIntent(message, options = {}) {
    const processor = await this.getSmartDialogueProcessor();
    return await processor.intentService.analyzeIntent(message, options);
  }

  /**
   * 获取支持的意图类型
   * @returns {Object} - 支持的意图类型说明
   */
  async getSupportedIntents() {
    const processor = await this.getSmartDialogueProcessor();
    return processor.getSupportedIntents();
  }

  /**
   * 关闭服务
   */
  async close() {
    await this.vectorService.disconnect();
  }
}

// 创建单例实例
const aiService = new AIService();

export default aiService;
export { AIService, VectorService, KnowledgeBaseService };