import aiService from '../services/ai/aiService.js';

/**
 * 智能对话API使用示例
 * 展示如何在前端调用智能对话处理器
 */

/**
 * 处理用户消息的完整流程示例
 * @param {string} userMessage - 用户输入的消息
 * @param {Object} context - 上下文信息
 * @returns {Promise<Object>} - 处理结果
 */
async function handleUserMessage(userMessage, context = {}) {
  try {
    console.log('🚀 开始处理用户消息:', userMessage);
    
    // 调用智能对话处理器
    const result = await aiService.processSmartDialogue(userMessage, context);
    
    if (result.success) {
      console.log('✅ 处理成功!');
      console.log('🎯 识别意图:', result.intent);
      console.log('📊 置信度:', (result.confidence * 100).toFixed(1) + '%');
      console.log('🔧 处理类型:', result.type);
      console.log('💬 回复内容:', result.response);
      
      // 根据不同类型返回不同的前端响应格式
      switch (result.type) {
        case 'database_query':
          return {
            type: 'database_result',
            content: result.response,
            suggestion: result.suggestion,
            intent: result.intent,
            confidence: result.confidence
          };
          
        case 'medical_chat':
          return {
            type: 'medical_advice',
            content: result.response,
            conversationId: result.conversationId,
            usage: result.usage,
            intent: result.intent,
            confidence: result.confidence
          };
          
        case 'vector_search':
          return {
            type: 'search_results',
            content: result.response,
            results: result.results,
            resultCount: result.resultCount,
            intent: result.intent,
            confidence: result.confidence
          };
          
        case 'other':
          return {
            type: 'general_response',
            content: result.response,
            suggestion: result.suggestion,
            intent: result.intent,
            confidence: result.confidence
          };
          
        default:
          return {
            type: 'unknown',
            content: result.response,
            intent: result.intent,
            confidence: result.confidence
          };
      }
    } else {
      console.error('❌ 处理失败:', result.error);
      return {
        type: 'error',
        content: '抱歉，处理您的请求时出现了错误，请稍后再试。',
        error: result.error,
        intent: result.intent
      };
    }
    
  } catch (error) {
    console.error('💥 系统错误:', error);
    return {
      type: 'system_error',
      content: '系统内部错误，请联系技术支持。',
      error: { message: error.message }
    };
  }
}

/**
 * 示例：处理不同类型的用户消息
 */
async function runExamples() {
  console.log('🎯 智能对话处理器使用示例\n');
  console.log('='.repeat(60));
  
  // 示例1: 数据库查询
  console.log('\n📊 示例1: 数据库查询');
  const dbResult = await handleUserMessage('帮我查一下有哪些患者住在北京');
  console.log('结果:', dbResult);
  
  // 示例2: 医疗咨询
  console.log('\n🏥 示例2: 医疗咨询');
  const medicalResult = await handleUserMessage('我最近总是头痛，可能是什么原因');
  console.log('结果:', medicalResult);
  
  // 示例3: 向量搜索
  console.log('\n🔍 示例3: 向量搜索');
  const searchResult = await handleUserMessage('查找与这个症状相似的病例');
  console.log('结果:', searchResult);
  
  // 示例4: 其他功能
  console.log('\n💬 示例4: 其他功能');
  const otherResult = await handleUserMessage('你好');
  console.log('结果:', otherResult);
  
  // 示例5: 带上下文的对话
  console.log('\n🗣️ 示例5: 带上下文的对话');
  const context = {
    conversationHistory: [
      { role: 'user', content: '你好，我想了解一些关于糖尿病的问题' },
      { role: 'assistant', content: '你好！我很乐意帮助你了解糖尿病相关问题。糖尿病是一种常见的代谢性疾病，主要特征是高血糖。你有什么具体的问题想要咨询吗？' }
    ],
    userInfo: {
      name: '张医生',
      department: '内分泌科'
    }
  };
  
  const contextResult = await handleUserMessage('糖尿病患者在饮食上应该注意什么？', context);
  console.log('结果:', contextResult);
}

/**
 * 批量处理多个消息
 * @param {Array} messages - 消息数组
 * @param {Object} context - 上下文信息
 * @returns {Promise<Array>} - 处理结果数组
 */
async function batchProcessMessages(messages, context = {}) {
  console.log(`🔄 批量处理 ${messages.length} 条消息...`);
  
  const results = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\n处理第 ${i + 1} 条消息: "${message}"`);
    
    const result = await handleUserMessage(message, context);
    results.push({
      message,
      result
    });
    
    // 添加延迟，避免API调用过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * 获取系统支持的意图类型
 */
async function getSupportedIntents() {
  try {
    const intents = await aiService.getSupportedIntents();
    console.log('📋 系统支持的意图类型:');
    
    for (const [key, intent] of Object.entries(intents)) {
      console.log(`\n${intent.name} (${key}):`);
      console.log(`  描述: ${intent.description}`);
      console.log(`  示例: ${intent.examples.join(', ')}`);
    }
    
    return intents;
  } catch (error) {
    console.error('获取支持的意图类型失败:', error);
    return null;
  }
}

/**
 * 交互式测试函数
 */
async function interactiveTest() {
  console.log('\n🎮 交互式测试模式');
  console.log('请输入您想要测试的消息（输入"exit"退出）:');
  
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
      const result = await handleUserMessage(input);
      
      console.log('\n📊 处理结果:');
      console.log(`类型: ${result.type}`);
      console.log(`意图: ${result.intent || '未知'}`);
      console.log(`置信度: ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`回复: ${result.content}`);
      
      if (result.suggestion) {
        console.log(`建议: ${result.suggestion}`);
      }
      
      console.log('\n' + '-'.repeat(40));
      askQuestion();
    });
  };
  
  askQuestion();
}

// 运行示例
runExamples().then(async () => {
  // 显示支持的意图类型
  await getSupportedIntents();
  
  console.log('\n✅ 所有示例运行完成！');
  console.log('\n您可以使用以下函数:');
  console.log('- handleUserMessage(message, context) - 处理单个消息');
  console.log('- batchProcessMessages(messages, context) - 批量处理消息');
  console.log('- getSupportedIntents() - 获取支持的意图类型');
  console.log('- interactiveTest() - 交互式测试');
});

export {
  handleUserMessage,
  batchProcessMessages,
  getSupportedIntents,
  interactiveTest
};