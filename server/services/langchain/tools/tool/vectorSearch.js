import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import VectorService from "../../core/vectorStore.js";

/**
 * 向量搜索工具
 * 用于搜索医疗知识库、查找相似病例、检索诊疗指南
 */

// 创建 VectorService 实例
const vectorService = new VectorService();

/**
 * 格式化搜索结果
 * @param {Array} results - 搜索结果
 * @returns {string} - 格式化后的字符串
 */
function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return "未找到相关内容";
  }

  return results.map((result, index) => {
    const sourceTypeMap = {
      'patient': '👤 患者记录',
      'knowledge': '📚 知识文档',
      'conversation': '💬 对话记录'
    };
    const sourceLabel = sourceTypeMap[result.sourceType] || '📄 其他';

    return `${index + 1}. ${sourceLabel} - ${result.title || '无标题'}
   相似度: ${(result.similarity * 100).toFixed(1)}%
   内容: ${result.content ? result.content.substring(0, 200) + '...' : '无内容'}
   来源ID: ${result.sourceId || 'N/A'}`;
  }).join('\n\n');
}

/**
 * 向量搜索工具 - 通用搜索
 * 用于搜索医疗知识库、查找相似病例、检索诊疗指南
 */
export const vectorSearchTool = new DynamicStructuredTool({
  name: "vector_search",
  description: `用于搜索医疗知识库、查找相似病例、检索诊疗指南、搜索相关医疗文档。
支持搜索类型：
- 患者记录：查找相似症状的患者病例
- 知识文档：搜索医学指南、诊疗规范
- 对话记录：查找历史对话中的相关信息

参数说明：
- query: 搜索查询文本（必填）
- sourceType: 数据源类型筛选（可选：patient/knowledge/conversation）
- limit: 返回结果数量（默认5条，最大10条）
- minRelevance: 最小相似度阈值（默认0.3，范围0-1）`,
  schema: z.object({
    query: z.string().describe("搜索查询文本，描述你要查找的医疗信息"),
    sourceType: z.enum(["patient", "knowledge", "conversation"]).optional().describe("数据源类型筛选：patient(患者记录)/knowledge(知识文档)/conversation(对话记录)"),
    limit: z.number().min(1).max(10).default(5).describe("返回结果数量，默认5条，最大10条"),
    minRelevance: z.number().min(0).max(1).default(0.3).describe("最小相似度阈值，默认0.3，范围0-1")
  }),
  func: async ({ query, sourceType, limit = 5, minRelevance = 0.3 }) => {
    try {
      console.log("🔍 执行向量搜索:", { query, sourceType, limit, minRelevance });

      const results = await vectorService.similaritySearch(query, {
        sourceType,
        limit,
        minRelevance
      });

      console.log(`✅ 向量搜索完成，找到 ${results.length} 条结果`);

      if (results.length === 0) {
        return JSON.stringify({
          success: true,
          query,
          resultCount: 0,
          message: `在知识库中没有找到与"${query}"相关的内容。建议尝试其他关键词或降低相似度阈值。`,
          results: []
        });
      }

      const formattedResults = results.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content ? result.content.substring(0, 300) : '',
        similarity: result.similarity,
        sourceType: result.sourceType,
        sourceId: result.sourceId,
        contentType: result.contentType,
        tags: result.tags,
        createdAt: result.createdAt
      }));

      return JSON.stringify({
        success: true,
        query,
        resultCount: results.length,
        message: `找到 ${results.length} 条相关内容`,
        formattedResults: formatSearchResults(results),
        results: formattedResults
      });

    } catch (error) {
      console.error("❌ 向量搜索失败:", error);
      return JSON.stringify({
        success: false,
        query,
        error: error.message,
        message: `向量搜索失败: ${error.message}`
      });
    }
  }
});

/**
 * 患者病例搜索工具
 * 专门用于搜索相似的患者病例
 */
