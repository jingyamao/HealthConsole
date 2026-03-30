/**
 * 测试向量搜索功能（特别是分段文档的聚合效果）
 */

import { VectorStore } from '../services/langchain/core/vectorStore.js';

async function testVectorSearch() {
  console.log('🧪 开始测试向量搜索功能...\n');
  
  const vectorStore = new VectorStore();
  
  try {
    // 测试 1: 获取知识库统计
    console.log('📊 测试 1: 获取知识库统计信息');
    const stats = await vectorStore.getKnowledgeBaseStats();
    console.log(`   知识文档向量数：${stats.totalKnowledge}`);
    console.log(`   患者数据向量数：${stats.totalPatients}`);
    console.log(`   知识文档标题：${stats.knowledgeTitles.length} 个\n`);
    
    // 测试 2: 获取所有知识文档
    console.log('📋 测试 2: 获取知识文档列表');
    const documents = await vectorStore.getAllKnowledgeDocuments({ limit: 10 });
    console.log(`   找到 ${documents.length} 个文档片段\n`);
    
    // 显示文档分段情况
    const groupedDocs = {};
    documents.forEach(doc => {
      if (!groupedDocs[doc.sourceId]) {
        groupedDocs[doc.sourceId] = {
          title: doc.title,
          chunks: []
        };
      }
      groupedDocs[doc.sourceId].chunks.push({
        part: doc.metadata?.part || 1,
        totalParts: doc.metadata?.totalParts || 1,
        contentLength: doc.content?.length || 0
      });
    });
    
    console.log('📄 文档分段详情:');
    Object.entries(groupedDocs).forEach(([sourceId, doc], index) => {
      if (index < 5) { // 只显示前 5 个文档
        console.log(`   ${index + 1}. ${doc.title.split('(')[0].trim()}`);
        console.log(`      分段数：${doc.chunks.length}`);
        console.log(`      各段长度：${doc.chunks.map(c => c.contentLength).join(', ')} 字符`);
      }
    });
    console.log('');
    
    // 测试 3: 相似度搜索（测试聚合功能）
    console.log('🔍 测试 3: 相似度搜索测试');
    const testQueries = [
      '高血压的治疗方法',
      '糖尿病的诊断标准',
      '冠心病的症状表现'
    ];
    
    for (const query of testQueries) {
      console.log(`\n   查询："${query}"`);
      console.log('   ---');
      
      // 不聚合的搜索结果
      const resultsNoAggregate = await vectorStore.similaritySearch(query, {
        sourceType: 'knowledge',
        limit: 10,
        minRelevance: 0.3,
        aggregate: false
      });
      
      console.log(`   不聚合：找到 ${resultsNoAggregate.length} 个片段`);
      if (resultsNoAggregate.length > 0) {
        console.log(`   前 3 个片段:`);
        resultsNoAggregate.slice(0, 3).forEach((r, i) => {
          console.log(`     ${i + 1}. ${r.title} (相似度：${r.similarity.toFixed(3)})`);
        });
      }
      
      // 聚合的搜索结果
      const resultsAggregated = await vectorStore.similaritySearch(query, {
        sourceType: 'knowledge',
        limit: 5,
        minRelevance: 0.3,
        aggregate: true
      });
      
      console.log(`\n   聚合后：找到 ${resultsAggregated.length} 个文档`);
      if (resultsAggregated.length > 0) {
        console.log(`   前 3 个文档:`);
        resultsAggregated.slice(0, 3).forEach((r, i) => {
          console.log(`     ${i + 1}. ${r.title.split('(')[0].trim()}`);
          console.log(`        片段数：${r.allChunks?.length || 1}`);
          console.log(`        最高相似度：${r.maxSimilarity?.toFixed(3) || r.similarity.toFixed(3)}`);
          console.log(`        平均相似度：${r.avgSimilarity?.toFixed(3) || '-'}`);
        });
      }
      
      console.log('');
    }
    
    // 测试 4: 验证聚合逻辑
    console.log('🔬 测试 4: 验证聚合逻辑正确性');
    const testQuery = '高血压';
    const results = await vectorStore.similaritySearch(testQuery, {
      sourceType: 'knowledge',
      limit: 20,
      minRelevance: 0.2,
      aggregate: true
    });
    
    // 检查是否有文档被正确聚合
    const aggregatedCount = results.filter(r => r.isAggregated && r.allChunks && r.allChunks.length > 1).length;
    const singleCount = results.filter(r => !r.isAggregated || (r.allChunks && r.allChunks.length === 1)).length;
    
    console.log(`   查询："${testQuery}"`);
    console.log(`   总结果数：${results.length}`);
    console.log(`   多片段文档：${aggregatedCount} 个`);
    console.log(`   单片段文档：${singleCount} 个`);
    
    if (aggregatedCount > 0) {
      console.log('\n   ✅ 聚合功能正常工作！示例:');
      const example = results.find(r => r.isAggregated && r.allChunks && r.allChunks.length > 1);
      if (example) {
        console.log(`   文档：${example.title.split('(')[0].trim()}`);
        console.log(`   片段数：${example.allChunks.length}`);
        console.log(`   最高相似度：${example.maxSimilarity.toFixed(3)}`);
        console.log(`   平均相似度：${example.avgSimilarity.toFixed(3)}`);
        console.log(`   各片段相似度：${example.allChunks.map(c => c.similarity.toFixed(3)).join(', ')}`);
      }
    } else {
      console.log('\n   ⚠️ 未找到多片段文档，可能原因:');
      console.log('      1. 知识文档都较短，没有分段');
      console.log('      2. 搜索相关性较低，每个文档只有一个片段匹配');
    }
    
    console.log('\n✅ 所有测试完成！\n');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    await vectorStore.disconnect();
  }
}

// 运行测试
testVectorSearch().catch(console.error);
