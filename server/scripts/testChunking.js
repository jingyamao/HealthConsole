/**
 * 直接测试文本分段和向量搜索聚合功能
 */

import { VectorStore } from '../services/langchain/core/vectorStore.js';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function testChunkingAndAggregation() {
  console.log('🧪 测试分段和聚合功能\n');
  
  const vectorStore = new VectorStore();
  
  try {
    // 创建一个超长的测试文档（手动分段存储）
    console.log('📝 创建测试文档...');
    
    const testDocId = 'TEST_DOC_001';
    const testDocTitle = '测试文档 - 高血压综合指南';
    
    // 创建一个长文档，包含多个主题段落
    const longContent = `
一、概述

高血压是一种常见的慢性疾病，以体循环动脉血压升高为主要特征。根据中国高血压防治指南，成年人在未使用降压药物的情况下，非同日 3 次测量诊室血压，收缩压≥140mmHg 和/或舒张压≥90mmHg，即可诊断为高血压。高血压是心脑血管疾病的重要危险因素，长期高血压会导致心、脑、肾等靶器官损害，增加脑卒中、冠心病、心力衰竭、肾功能衰竭等疾病的发病风险。

二、病因和发病机制

高血压的病因复杂，涉及遗传因素、环境因素、生活方式等多个方面。约 60% 的高血压患者有家族史，提示遗传因素在高血压发病中起重要作用。环境因素包括高盐饮食、过量饮酒、缺乏运动、精神紧张、肥胖等。此外，年龄增长、性别、种族等也与高血压的发生相关。发病机制主要包括肾素 - 血管紧张素 - 醛固酮系统激活、交感神经系统兴奋性增高、血管内皮功能紊乱、水钠潴留等。

三、临床表现

大多数高血压患者起病隐匿，进展缓慢，早期常无明显症状，部分患者可有头痛、头晕、耳鸣、心悸、失眠等非特异性症状。随着病情进展，可出现靶器官损害的表现，如左心室肥厚、心绞痛、心肌梗死、心力衰竭；脑出血、脑梗死、短暂性脑缺血发作；蛋白尿、血肌酐升高；视网膜病变等。严重者可出现高血压危象，表现为剧烈头痛、恶心呕吐、视力模糊、意识障碍等，需紧急处理。

四、诊断和评估

高血压的诊断主要依据诊室血压测量。诊断标准：收缩压≥140mmHg 和/或舒张压≥90mmHg。根据血压水平，高血压可分为 1 级（140-159/90-99mmHg）、2 级（160-179/100-109mmHg）、3 级（≥180/110mmHg）。除血压测量外，还需进行全面的临床评估，包括病史采集、体格检查、实验室检查和辅助检查，以明确高血压的病因、评估靶器官损害程度、发现合并的危险因素和临床疾患。

五、治疗原则

高血压的治疗目标是最大限度地降低心脑血管并发症的发生和死亡风险。治疗策略包括生活方式干预和药物治疗。生活方式干预是所有高血压患者的基础治疗，包括减少钠盐摄入、合理膳食、控制体重、戒烟限酒、适量运动、心理平衡等。药物治疗应遵循小剂量开始、优先选择长效制剂、联合用药、个体化治疗的原则。常用降压药物包括钙通道阻滞剂、血管紧张素转换酶抑制剂、血管紧张素Ⅱ受体拮抗剂、利尿剂、β受体阻滞剂等。

六、药物治疗方案

根据患者的血压水平、心血管危险分层、合并症等情况，选择合适的药物治疗方案。对于 1 级高血压且低危患者，可先进行生活方式干预，如血压控制不佳再加用药物治疗。对于 2 级及以上高血压、高危和很高危患者，应立即启动药物治疗，通常需要联合用药。单片复方制剂可提高患者的依从性，推荐作为初始治疗的选择之一。对于难治性高血压，需排除假性难治性高血压，优化生活方式干预，合理调整药物组合和剂量。

七、特殊人群的高血压管理

特殊人群包括老年人、儿童青少年、妊娠期妇女、糖尿病患者、慢性肾脏病患者、冠心病患者等。老年高血压患者常表现为收缩压升高为主、脉压增大、血压波动大、易发生体位性低血压等特点，治疗应更加谨慎，降压目标可适当放宽。儿童高血压的诊断标准与成人不同，需参照年龄、性别、身高的血压百分位曲线。妊娠期高血压疾病包括妊娠期高血压、子痫前期、子痫等，需密切监测，适时终止妊娠。合并糖尿病或慢性肾脏病的高血压患者，降压目标更严格，优先选择 ACEI 或 ARB 类药物。

八、随访和管理

高血压是终身性疾病，需要长期随访和管理。建立健康档案，定期测量血压，评估治疗效果和靶器官损害情况。对于血压控制稳定的患者，可每 1-3 个月随访一次；对于血压控制不佳或调整治疗方案的患者，应增加随访频率。加强患者教育，提高治疗依从性，鼓励患者自我监测血压，参与疾病管理。通过规范的高血压管理，可以有效控制血压，降低心脑血管事件的发生风险。
`;

    console.log(`   文档总长度：${longContent.length} 字符`);
    
    // 测试分段功能
    const chunks = vectorStore.splitTextIntoChunks(longContent, 1000);
    console.log(`   分段数量：${chunks.length} 段`);
    chunks.forEach((chunk, i) => {
      console.log(`   第${i + 1}段：${chunk.length} 字符`);
    });
    
    // 清除旧的测试数据
    console.log('\n🗑️  清除旧的测试数据...');
    await prisma.vectorStore.deleteMany({
      where: {
        sourceId: testDocId
      }
    });
    
    // 存储每个片段
    console.log('\n💾 存储向量数据...');
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await prisma.vectorStore.create({
        data: {
          sourceType: 'knowledge',
          sourceId: testDocId,
          title: `${testDocTitle} (第${i + 1}/${chunks.length}部分)`,
          content: chunk,
          vector: await vectorStore.generateEmbedding(chunk),
          contentType: 'knowledge_base',
          tags: ['测试', '高血压'],
          metadata: {
            part: i + 1,
            totalParts: chunks.length,
            originalTitle: testDocTitle,
            isTest: true
          },
          relevance: 1.0
        }
      });
      console.log(`   ✅ 第${i + 1}/${chunks.length}段已存储`);
    }
    
    console.log('\n✅ 测试文档创建完成\n');
    
    // 测试搜索和聚合
    console.log('🔍 测试搜索和聚合功能...\n');
    
    const testQueries = [
      { query: '高血压的诊断标准是什么', expected: '应包含第二段和第四段' },
      { query: '高血压的药物治疗', expected: '应包含第五段和第六段' },
      { query: '高血压的病因', expected: '应包含第二段' }
    ];
    
    for (const { query, expected } of testQueries) {
      console.log(`查询："${query}"`);
      console.log(`预期：${expected}`);
      console.log('---');
      
      // 不聚合
      const resultsNoAgg = await vectorStore.similaritySearch(query, {
        sourceType: 'knowledge',
        limit: 10,
        minRelevance: 0.3,
        aggregate: false
      });
      
      console.log(`不聚合：${resultsNoAgg.length} 个片段`);
      if (resultsNoAgg.length > 0) {
        const top3 = resultsNoAgg.slice(0, 3);
        top3.forEach((r, i) => {
          const partNum = r.metadata?.part || '?';
          console.log(`  ${i + 1}. 第${partNum}段 - 相似度：${r.similarity.toFixed(3)}`);
        });
      }
      
      // 聚合
      const resultsAgg = await vectorStore.similaritySearch(query, {
        sourceType: 'knowledge',
        limit: 5,
        minRelevance: 0.3,
        aggregate: true
      });
      
      console.log(`\n聚合后：${resultsAgg.length} 个文档`);
      if (resultsAgg.length > 0) {
        const topDoc = resultsAgg[0];
        if (topDoc.sourceId === testDocId) {
          console.log(`  ✅ 测试文档排在第一位`);
          console.log(`  片段数：${topDoc.allChunks?.length || 1}`);
          console.log(`  最高相似度：${topDoc.maxSimilarity?.toFixed(3)}`);
          console.log(`  平均相似度：${topDoc.avgSimilarity?.toFixed(3)}`);
          
          if (topDoc.allChunks && topDoc.allChunks.length > 1) {
            console.log(`  各片段相似度：`);
            topDoc.allChunks.forEach((chunk, i) => {
              const partNum = chunk.metadata?.part || '?';
              console.log(`    - 第${partNum}段：${chunk.similarity.toFixed(3)}`);
            });
          }
        } else {
          console.log(`  ⚠️ 测试文档未排在第一位（当前是：${topDoc.title.split('(')[0].trim()}`);
        }
      }
      
      console.log('');
    }
    
    // 验证聚合逻辑
    console.log('🔬 验证聚合逻辑...');
    const allResults = await vectorStore.similaritySearch('高血压', {
      sourceType: 'knowledge',
      limit: 20,
      minRelevance: 0.2,
      aggregate: true
    });
    
    const testDocResult = allResults.find(r => r.sourceId === testDocId);
    if (testDocResult) {
      console.log(`✅ 测试文档被正确检索`);
      console.log(`   片段数：${testDocResult.allChunks?.length || 1}`);
      console.log(`   最高相似度：${testDocResult.maxSimilarity?.toFixed(3)}`);
      console.log(`   平均相似度：${testDocResult.avgSimilarity?.toFixed(3)}`);
      
      if (testDocResult.allChunks && testDocResult.allChunks.length > 1) {
        console.log(`\n✅ 聚合功能正常工作！`);
        console.log(`   成功将同一文档的 ${testDocResult.allChunks.length} 个片段聚合在一起`);
        
        // 验证相似度计算
        const similarities = testDocResult.allChunks.map(c => c.similarity);
        const maxSim = Math.max(...similarities);
        const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        
        console.log(`\n   相似度计算验证:`);
        console.log(`   各片段：${similarities.map(s => s.toFixed(3)).join(', ')}`);
        console.log(`   最高值：${maxSim.toFixed(3)} (记录值：${testDocResult.maxSimilarity.toFixed(3)})`);
        console.log(`   平均值：${avgSim.toFixed(3)} (记录值：${testDocResult.avgSimilarity.toFixed(3)})`);
        
        if (Math.abs(maxSim - testDocResult.maxSimilarity) < 0.001 && 
            Math.abs(avgSim - testDocResult.avgSimilarity) < 0.001) {
          console.log(`   ✅ 相似度计算正确！`);
        } else {
          console.log(`   ❌ 相似度计算有误！`);
        }
      }
    } else {
      console.log(`❌ 测试文档未被检索到`);
    }
    
    console.log('\n✅ 所有测试完成！\n');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    // 清理测试数据
    console.log('🗑️  清理测试数据...');
    await prisma.vectorStore.deleteMany({
      where: {
        metadata: {
          path: ['isTest'],
          equals: true
        }
      }
    });
    console.log('   测试数据已删除\n');
    
    await prisma.$disconnect();
  }
}

testChunkingAndAggregation().catch(console.error);
