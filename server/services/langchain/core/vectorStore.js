import { PrismaClient } from "../../../generated/prisma/index.js";
import { defaultEmbeddings } from "../core/embeddings.js";

const prisma = new PrismaClient();

/**
 * 向量服务 - 处理嵌入生成和向量存储
 * 适配当前数据库结构，使用 JSON 存储向量数据
 */
class VectorService {
  constructor() {
    this.embeddings = defaultEmbeddings;
  }

  /**
   * 生成文本嵌入
   * @param {string} text - 输入文本
   * @returns {number[]} - 嵌入向量
   */
  async generateEmbedding(text) {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error("生成嵌入时出错:", error);
      throw error;
    }
  }

  /**
   * 批量生成文本嵌入
   * @param {string[]} texts - 输入文本数组
   * @returns {number[][]} - 嵌入向量数组
   */
  async generateEmbeddings(texts) {
    try {
      const embeddings = await this.embeddings.embedDocuments(texts);
      return embeddings;
    } catch (error) {
      console.error("批量生成嵌入时出错:", error);
      throw error;
    }
  }

  /**
   * 存储患者向量数据 
   * @param {Object} params - 参数对象
   * @param {string} params.patientId - 患者ID
   * @param {string} params.content - 内容
   * @param {string} [params.title] - 标题
   * @param {Object} [params.metadata] - 元数据
   * @returns {Object} - 创建的向量记录
   */
  async storePatientVector({ patientId, content, title, metadata = {} }) {
    const vector = await this.generateEmbedding(content);
    
    const vectorRecord = await prisma.vectorStore.create({
      data: {
        sourceType: 'patient',
        sourceId: patientId,
        patientId: patientId,
        title: title || `患者${patientId}的信息`,
        content: content,
        vector: vector, // 直接存储为 JSON 数组，适配数据库的 Json 类型
        contentType: 'patient_record',
        tags: ['患者', '医疗记录'],
        metadata: metadata,
        relevance: 1.0
      }
    });
    
    return vectorRecord;
  }

  /**
   * 存储知识文档向量数据 
   * @param {Object} params - 参数对象
   * @param {string} params.documentId - 知识文档ID（字符串）
   * @param {string} params.content - 内容
   * @param {string} params.title - 标题
   * @param {Object} [params.metadata] - 元数据
   * @returns {Object} - 创建的向量记录
   */
  async storeKnowledgeVector({ documentId, content, title, metadata = {} }) {
    const vector = await this.generateEmbedding(content);
    
    const vectorRecord = await prisma.vectorStore.create({
      data: {
        sourceType: 'knowledge',
        sourceId: documentId.toString(),
        knowledgeDocumentId: null, // 不关联到 KnowledgeDocument 表
        title: title,
        content: content,
        vector: vector, // 直接存储为 JSON 数组，适配数据库的 Json 类型
        contentType: 'knowledge_base',
        tags: metadata.tags || ['知识库', '医学指南'],
        metadata: metadata,
        relevance: 1.0
      }
    });
    
    return vectorRecord;
  }

  /**
   * 向量相似性搜索 (基于当前数据库结构的 JSON 存储)
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   * @param {string} [options.sourceType] - 数据源类型 ('patient', 'knowledge', 'conversation')
   * @param {string} [options.contentType] - 内容类型
   * @param {number} [options.limit=5] - 返回结果数量
   * @param {number} [options.minRelevance=0.3] - 最小相关性阈值
   * @returns {Object[]} - 搜索结果，包含相似度分数
   */
  async similaritySearch(query, options = {}) {
    const { 
      sourceType, 
      contentType, 
      limit = 5, 
      minRelevance = 0.3 
    } = options;
    
    // 生成查询向量
    const queryVector = await this.generateEmbedding(query);
    
    // 构建数据库查询条件
    const whereConditions = {};
    if (sourceType) {
      whereConditions.sourceType = sourceType;
    }
    if (contentType) {
      whereConditions.contentType = contentType;
    }
    
    // 从数据库获取向量数据
    const allVectors = await prisma.vectorStore.findMany({
      where: whereConditions,
      select: {
        id: true,
        sourceType: true,
        sourceId: true,
        patientId: true,
        knowledgeDocumentId: true,
        title: true,
        content: true,
        vector: true, // JSON 格式的向量，适配当前数据库结构
        contentType: true,
        tags: true,
        metadata: true,
        relevance: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // 计算余弦相似度
    const scoredVectors = allVectors.map(record => {
      const similarity = this.cosineSimilarity(queryVector, record.vector);
      return {
        ...record,
        similarity: similarity
      };
    });
    
    // 过滤并排序结果
    const filteredResults = scoredVectors
      .filter(item => item.similarity >= minRelevance)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return filteredResults;
  }

  /**
   * 高效的向量相似性搜索（针对大量数据优化）
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   * @param {string} [options.sourceType] - 数据源类型
   * @param {string} [options.contentType] - 内容类型
   * @param {number} [options.limit=5] - 返回结果数量
   * @param {number} [options.minRelevance=0.3] - 最小相关性阈值
   * @returns {Object[]} - 搜索结果，包含相似度分数
   */
  async similaritySearchOptimized(query, options = {}) {
    const { 
      sourceType, 
      contentType, 
      limit = 5, 
      minRelevance = 0.3 
    } = options;
    
    // 生成查询向量
    const queryVector = await this.generateEmbedding(query);
    
    // 构建数据库查询条件
    const whereConditions = {};
    if (sourceType) {
      whereConditions.sourceType = sourceType;
    }
    if (contentType) {
      whereConditions.contentType = contentType;
    }
    
    // 获取所有匹配的向量记录
    const allVectors = await prisma.vectorStore.findMany({
      where: whereConditions,
      select: {
        id: true,
        sourceType: true,
        sourceId: true,
        patientId: true,
        knowledgeDocumentId: true,
        title: true,
        content: true,
        vector: true, // JSON 格式的向量
        contentType: true,
        tags: true,
        metadata: true,
        relevance: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // 使用更高效的相似度计算方法
    const scoredVectors = allVectors
      .map(record => ({
        ...record,
        similarity: this.cosineSimilarity(queryVector, record.vector)
      }))
      .filter(item => item.similarity >= minRelevance)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return scoredVectors;
  }

  /**
   * 计算两个向量的余弦相似度
   * @param {number[]} vecA - 向量A (从数据库获取的 JSON 格式)
   * @param {number[]} vecB - 向量B (从数据库获取的 JSON 格式)
   * @returns {number} - 余弦相似度 (0-1)
   */
  cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
      throw new Error('向量必须是数组格式');
    }
    
    if (vecA.length !== vecB.length) {
      throw new Error(`向量长度不匹配: ${vecA.length} vs ${vecB.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      if (typeof vecA[i] !== 'number' || typeof vecB[i] !== 'number') {
        throw new Error(`向量元素必须是数字: 位置${i} ${typeof vecA[i]} vs ${typeof vecB[i]}`);
      }
      dotProduct += vecA[i] * vecB[i];
      normA += Math.pow(vecA[i], 2);
      normB += Math.pow(vecB[i], 2);
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 批量存储多个向量数据
   * @param {Array} records - 记录数组
   * @returns {Array} - 创建的向量记录
   */
  async batchStoreVectors(records) {
    const createdRecords = [];
    
    for (const record of records) {
      let storedRecord;
      
      if (record.type === 'patient') {
        storedRecord = await this.storePatientVector({
          patientId: record.patientId,
          content: record.content,
          title: record.title,
          metadata: record.metadata
        });
      } else if (record.type === 'knowledge') {
        storedRecord = await this.storeKnowledgeVector({
          documentId: record.documentId,
          content: record.content,
          title: record.title,
          metadata: record.metadata
        });
      }
      
      createdRecords.push(storedRecord);
    }
    
    return createdRecords;
  }

  /**
   * 更新向量记录
   * @param {number} id - 向量记录ID
   * @param {Object} updates - 更新数据
   * @returns {Object} - 更新的记录
   */
  async updateVector(id, updates) {
    const { content, title, metadata, ...otherUpdates } = updates;
    
    // 如果内容发生变化，重新生成向量
    if (content) {
      const vector = await this.generateEmbedding(content);
      otherUpdates.vector = vector;
    }
    
    if (title) {
      otherUpdates.title = title;
    }
    
    if (metadata) {
      otherUpdates.metadata = metadata;
    }
    
    const updatedRecord = await prisma.vectorStore.update({
      where: { id: id },
      data: otherUpdates
    });
    
    return updatedRecord;
  }

  /**
   * 删除向量记录
   * @param {number} id - 向量记录ID
   * @returns {Object} - 删除的记录
   */
  async deleteVector(id) {
    const deletedRecord = await prisma.vectorStore.delete({
      where: { id: id }
    });
    
    return deletedRecord;
  }

  /**
   * 获取所有知识库文档列表
   * @param {Object} options - 选项
   * @param {number} options.limit - 返回数量限制
   * @returns {Promise<Array>} - 知识库文档列表
   */
  async getAllKnowledgeDocuments(options = {}) {
    const { limit = 100 } = options;
    
    try {
      const documents = await prisma.vectorStore.findMany({
        where: {
          sourceType: 'knowledge'
        },
        select: {
          id: true,
          sourceId: true,
          title: true,
          content: true,
          contentType: true,
          tags: true,
          metadata: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      return documents;
    } catch (error) {
      console.error('❌ 获取知识库文档列表失败:', error);
      return [];
    }
  }

  /**
   * 获取知识库统计信息
   * @returns {Promise<Object>} - 统计信息
   */
  async getKnowledgeBaseStats() {
    try {
      const knowledgeCount = await prisma.vectorStore.count({
        where: { sourceType: 'knowledge' }
      });
      
      const patientCount = await prisma.vectorStore.count({
        where: { sourceType: 'patient' }
      });
      
      // 获取所有知识文档的标题
      const knowledgeDocs = await prisma.vectorStore.findMany({
        where: { sourceType: 'knowledge' },
        select: { title: true },
        distinct: ['title']
      });
      
      return {
        totalKnowledge: knowledgeCount,
        totalPatients: patientCount,
        knowledgeTitles: knowledgeDocs.map(d => d.title).filter(Boolean)
      };
    } catch (error) {
      console.error('❌ 获取知识库统计失败:', error);
      return {
        totalKnowledge: 0,
        totalPatients: 0,
        knowledgeTitles: []
      };
    }
  }

  /**
   * 关闭数据库连接
   */
  async disconnect() {
    await prisma.$disconnect();
  }
}

// 创建默认实例
const vectorService = new VectorService();

// 导出 VectorStore 类
export const VectorStore = VectorService;

// 导出获取实例的函数
export function getVectorStore() {
  return vectorService;
}

export default VectorService;