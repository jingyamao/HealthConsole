import aiService from '../services/ai/aiService.js';

/**
 * 智能对话处理器测试
 * 测试完整的意图识别和分类处理流程
 */
async function testSmartDialogueProcessor() {
  console.log('🤖 开始测试智能对话处理器...\n');
  
  // 测试用例 - 涵盖所有四种意图类型
  const testCases = [
    {
      name: '数据库查询 - 患者信息',
      message: '帮我查一下有哪些患者住在北京',
      expectedType: 'database_query'
    },
    {
      name: '数据库查询 - 疾病统计',
      message: '糖尿病患者有多少人',
      expectedType: 'database_query'
    },
    {
      name: '医疗对话 - 症状咨询',
      message: '我最近总是头痛，可能是什么原因',
      expectedType: 'medical_chat'
    },
    {
      name: '医疗对话 - 治疗建议',
      message: '糖尿病患者饮食要注意什么',
      expectedType: 'medical_chat'
    },
    {
      name: '向量搜索 - 相似病例',
      message: '查找与这个症状相似的病例',
      expectedType: 'vector_search'
    },
    {
      name: '向量搜索 - 知识库搜索',
      message: '知识库中关于糖尿病的资料',
      expectedType: 'vector_search'
    },
    {
      name: '其他功能 - 问候',
      message: '你好',
      expectedType: 'other'
    },
    {
      name: '其他功能 - 闲聊',
      message: '今天天气怎么样',
      expectedType: 'other'
    }
  ];

  console.log('📋 测试用例总数:', testCases.length);
  console.log('='.repeat(60));

  let successCount = 0;
  let totalCount = testCases.length;

  try {
    // 测试每个用例
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. ${testCase.name}`);
      console.log(`   输入消息: "${testCase.message}"`);
      console.log(`   期望类型: ${testCase.expectedType}`);
      
      try {
        // 使用智能对话处理器处理消息
        const result = await aiService.processSmartDialogue(testCase.message);
        
        if (result.success) {
          console.log(`   识别意图: ${result.intent}`);
          console.log(`   置信度: ${(result.confidence * 100).toFixed(1)}%`);
          console.log(`   处理类型: ${result.type}`);
          console.log(`   响应预览: ${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}`);
          
          // 检查处理结果是否符合期望
          const isExpectedType = result.type === testCase.expectedType;
          if (isExpectedType) {
            successCount++;
            console.log(`   ✅ 成功 - 符合期望类型`);
          } else {
            console.log(`   ❌ 失败 - 期望${testCase.expectedType}，实际${result.type}`);
          }
        } else {
          console.log(`   ❌ 处理失败:`, result.error);
        }
        
      } catch (error) {
        console.log(`   ❌ 处理过程出错:`, error.message);
      }
      
      // 添加延迟，避免API调用过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 显示总体统计
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果统计');
    console.log('='.repeat(60));
    console.log(`总测试数: ${totalCount}`);
    console.log(`成功数: ${successCount}`);
    console.log(`成功率: ${(successCount / totalCount * 100).toFixed(1)}%`);
    
    // 详细分析每个类型的表现
    console.log('\n🔍 各类型处理分析:');
    
    // 重新处理所有测试用例来获取详细统计
    const detailedResults = [];
    for (const testCase of testCases) {
      try {
        const result = await aiService.processSmartDialogue(testCase.message);
        detailedResults.push({
          ...testCase,
          actualResult: result
        });
      } catch (error) {
        detailedResults.push({
          ...testCase,
          actualResult: { success: false, error: error.message }
        });
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 按类型分组统计
    const typeStats = {};
    for (const result of detailedResults) {
      const expectedType = result.expectedType;
      if (!typeStats[expectedType]) {
        typeStats[expectedType] = { total: 0, success: 0, avgConfidence: 0 };
      }
      typeStats[expectedType].total++;
      if (result.actualResult.success && result.actualResult.type === expectedType) {
        typeStats[expectedType].success++;
        typeStats[expectedType].avgConfidence += result.actualResult.confidence;
      }
    }
    
    // 计算平均置信度
    for (const type in typeStats) {
      if (typeStats[type].success > 0) {
        typeStats[type].avgConfidence = typeStats[type].avgConfidence / typeStats[type].success;
      }
    }
    
    // 显示详细统计
    for (const [type, stats] of Object.entries(typeStats)) {
      const accuracy = (stats.success / stats.total * 100).toFixed(1);
      const avgConfidence = (stats.avgConfidence * 100).toFixed(1);
      console.log(`  ${type}:`);
      console.log(`    准确率: ${accuracy}% (${stats.success}/${stats.total})`);
      console.log(`    平均置信度: ${avgConfidence}%`);
    }
    
    // 展示一些实际的响应示例
    console.log('\n💬 响应示例:');
    const examples = detailedResults.filter(r => r.actualResult.success).slice(0, 3);
    
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      console.log(`\n${i + 1}. 输入: "${example.message}"`);
      console.log(`   类型: ${example.actualResult.type}`);
      console.log(`   响应: ${example.actualResult.response}`);
    }
    
    // 性能建议
    console.log('\n💡 性能优化建议:');
    console.log('1. 对于识别准确率较低的类型，可以增加更多训练样本');
    console.log('2. 可以调整意图识别的置信度阈值');
    console.log('3. 考虑添加用户反馈机制来持续改进模型');
    console.log('4. 对于数据库查询和向量搜索，可以优化具体的处理逻辑');
    
  } catch (error) {
    console.error('❌ 测试过程发生错误:', error);
  }
  
  console.log('\n✅ 智能对话处理器测试完成！');
}

/**
 * 交互式测试函数
 * 允许用户输入自定义消息进行测试
 */
async function interactiveTest() {
  console.log('\n🎮 交互式测试模式');
  console.log('请输入您想要测试的消息（输入"exit"退出）:');
  
  // 这里可以添加读取用户输入的逻辑
  // 由于是在Node.js环境中，我们可以使用readline模块
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = () => {
    rl.question('> ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }
      
      console.log('\n🔄 处理中...');
      try {
        const result = await aiService.processSmartDialogue(input);
        
        if (result.success) {
          console.log(`\n🎯 意图识别: ${result.intent} (${(result.confidence * 100).toFixed(1)}%)`);
          console.log(`📝 推理: ${result.reasoning}`);
          console.log(`🔧 处理类型: ${result.type}`);
          console.log(`💬 响应: ${result.response}`);
        } else {
          console.log(`❌ 处理失败:`, result.error);
        }
      } catch (error) {
        console.log(`❌ 错误:`, error.message);
      }
      
      console.log('\n' + '-'.repeat(40));
      askQuestion();
    });
  };
  
  askQuestion();
}

// 运行完整测试
testSmartDialogueProcessor().catch(console.error);

// 如果需要交互式测试，可以取消下面的注释
// interactiveTest();