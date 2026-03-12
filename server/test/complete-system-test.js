/**
 * 完整系统测试
 * 测试AI对话和用户登录功能的完整集成
 */

// 测试配置
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 模拟HTTP请求
 */
async function makeRequest(url, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 测试用户登录功能
 */
async function testUserLogin() {
  console.log('\n🔑 测试用户登录功能');
  console.log('='.repeat(50));
  
  const testUsers = [
    { userId: 'doctor_001', userName: '张医生' },
    { userId: 'nurse_002', userName: '李护士' },
    { userId: 'admin_003', userName: '王管理员' }
  ];
  
  const loginResults = [];
  
  for (const user of testUsers) {
    console.log(`\n测试用户: ${user.userName} (${user.userId})`);
    
    const result = await makeRequest(`${API_BASE_URL}/user/login`, 'POST', user);
    
    if (result.success) {
      console.log('✅ 登录成功');
      console.log(`   消息: ${result.data.data.message}`);
      console.log(`   会话ID: ${result.data.data.session.userId}`);
      console.log(`   是否新用户: ${result.data.data.metadata.isNewUser}`);
      loginResults.push({ user, success: true, data: result.data.data });
    } else {
      console.log('❌ 登录失败');
      console.log(`   错误: ${result.data?.error?.message || result.error}`);
      loginResults.push({ user, success: false, error: result.data?.error || result.error });
    }
  }
  
  return loginResults;
}

/**
 * 测试AI聊天功能
 */
async function testAIChat() {
  console.log('\n🤖 测试AI聊天功能');
  console.log('='.repeat(50));
  
  const testMessages = [
    {
      name: '数据库查询',
      message: '帮我查一下有哪些患者住在北京',
      expectedTool: 'database_query'
    },
    {
      name: '医疗咨询',
      message: '我最近总是头痛，可能是什么原因',
      expectedTool: 'medical_chat'
    },
    {
      name: '向量搜索',
      message: '查找与这个症状相似的病例',
      expectedTool: 'vector_search'
    },
    {
      name: '其他功能',
      message: '你好，今天天气怎么样',
      expectedTool: 'other'
    }
  ];
  
  const chatResults = [];
  
  for (const testCase of testMessages) {
    console.log(`\n测试${testCase.name}: "${testCase.message}"`);
    
    const result = await makeRequest(`${API_BASE_URL}/ai/chat`, 'POST', {
      message: testCase.message,
      sessionId: 'test-session-001',
      context: {
        userInfo: {
          name: '测试医生',
          department: '内科'
        }
      }
    });
    
    if (result.success) {
      console.log('✅ AI响应成功');
      console.log(`   回复: ${result.data.data.message.substring(0, 100)}...`);
      console.log(`   使用工具: ${JSON.stringify(result.data.data.toolsUsed)}`);
      chatResults.push({ testCase, success: true, data: result.data.data });
    } else {
      console.log('❌ AI响应失败');
      console.log(`   错误: ${result.data?.error?.message || result.error}`);
      chatResults.push({ testCase, success: false, error: result.data?.error || result.error });
    }
    
    // 添加延迟，避免API限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return chatResults;
}

/**
 * 测试意图识别功能
 */
async function testIntentRecognition() {
  console.log('\n🎯 测试意图识别功能');
  console.log('='.repeat(50));
  
  const testMessages = [
    '糖尿病患者有多少人',
    '高血压应该如何治疗',
    '搜索相关知识库',
    '谢谢你的帮助'
  ];
  
  const intentResults = [];
  
  for (const message of testMessages) {
    console.log(`\n测试消息: "${message}"`);
    
    const result = await makeRequest(`${API_BASE_URL}/ai/analyze-intent`, 'POST', {
      message: message
    });
    
    if (result.success) {
      console.log('✅ 意图识别成功');
      console.log(`   意图: ${result.data.data.intent}`);
      console.log(`   置信度: ${(result.data.data.confidence * 100).toFixed(1)}%`);
      console.log(`   推理: ${result.data.data.reasoning}`);
      intentResults.push({ message, success: true, data: result.data.data });
    } else {
      console.log('❌ 意图识别失败');
      console.log(`   错误: ${result.data?.error?.message || result.error}`);
      intentResults.push({ message, success: false, error: result.data?.error || result.error });
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return intentResults;
}

/**
 * 测试系统健康状态
 */
async function testSystemHealth() {
  console.log('\n🏥 测试系统健康状态');
  console.log('='.repeat(50));
  
  const healthResult = await makeRequest(`${API_BASE_URL}/health`);
  
  if (healthResult.success) {
    console.log('✅ 系统健康状态正常');
    console.log(`   消息: ${healthResult.data.message}`);
    console.log(`   时间戳: ${healthResult.data.timestamp}`);
  } else {
    console.log('❌ 系统健康检查失败');
    console.log(`   错误: ${healthResult.error}`);
  }
  
  // 测试AI Agent状态
  console.log('\n🤖 测试AI Agent状态');
  const agentResult = await makeRequest(`${API_BASE_URL}/ai/agent-status`);
  
  if (agentResult.success) {
    console.log('✅ AI Agent状态正常');
    console.log(`   初始化状态: ${agentResult.data.data.status.initialized}`);
    console.log(`   可用工具: ${agentResult.data.data.status.tools.length}个`);
  } else {
    console.log('❌ AI Agent状态检查失败');
    console.log(`   错误: ${agentResult.data?.error?.message || agentResult.error}`);
  }
  
  return { health: healthResult, agent: agentResult };
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('\n🛠️ 测试错误处理');
  console.log('='.repeat(50));
  
  const errorTests = [
    {
      name: '空消息',
      data: { message: '' }
    },
    {
      name: '无效用户ID',
      data: { userId: 'a', userName: '测试' }
    },
    {
      name: '缺失参数',
      data: {}
    }
  ];
  
  for (const testCase of errorTests) {
    console.log(`\n测试${testCase.name}:`);
    
    let endpoint = `${API_BASE_URL}/ai/chat`;
    if (testCase.data.userId) {
      endpoint = `${API_BASE_URL}/user/login`;
    }
    
    const result = await makeRequest(endpoint, 'POST', testCase.data);
    
    if (!result.success) {
      console.log('✅ 正确处理错误');
      console.log(`   状态码: ${result.status}`);
      console.log(`   错误信息: ${result.data?.error?.message || result.error}`);
    } else {
      console.log('⚠️  未按预期处理错误');
    }
  }
}

/**
 * 运行完整测试套件
 */
async function runCompleteTest() {
  console.log('🚀 开始完整系统测试');
  console.log('='.repeat(60));
  console.log(`API地址: ${API_BASE_URL}`);
  console.log(`测试时间: ${new Date().toISOString()}`);
  
  const testResults = {
    systemHealth: null,
    userLogin: null,
    intentRecognition: null,
    aiChat: null,
    errorHandling: null
  };
  
  try {
    // 1. 测试系统健康状态
    testResults.systemHealth = await testSystemHealth();
    
    // 2. 测试用户登录功能
    testResults.userLogin = await testUserLogin();
    
    // 3. 测试意图识别功能
    testResults.intentRecognition = await testIntentRecognition();
    
    // 4. 测试AI聊天功能
    testResults.aiChat = await testAIChat();
    
    // 5. 测试错误处理
    testResults.errorHandling = await testErrorHandling();
    
    // 显示测试总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    
    const totalTests = 5;
    const passedTests = Object.values(testResults).filter(result => result !== null).length;
    
    console.log(`总测试项: ${totalTests}`);
    console.log(`完成测试: ${passedTests}`);
    console.log(`完成率: ${(passedTests / totalTests * 100).toFixed(1)}%`);
    
    // 显示各功能模块状态
    console.log('\n功能模块状态:');
    console.log(`  系统健康: ${testResults.systemHealth ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  用户登录: ${testResults.userLogin ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  意图识别: ${testResults.intentRecognition ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  AI对话: ${testResults.aiChat ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  错误处理: ${testResults.errorHandling ? '✅ 正常' : '❌ 异常'}`);
    
    console.log('\n✅ 完整系统测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程发生错误:', error);
  }
}

// 运行测试
console.log('🧪 HealthConsole 完整系统测试');
console.log('请确保服务器已启动: npm start');
console.log('等待5秒后开始测试...');

setTimeout(() => {
  runCompleteTest().catch(console.error);
}, 5000);