export const patientCaseSearchTool = new DynamicStructuredTool({
  name: "patient_case_search",
  description: `专门用于搜索相似的患者病例，根据症状、诊断等信息查找历史病例。
适用于：查找相似症状的患者、参考历史诊疗方案、病例对比分析`,
  schema: z.object({
    symptoms: z.string().describe("患者症状描述"),
    diagnosis: z.string().optional().describe("已知诊断信息（可选）"),
    limit: z.number().min(1).max(10).default(5).describe("返回结果数量，默认5条")
  }),
  func: async ({ symptoms, diagnosis, limit = 5 }) => {
    try {
      console.log("👤 搜索相似病例:", { symptoms, diagnosis });

      // 构建搜索查询
      let query = symptoms;
      if (diagnosis) {
        query += ` ${diagnosis}`;
      }

      const results = await vectorService.similaritySearch(query, {
        sourceType: 'patient',
        limit,
        minRelevance: 0.3
      });

      console.log(`✅ 病例搜索完成，找到 ${results.length} 条相似病例`);

      if (results.length === 0) {
        return JSON.stringify({
          success: true,
          query,
          resultCount: 0,
          message: "未找到相似的患者病例记录",
          cases: []
        });
      }

      const cases = results.map(result => ({
        patientId: result.patientId || result.sourceId,
        title: result.title,
        content: result.content ? result.content.substring(0, 300) : '',
        similarity: result.similarity,
        tags: result.tags,
        createdAt: result.createdAt
      }));

      return JSON.stringify({
        success: true,
        query,
        resultCount: results.length,
        message: `找到 ${results.length} 条相似病例`,
        cases: cases
      });

    } catch (error) {
      console.error("❌ 病例搜索失败:", error);
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * 知识库搜索工具
 * 专门用于搜索医学知识库、诊疗指南
 */
export const knowledgeBaseSearchTool = new DynamicStructuredTool({
  name: "knowledge_base_search",
  description: `专门用于搜索医学知识库、诊疗指南、医疗规范等文档。
适用于：查找诊疗指南、查询医学知识、获取治疗建议参考`,
  schema: z.object({
    query: z.string().describe("搜索关键词或问题"),
    contentType: z.string().optional().describe("内容类型筛选（可选）"),
    limit: z.number().min(1).max(10).default(5).describe("返回结果数量，默认5条")
  }),
  func: async ({ query, contentType, limit = 5 }) => {
    try {
      console.log("📚 搜索知识库:", { query, contentType });

      const options = {
        sourceType: 'knowledge',
        limit,
        minRelevance: 0.3
      };

      if (contentType) {
        options.contentType = contentType;
      }

      const results = await vectorService.similaritySearch(query, options);

      console.log(`✅ 知识库搜索完成，找到 ${results.length} 条结果`);

      if (results.length === 0) {
        return JSON.stringify({
          success: true,
          query,
          resultCount: 0,
          message: "未找到相关的医学知识文档",
          documents: []
        });
      }

      const documents = results.map(result => ({
        documentId: result.knowledgeDocumentId || result.sourceId,
        title: result.title,
        content: result.content ? result.content.substring(0, 400) : '',
        similarity: result.similarity,
        tags: result.tags,
        metadata: result.metadata
      }));

      return JSON.stringify({
        success: true,
        query,
        resultCount: results.length,
        message: `找到 ${results.length} 条相关知识文档`,
        documents: documents
      });

    } catch (error) {
      console.error("❌ 知识库搜索失败:", error);
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * 添加文档到向量库工具
 * 用于向知识库中添加新的文档
 */
export const addDocumentTool = new DynamicStructuredTool({
  name: "add_document_to_vectorstore",
  description: `向向量知识库中添加新的医疗文档、病例记录或知识条目。
添加后的文档可以通过向量搜索被检索到。`,
  schema: z.object({
    type: z.enum(["patient", "knowledge"]).describe("文档类型：patient(患者记录) 或 knowledge(知识文档)"),
    content: z.string().describe("文档内容"),
    title: z.string().describe("文档标题"),
    sourceId: z.string().describe("来源ID（患者ID或文档ID）"),
    metadata: z.string().optional().describe("额外元数据，JSON格式字符串（可选）")
  }),
  func: async ({ type, content, title, sourceId, metadata }) => {
    try {
      console.log("📝 添加文档到向量库:", { type, title, sourceId });

      let result;
      const parsedMetadata = metadata ? JSON.parse(metadata) : {};

      if (type === 'patient') {
        result = await vectorService.storePatientVector({
          patientId: sourceId,
          content,
          title,
          metadata: parsedMetadata
        });
      } else if (type === 'knowledge') {
        result = await vectorService.storeKnowledgeVector({
          documentId: parseInt(sourceId) || sourceId,
          content,
          title,
          metadata: parsedMetadata
        });
      }

      console.log("✅ 文档添加成功:", result.id);

      return JSON.stringify({
        success: true,
        message: "文档添加成功",
        documentId: result.id,
        type,
        title
      });

    } catch (error) {
      console.error("❌ 添加文档失败:", error);
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  }
});

// 导出所有向量搜索相关工具
export const vectorTools = [
  vectorSearchTool,
  patientCaseSearchTool,
  knowledgeBaseSearchTool,
  addDocumentTool
];

export default vectorSearchTool;
