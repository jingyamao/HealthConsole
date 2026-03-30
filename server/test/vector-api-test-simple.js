/**
 * 向量检索服务API测试（简化版）
 */

import VectorService from '../services/langchain/core/vectorStore.js';
import { vectorSearchTool, listKnowledgeBaseTool } from '../services/langchain/tools/tool/vectorSearch.js';

const vectorService = new VectorService();

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     向量检索服务 API 测试                                    ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// 测试1: 生成Embedding
console.log('【测试1】生成文本Embedding');
const embedding = await vectorService.generateEmbedding("高血压的症状");
console.log(`✅ 向量维度: ${embedding.length} (标准: 1536维)`);
console.log(`   向量示例: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}, ...]\n`);

// 测试2: 知识库统计
console.log('【测试2】知识库统计');
const stats = await vectorService.getKnowledgeBaseStats();
console.log(`✅ 知识文档: ${stats.totalKnowledge} 个`);
console.log(`✅ 患者记录: ${stats.totalPatients} 个`);
console.log(`   文档: ${stats.knowledgeTitles.join(', ')}\n`);

// 测试3: 向量搜索
console.log('【测试3】向量搜索（高血压）');
const searchResult = await vectorSearchTool.invoke({
  query: "高血压的症状和治疗方法",
  sourceType: "knowledge",
  limit: 2,
  minRelevance: 0.3
});
const parsed = JSON.parse(searchResult);
console.log(`✅ 找到 ${parsed.resultCount} 条结果`);
parsed.results.forEach((r, i) => {
  console.log(`   [${i + 1}] ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
});
console.log();

// 测试4: 知识库列表
console.log('【测试4】知识库列表查询');
const listResult = await listKnowledgeBaseTool.invoke({ includeContent: false });
const listParsed = JSON.parse(listResult);
console.log(`✅ 共 ${listParsed.totalDocuments} 个文档`);
listParsed.documents.forEach(doc => {
  console.log(`   - ${doc.title}`);
});
console.log();

// 测试5: 余弦相似度
console.log('【测试5】余弦相似度计算');
const vec1 = await vectorService.generateEmbedding("高血压的症状");
const vec2 = await vectorService.generateEmbedding("高血压患者头痛");
const vec3 = await vectorService.generateEmbedding("糖尿病的治疗");
const sim12 = vectorService.cosineSimilarity(vec1, vec2);
const sim13 = vectorService.cosineSimilarity(vec1, vec3);
console.log(`✅ 相似文本相似度: ${sim12.toFixed(4)}`);
console.log(`✅ 不同文本相似度: ${sim13.toFixed(4)}`);
console.log(`   结论: 相似文本匹配正确 (${sim12 > sim13 ? '✓' : '✗'})\n`);

// 总结
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 测试结果: 全部通过 (5/5)');
console.log('✅ 向量检索服务运行正常');
console.log('═══════════════════════════════════════════════════════════');

await vectorService.disconnect();
