import aiService from '../services/ai/aiService.js';

/**
 * AI意图识别工具测试
 * 测试各种类型用户消息的意图识别准确性
 */
async function testIntentRecognition() {
  console.log('🎯 开始测试 AI 意图识别工具...\n');
  
  // 测试用例集合
  const testCases = [
    // 数据库查询意图测试
    {
      category: '数据库查询',
      messages: [
        '帮我查一下有哪些患者住在北京',
        '糖尿病患者有多少人',
        '列出所有高血压患者的信息',
        '搜索最近就诊的患者',
        '统计一下本月新增患者数量',
        '找出所有男性患者',
        '查询年龄大于50岁的患者',
        '有哪些患者患有心脏病和高血压'
      ],
      expectedIntent: 'database_query'
    },
    
    // 医疗对话意图测试
    {
      category: '医疗对话',
      messages: [
        '我最近总是头痛，可能是什么原因',
        '糖尿病患者饮食要注意什么',
        '高血压应该如何治疗',
        '感冒吃什么药比较好',
        '我最近感觉疲劳，可能是什么问题',
        '心脏病的早期症状有哪些',
        '如何预防糖尿病',
        '高血压患者可以运动吗'
      ],
      expectedIntent: 'medical_chat'
    },
    
    // 向量搜索意图测试
    {
      category: '向量搜索',
      messages: [
        '查找与这个症状相似的病例',
        '搜索相关的诊疗指南',
        '有没有类似的病例参考',
        '知识库中关于糖尿病的资料',
        '查找相似的心血管疾病案例',
        '搜索高血压的治疗方法',
        '找到相关的医学文献',
        '查看相似的患者病历'
      ],
      expectedIntent: 'vector_search'
    },
    
    // 其他功能意图测试
    {
      category: '其他功能',
      messages: [
        '你好',
        '今天天气怎么样',
        '谢谢',
        '你是谁',
        '你能做什么',
        '再见',
        '早上好',
        '帮我开个灯'
      ],
      expectedIntent: 'other'
    },
    
    // 边界测试（可能难以分类的）
    {
      category: '边界测试',
      messages: [
        '患者和疾病有什么关系',  // 可能混淆数据库查询和医疗对话
        '搜索患者的治疗方法',    // 可能混淆数据库查询和向量搜索
        '糖尿病患者的相似病例',  // 可能混淆医疗对话和向量搜索
        '查看患者的治疗建议',    // 可能混淆多种类型
        '你好，我想查询一些信息', // 问候+查询
        '帮我找一些关于高血压的资料' // 可能混淆向量搜索和数据库查询
      ],
      expectedIntent: 'mixed' // 混合类型，用于测试系统的鲁棒性
    }
  ];

  let totalTests = 0;
  let correctPredictions = 0;
  let categoryResults = {};

  try {
    // 获取支持的意图类型
    console.log('📋 获取支持的意图类型...');
    const supportedIntents = aiService.getSupportedIntents();
    console.log('支持的意图类型:', Object.keys(supportedIntents).map(key => ({
      key,
      name: supportedIntents[key].name,
      description: supportedIntents[key].description
    })));
    console.log('');

    // 逐个测试每个类别
    for (const testCase of testCases) {
      console.log(`\n🧪 测试类别: ${testCase.category}`);
      console.log('=' .repeat(50));
      
      categoryResults[testCase.category] = {
        total: testCase.messages.length,
        correct: 0,
        details: []
      };

      for (let i = 0; i < testCase.messages.length; i++) {
        const message = testCase.messages[i];
        totalTests++;
        
        console.log(`\n${i + 1}. 测试消息: "${message}"`);
        
        try {
          // 分析意图
          const intentResult = await aiService.analyzeIntent(message);
          
          if (intentResult.success) {
            const predictedIntent = intentResult.intent;
            const confidence = intentResult.confidence;
            const reasoning = intentResult.reasoning;
            
            console.log(`   预测意图: ${predictedIntent}`);
            console.log(`   置信度: ${(confidence * 100).toFixed(1)}%`);
            console.log(`   推理: ${reasoning}`);
            
            // 判断预测是否正确
            let isCorrect = false;
            if (testCase.expectedIntent === 'mixed') {
              // 对于混合类型，只要置信度>0.6就算正确
              isCorrect = confidence > 0.6;
            } else {
              isCorrect = predictedIntent === testCase.expectedIntent;
            }
            
            if (isCorrect) {
              correctPredictions++;
              categoryResults[testCase.category].correct++;
              console.log(`   ✅ 正确`);
            } else {
              console.log(`   ❌ 错误 (期望: ${testCase.expectedIntent})`);
            }
            
            categoryResults[testCase.category].details.push({
              message,
              predictedIntent,
              expectedIntent: testCase.expectedIntent,
              confidence,
              reasoning,
              isCorrect
            });
            
          } else {
            console.log(`   ❌ 意图识别失败:`, intentResult.error);
            categoryResults[testCase.category].details.push({
              message,
              error: intentResult.error,
              isCorrect: false
            });
          }
          
        } catch (error) {
          console.log(`   ❌ 测试过程出错:`, error.message);
          categoryResults[testCase.category].details.push({
            message,
            error: error.message,
            isCorrect: false
          });
        }
        
        // 添加小延迟，避免API调用过快
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 显示类别统计
      const categoryAccuracy = (categoryResults[testCase.category].correct / categoryResults[testCase.category].total * 100).toFixed(1);
      console.log(`\n📊 ${testCase.category} 准确率: ${categoryAccuracy}% (${categoryResults[testCase.category].correct}/${categoryResults[testCase.category].total})`);
    }

    // 显示总体统计
    console.log('\n' + '='.repeat(60));
    console.log('📈 总体测试结果统计');
    console.log('='.repeat(60));
    
    console.log(`\n总测试数: ${totalTests}`);
    console.log(`正确预测: ${correctPredictions}`);
    console.log(`总体准确率: ${(correctPredictions / totalTests * 100).toFixed(1)}%`);
    
    console.log('\n各类别详细统计:');
    for (const [category, result] of Object.entries(categoryResults)) {
      const accuracy = (result.correct / result.total * 100).toFixed(1);
      console.log(`  ${category}: ${accuracy}% (${result.correct}/${result.total})`);
    }
    
    // 显示错误案例分析
    console.log('\n🔍 错误案例分析:');
    for (const [category, result] of Object.entries(categoryResults)) {
      const failedCases = result.details.filter(detail => !detail.isCorrect && !detail.error);
      if (failedCases.length > 0) {
        console.log(`\n${category} 中的困难案例:`);
        failedCases.slice(0, 3).forEach((detail, index) => {
          console.log(`  ${index + 1}. "${detail.message}"`);
          console.log(`     预测: ${detail.predictedIntent}, 期望: ${detail.expectedIntent}`);
          console.log(`     推理: ${detail.reasoning}`);
        });
      }
    }
    
    // 性能分析建议
    console.log('\n💡 性能优化建议:');
    console.log('1. 对于准确率较低的类别，可以考虑:');
    console.log('   - 增加更多训练样本');
    console.log('   - 优化提示词模板');
    console.log('   - 调整置信度阈值');
    console.log('2. 对于边界案例，可以考虑增加混合意图类型');
    console.log('3. 可以添加用户反馈机制来持续改进模型');
    
  } catch (error) {
    console.error('❌ 测试过程发生错误:', error);
  }
  
  console.log('\n✅ AI意图识别工具测试完成！');
}

/**
 * 快速测试函数 - 测试单个消息
 * @param {string} message - 要测试的消息
 */
async function quickTest(message) {
  console.log(`\n🚀 快速测试: "${message}"`);
  console.log('-'.repeat(40));
  
  try {
    const result = await aiService.analyzeIntent(message);
    
    if (result.success) {
      console.log(`意图: ${result.intent}`);
      console.log(`置信度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`推理: ${result.reasoning}`);
    } else {
      console.log(`❌ 失败:`, result.error);
    }
  } catch (error) {
    console.log(`❌ 错误:`, error.message);
  }
}

// 运行完整测试
testIntentRecognition().catch(console.error);

// 如果需要快速测试单个消息，可以取消下面的注释
// quickTest("帮我查一下有哪些患者住在北京");