import prisma from '../../../prisma/index.js';
import { defaultEmbeddings } from "../core/embeddings.js";

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
   * 分段处理长文本（按段落分割）
   * @param {string} text - 原始文本
   * @param {number} maxLength - 每段最大长度
   * @returns {string[]} - 分段后的文本数组
   */
  splitTextIntoChunks(text, maxLength = 1500) {
    // 按段落分割
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length <= maxLength) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        // 如果单个段落就超长，需要进一步分割
        if (paragraph.length > maxLength) {
          // 按句子分割
          const sentences = paragraph.split(/[.。!?！？]/);
          let tempChunk = '';
          for (const sentence of sentences) {
            if (tempChunk.length + sentence.length <= maxLength) {
              tempChunk += sentence + '. ';
            } else {
              if (tempChunk) chunks.push(tempChunk.trim());
              tempChunk = sentence + '. ';
            }
          }
          if (tempChunk.trim()) chunks.push(tempChunk.trim());
          currentChunk = '';
        } else {
          currentChunk = paragraph;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * 聚合搜索：将同一文档的多个片段聚合在一起
   * @param {Array} results - 搜索结果数组
   * @returns {Array} - 聚合后的结果
   */
  aggregateResults(results) {
    // 按 sourceId 分组（同一文档的片段有相同的 sourceId）
    const grouped = {};
    
    results.forEach(item => {
      const key = `${item.sourceType}_${item.sourceId}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          allChunks: [item],
          maxSimilarity: item.similarity,
          avgSimilarity: item.similarity,
          isAggregated: true
        };
      } else {
        grouped[key].allChunks.push(item);
        // 更新最大相似度
        grouped[key].maxSimilarity = Math.max(grouped[key].maxSimilarity, item.similarity);
        // 计算平均相似度
        const totalSim = grouped[key].allChunks.reduce((sum, chunk) => sum + chunk.similarity, 0);
        grouped[key].avgSimilarity = totalSim / grouped[key].allChunks.length;
      }
    });
    
    // 转换回数组并按最高相似度排序
    return Object.values(grouped)
      .sort((a, b) => b.maxSimilarity - a.maxSimilarity);
  }

  /**
   * 存储知识文档向量（支持长文档分段）
   * @param {Object} params - 参数对象
   * @param {string} params.documentId - 知识文档ID（字符串）
   * @param {string} params.content - 内容
   * @param {string} params.title - 标题
   * @param {Object} [params.metadata] - 元数据
   * @returns {Object[]} - 创建的向量记录数组
   */
  async storeKnowledgeVector({ documentId, content, title, metadata = {} }) {
    // 将长文档分段
    const chunks = this.splitTextIntoChunks(content, 1500);
    console.log(`📄 文档分段：共分为 ${chunks.length} 段`);
    
    const vectorRecords = [];
    
    // 为每一段生成向量并存储
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkTitle = `${title} (第${i + 1}/${chunks.length}部分)`;
      
      try {
        const vector = await this.generateEmbedding(chunk);
        
        const vectorRecord = await prisma.vectorStore.create({
          data: {
            sourceType: 'knowledge',
            sourceId: documentId.toString(),
            knowledgeDocumentId: null,
            title: chunkTitle,
            content: chunk, // 存储分段内容
            vector: vector,
            contentType: 'knowledge_base',
            tags: metadata.tags || ['知识库', '医学指南'],
            metadata: {
              ...metadata,
              part: i + 1,
              totalParts: chunks.length,
              originalTitle: title
            },
            relevance: 1.0
          }
        });
        
        vectorRecords.push(vectorRecord);
        console.log(`   ✅ 第${i + 1}/${chunks.length}段向量化完成`);
      } catch (error) {
        console.error(`   ❌ 第${i + 1}段向量化失败:`, error.message);
      }
    }
    
    return vectorRecords;
  }

  /**
   * 向量相似性搜索（支持文档分段聚合）
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   * @param {string} [options.sourceType] - 数据源类型 ('patient', 'knowledge', 'conversation')
   * @param {string} [options.contentType] - 内容类型
   * @param {number} [options.limit=5] - 返回结果数量
   * @param {number} [options.minRelevance=0.3] - 最小相关性阈值
   * @param {boolean} [options.aggregate=true] - 是否聚合分段文档
   * @returns {Object[]} - 搜索结果，包含相似度分数
   */
  async similaritySearch(query, options = {}) {
    const { 
      sourceType, 
      contentType, 
      limit = 5, 
      minRelevance = 0.3,
      aggregate = true  // 默认启用聚合
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
        vector: true,
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
    
    // 过滤结果
    let filteredResults = scoredVectors
      .filter(item => item.similarity >= minRelevance);
    
    // 如果启用聚合且是知识文档搜索
    if (aggregate && sourceType === 'knowledge') {
      filteredResults = this.aggregateResults(filteredResults);
    }
    
    // 排序并限制数量
    const finalResults = filteredResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return finalResults;
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