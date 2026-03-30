import dotenv from "dotenv";
dotenv.config();

import mimoService from '../services/langchain/core/mimoLLM.js';

/**
 * 测试 MIMO 服务是否正常工作
 */
async function testMIMOService() {
  console.log('🧪 开始测试 MIMO 大模型服务...\n');
  
  // 测试 1：健康检查
  console.log('1️⃣ 健康检查');
  const healthStatus = await mimoService.healthCheck();
  console.log(`   状态：${healthStatus.status}`);
  console.log(`   模型：${healthStatus.model}`);
  console.log(`   时间：${healthStatus.timestamp}\n`);
  
  if (healthStatus.status !== 'healthy') {
    console.error('❌ MIMO 服务不健康，请检查 API 密钥和网络连接');
    process.exit(1);
  }
  
  // 测试 2：普通对话（不联网）
  console.log('2️⃣ 测试普通对话（不联网）');
  const normalResponse = await mimoService.send('请用一句话介绍你自己', false);
  if (normalResponse.success) {
    console.log(`   ✅ 响应成功：${normalResponse.data.content.substring(0, 50)}...`);
    console.log(`   模型：${normalResponse.data.model}`);
    console.log(`   Token 使用：${JSON.stringify(normalResponse.data.usage)}\n`);
  } else {
    console.error(`   ❌ 失败：${normalResponse.error.message}\n`);
  }
  
  // 测试 3：联网对话
  console.log('3️⃣ 测试联网对话');
  const webResponse = await mimoService.send('请搜索并介绍 2025 年最新的高血压治疗指南', true, {
    searchConfig: {
      maxKeyword: 3,
      forceSearch: true,
      limit: 3
    }
  });
  if (webResponse.success) {
    console.log(`   ✅ 响应成功：${webResponse.data.content.substring(0, 50)}...`);
    console.log(`   模型：${webResponse.data.model}`);
    if (webResponse.data.toolCalls) {
      console.log(`   工具调用：${webResponse.data.toolCalls.length} 次`);
    }
    console.log(`   Token 使用：${JSON.stringify(webResponse.data.usage)}\n`);
  } else {
    console.error(`   ❌ 失败：${webResponse.error.message}\n`);
  }
  
  // 测试 4：获取可用模型
  console.log('4️⃣ 可用模型列表');
  const models = mimoService.getAvailableModels();
  console.log(`   可用模型：${models.join(', ')}\n`);
  
  console.log('✅ 所有测试完成！MIMO 服务运行正常\n');
}

testMIMOService().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
