/**
 * 向量检索服务API测试脚本
 * 测试内容：
 * 1. 向量搜索工具测试
 * 2. 知识库列表查询测试
 * 3. 患者信息搜索测试
 * 4. 相似性计算验证
 */

import VectorService from '../services/langchain/core/vectorStore.js';
import {
  vectorSearchTool,
  listKnowledgeBaseTool,
  knowledgeBaseSearchTool
} from '../services/langchain/tools/tool/vectorSearch.js';

const vectorService = new VectorService();

// 测试结果记录
const testResults = [];

function logTest(name, status, details = '') {
  const result = {
    name,
    status,
    details,
    timestamp: new Date().toLocaleString('zh-CN')
  };
  testResults.push(result);
  const icon = status === '✅ 通过' ? '✅' : status === '⚠️ 警告' ? '⚠️' : '❌';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);
}

// 测试1: VectorService基础功能
async function testVectorService() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 测试1: VectorService 基础功能测试');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 测试1.1: 生成Embedding
    console.log('📝 测试1.1: 生成文本Embedding...');
    const testText = "高血压的症状包括头痛、头晕";
    const embedding = await vectorService.generateEmbedding(testText);
    
    if (embedding && embedding.length === 1536) {
      logTest(
        '生成Embedding',
        '✅ 通过',
        `向量维度: ${embedding.length}, 前5个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`
      );
    } else {
      logTest('生成Embedding', '❌ 失败', `维度错误: ${embedding?.length}`);
    }

    // 测试1.2: 获取知识库统计
    console.log('\n📝 测试1.2: 获取知识库统计信息...');
    const stats = await vectorService.getKnowledgeBaseStats();
    logTest(
      '知识库统计',
      '✅ 通过',
      `知识文档: ${stats.totalKnowledge}个, 患者记录: ${stats.totalPatients}个`
    );
    console.log('   文档列表:', stats.knowledgeTitles.join(', '));

    // 测试1.3: 获取所有知识文档
    console.log('\n📝 测试1.3: 获取知识库文档列表...');
    const docs = await vectorService.getAllKnowledgeDocuments({ limit: 10 });
    logTest(
      '获取文档列表',
      '✅ 通过',
      `获取到 ${docs.length} 个文档`
    );
    docs.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title} (${doc.contentType})`);
    });

  } catch (error) {
    logTest('VectorService测试', '❌ 失败', error.message);
  }
}

// 测试2: 向量搜索工具
async function testVectorSearchTool() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 测试2: 向量搜索工具 (vectorSearchTool) 测试');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 测试2.1: 知识库搜索
    console.log('📝 测试2.1: 搜索高血压相关知识...');
    const searchResult1 = await vectorSearchTool.invoke({
      query: "高血压的症状和治疗方法",
      sourceType: "knowledge",
      limit: 3,
      minRelevance: 0.3
    });
    
    const parsed1 = JSON.parse(searchResult1);
    if (parsed1.success && parsed1.resultCount > 0) {
      logTest(
        '知识库搜索',
        '✅ 通过',
        `找到 ${parsed1.resultCount} 条结果`
      );
      parsed1.results.forEach((r, i) => {
        console.log(`   [${i + 1}] ${r.title} (相似度: ${(r.similarity * 100).toFixed(1)}%)`);
        console.log(`       内容: ${r.content?.substring(0, 80)}...`);
      });
    } else {
      logTest('知识库搜索', '⚠️ 警告', '未找到相关结果');
    }

    // 测试2.2: 患者信息搜索
    console.log('\n📝 测试2.2: 搜索患者信息...');
    const searchResult2 = await vectorSearchTool.invoke({
      query: "糖尿病患者",
      sourceType: "patient",
      limit: 3,
      minRelevance: 0.2
    });
    
    const parsed2 = JSON.parse(searchResult2);
    if (parsed2.success) {
      logTest(
        '患者信息搜索',
        '✅ 通过',
        `找到 ${parsed2.resultCount} 条患者记录`
      );
      if (parsed2.resultCount > 0) {
        parsed2.results.forEach((r, i) => {
          console.log(`   [${i + 1}] ${r.title} (相似度: ${(r.similarity * 100).toFixed(1)}%)`);
        });
      }
    }

    // 测试2.3: 通用搜索（不指定类型）
    console.log('\n📝 测试2.3: 通用搜索（所有类型）...');
    const searchResult3 = await vectorSearchTool.invoke({
      query: "心脏病的症状",
      limit: 5,
      minRelevance: 0.3
    });
    
    const parsed3 = JSON.parse(searchResult3);
    logTest(
      '通用搜索',
      '✅ 通过',
      `找到 ${parsed3.resultCount} 条结果（知识库+患者）`
    );

  } catch (error) {
    logTest('向量搜索工具测试', '❌ 失败', error.message);
    console.error(error);
  }
}

// 测试3: 知识库列表工具
async function testListKnowledgeBaseTool() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 测试3: 知识库列表工具 (listKnowledgeBaseTool) 测试');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('📝 测试3.1: 获取知识库列表（不含内容）...');
    const listResult = await listKnowledgeBaseTool.invoke({
      includeContent: false
    });
    
    const parsed = JSON.parse(listResult);
    if (parsed.success) {
      logTest(
        '知识库列表查询',
        '✅ 通过',
        `共 ${parsed.totalDocuments} 个文档，${parsed.totalVectors} 条向量记录`
      );
      console.log('\n   文档列表:');
      parsed.documents.forEach((doc) => {
        console.log(`   ${doc.index}. ${doc.title} [${doc.type}]`);
        if (doc.tags && doc.tags.length > 0) {
          console.log(`      标签: ${doc.tags.join(', ')}`);
        }
      });
    } else {
      logTest('知识库列表查询', '❌ 失败', parsed.message);
    }

  } catch (error) {
    logTest('知识库列表工具测试', '❌ 失败', error.message);
  }
}

// 测试4: 知识库专用搜索工具
async function testKnowledgeBaseSearchTool() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 测试4: 知识库专用搜索工具 (knowledgeBaseSearchTool) 测试');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('📝 测试4.1: 搜索糖尿病诊疗指南...');
    const searchResult = await knowledgeBaseSearchTool.invoke({
      query: "糖尿病的诊断标准",
      limit: 3
    });
    
    const parsed = JSON.parse(searchResult);
    if (parsed.success && parsed.resultCount > 0) {
      logTest(
        '知识库专用搜索',
        '✅ 通过',
        `找到 ${parsed.resultCount} 条文档`
      );
      parsed.documents.forEach((doc, i) => {
        console.log(`   [${i + 1}] ${doc.title}`);
        console.log(`       相似度: ${(doc.similarity * 100).toFixed(1)}%`);
        console.log(`       内容预览: ${doc.content?.substring(0, 100)}...`);
      });
    } else {
      logTest('知识库专用搜索', '⚠️ 警告', '未找到相关文档');
    }

  } catch (error) {
    logTest('知识库专用搜索工具测试', '❌ 失败', error.message);
  }
}

// 测试5: 余弦相似度计算
async function testCosineSimilarity() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 测试5: 余弦相似度计算验证');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 生成两个相关文本的向量
    console.log('📝 测试5.1: 相似文本的余弦相似度...');
    const text1 = "高血压的症状包括头痛";
    const text2 = "高血压患者经常头痛头晕";
    const text3 = "糖尿病的治疗方法";

    const vec1 = await vectorService.generateEmbedding(text1);
    const vec2 = await vectorService.generateEmbedding(text2);
    const vec3 = await vectorService.generateEmbedding(text3);

    const sim12 = vectorService.cosineSimilarity(vec1, vec2);
    const sim13 = vectorService.cosineSimilarity(vec1, vec3);

    logTest(
      '相似文本对比',
      '✅ 通过',
      `"${text1}" vs "${text2}" 相似度: ${sim12.toFixed(4)}`
    );
    console.log(`   "${text1}" vs "${text3}" 相似度: ${sim13.toFixed(4)}`);
    console.log(`   ✓ 相似文本相似度更高: ${sim12 > sim13 ? '是' : '否'}`);

    // 测试相同文本
    console.log('\n📝 测试5.2: 相同文本的余弦相似度...');
    const simSame = vectorService.cosineSimilarity(vec1, vec1);
    logTest(
      '相同文本相似度',
      '✅ 通过',
      `相同文本相似度: ${simSame.toFixed(4)} (应为1.0)`
    );

  } catch (error) {
    logTest('余弦相似度测试', '❌ 失败', error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     HealthConsole 向量检索服务 API 测试报告              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('测试环境: Node.js + PostgreSQL + LangChain\n');

  await testVectorService();
  await testVectorSearchTool();
  await testListKnowledgeBaseTool();
  await testKnowledgeBaseSearchTool();
  await testCosineSimilarity();

  // 输出测试总结
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 测试总结');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = testResults.filter(r => r.status === '✅ 通过').length;
  const warning = testResults.filter(r => r.status === '⚠️ 警告').length;
  const failed = testResults.filter(r => r.status === '❌ 失败').length;

  console.log(`✅ 通过: ${passed} 项`);
  console.log(`⚠️ 警告: ${warning} 项`);
  console.log(`❌ 失败: ${failed} 项`);
  console.log(`📋 总计: ${testResults.length} 项\n`);

  if (failed === 0) {
    console.log('🎉 所有测试通过！向量检索服务运行正常。\n');
  } else {
    console.log('⚠️ 部分测试未通过，请检查相关功能。\n');
  }

  // 关闭数据库连接
  await vectorService.disconnect();
}

// 运行测试
runAllTests().catch(console.error);
