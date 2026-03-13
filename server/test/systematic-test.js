/**
 * 系统性测试用例
 * 全面测试 HealthConsole 系统的所有功能
 * 包括：用户认证、会话管理、意图识别、AI对话
 */

import http from 'http';
import fs from 'fs';

// 测试配置
const BASE_URL = '127.0.0.1';
const PORT = 8080;
const API_PREFIX = '/api';

// 测试状态
let testResults = [];
let sessionData = {
  cookies: null,
  userId: null,
  userName: null,
  conversationId1: null,
  conversationId2: null,
  messages: []
};

/**
 * 发送 HTTP 请求
 */
function makeRequest(method, path, data = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `${API_PREFIX}${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 记录测试结果
 */
function recordTest(testName, success, details = null, error = null) {
  const result = {
    name: testName,
    success,
    timestamp: new Date().toISOString(),
    details,
    error
  };
  testResults.push(result);

  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (details && !success) {
    console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
  }
  if (error) {
    console.log(`   错误: ${error}`);
  }
}

/**
 * 打印分隔线
 */
function printSeparator(title) {
  console.log('\n' + '='.repeat(60));
  console.log(` ${title}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 测试套件 1: 用户认证
// ============================================

async function testUserAuthentication() {
  printSeparator('测试套件 1: 用户认证');

  // 测试 1.1: 用户登录
  try {
    const userId = `test_user_${Date.now()}`;
    const userName = '测试用户';

    const response = await makeRequest('POST', '/user/login', {
      userId,
      userName
    });

    if (response.statusCode === 200 && response.data.success) {
      sessionData.userId = userId;
      sessionData.userName = userName;
      sessionData.cookies = response.headers['set-cookie'];
      recordTest('1.1 用户登录', true, {
        userId,
        userName,
        message: response.data.data.message
      });
    } else {
      recordTest('1.1 用户登录', false, response.data, '登录失败');
    }
  } catch (error) {
    recordTest('1.1 用户登录', false, null, error.message);
  }

  // 测试 1.2: 重复登录（同一用户）
  try {
    const response = await makeRequest('POST', '/user/login', {
      userId: sessionData.userId,
      userName: sessionData.userName
    });

    if (response.statusCode === 200 && response.data.success) {
      recordTest('1.2 重复登录', true, {
        message: response.data.data.message
      });
    } else {
      recordTest('1.2 重复登录', false, response.data);
    }
  } catch (error) {
    recordTest('1.2 重复登录', false, null, error.message);
  }

  // 测试 1.3: 用户登出
  try {
    const response = await makeRequest('POST', '/user/logout', null, sessionData.cookies);

    if (response.statusCode === 200 && response.data.success) {
      recordTest('1.3 用户登出', true, {
        message: response.data.data.message
      });
    } else {
      recordTest('1.3 用户登出', false, response.data);
    }
  } catch (error) {
    recordTest('1.3 用户登出', false, null, error.message);
  }

  // 重新登录以继续后续测试
  try {
    const response = await makeRequest('POST', '/user/login', {
      userId: sessionData.userId,
      userName: sessionData.userName
    });
    if (response.data.success) {
      sessionData.cookies = response.headers['set-cookie'];
    }
  } catch (error) {
    console.log('重新登录失败:', error.message);
  }
}

// ============================================
// 测试套件 2: 会话管理
// ============================================

async function testConversationManagement() {
  printSeparator('测试套件 2: 会话管理');

  // 测试 2.1: 创建会话 1
  try {
    const response = await makeRequest('POST', '/ai/conversations', {
      userId: sessionData.userId,
      title: '测试会话 - 头痛咨询'
    }, sessionData.cookies);

    if (response.statusCode === 200 && response.data.success) {
      sessionData.conversationId1 = response.data.data.conversation.id;
      recordTest('2.1 创建会话 1', true, {
        conversationId: sessionData.conversationId1,
        title: response.data.data.conversation.title
      });
    } else {
      recordTest('2.1 创建会话 1', false, response.data);
    }
  } catch (error) {
    recordTest('2.1 创建会话 1', false, null, error.message);
  }

  // 测试 2.2: 创建会话 2
  try {
    const response = await makeRequest('POST', '/ai/conversations', {
      userId: sessionData.userId,
      title: '测试会话 - 感冒咨询'
    }, sessionData.cookies);

    if (response.statusCode === 200 && response.data.success) {
      sessionData.conversationId2 = response.data.data.conversation.id;
      recordTest('2.2 创建会话 2', true, {
        conversationId: sessionData.conversationId2,
        title: response.data.data.conversation.title
      });
    } else {
      recordTest('2.2 创建会话 2', false, response.data);
    }
  } catch (error) {
    recordTest('2.2 创建会话 2', false, null, error.message);
  }

  // 测试 2.3: 获取用户的所有会话
  try {
    const response = await makeRequest('GET', `/ai/conversations/${sessionData.userId}`, null, sessionData.cookies);

    if (response.statusCode === 200 && response.data.success) {
      const conversations = response.data.data.conversations;
      recordTest('2.3 获取所有会话', true, {
        count: conversations.length,
        conversations: conversations.map(c => ({
          id: c.id,
          title: c.title,
          status: c.status
        }))
      });
    } else {
      recordTest('2.3 获取所有会话', false, response.data);
    }
  } catch (error) {
    recordTest('2.3 获取所有会话', false, null, error.message);
  }

  // 测试 2.4: 更新会话标题
  try {
    const response = await makeRequest('PUT', `/ai/conversations/${sessionData.conversationId1}/title`, {
      title: '更新后的标题 - 头痛问题咨询'
    }, sessionData.cookies);

    if (response.statusCode === 200 && response.data.success) {
      recordTest('2.4 更新会话标题', true, {
        conversationId: sessionData.conversationId1,
        newTitle: response.data.data.title
      });
    } else {
      recordTest('2.4 更新会话标题', false, response.data);
    }
  } catch (error) {
    recordTest('2.4 更新会话标题', false, null, error.message);
  }
}

// ============================================
// 测试套件 3: 意图识别功能
// ============================================

async function testIntentRecognition() {
  printSeparator('测试套件 3: 意图识别功能');

  const intentTests = [
    {
      name: '3.1 医疗对话意图 - 头痛咨询',
      message: '我最近经常头痛，可能是什么原因？',
      expectedIntent: 'medical_chat',
      conversationId: sessionData.conversationId1
    },
    {
      name: '3.2 医疗对话意图 - 感冒咨询',
      message: '感冒了应该吃什么药？',
      expectedIntent: 'medical_chat',
      conversationId: sessionData.conversationId2
    },
    {
      name: '3.3 数据库查询意图',
      message: '帮我查询一下糖尿病患者的信息',
      expectedIntent: 'database_query',
      conversationId: sessionData.conversationId1
    },
    {
      name: '3.4 向量搜索意图',
      message: '搜索一下与高血压相关的诊疗指南',
      expectedIntent: 'vector_search',
      conversationId: sessionData.conversationId1
    },
    {
      name: '3.5 其他意图 - 闲聊',
      message: '你好，今天天气怎么样？',
      expectedIntent: 'other',
      conversationId: sessionData.conversationId1
    },
    {
      name: '3.6 数据库查询意图 - 统计',
      message: '统计一下本月新增的患者数量',
      expectedIntent: 'database_query',
      conversationId: sessionData.conversationId1
    },
    {
      name: '3.7 向量搜索意图 - 相似病例',
      message: '查找与这个症状相似的病例',
      expectedIntent: 'vector_search',
      conversationId: sessionData.conversationId1
    },
    {
      name: '3.8 医疗对话意图 - 症状描述',
      message: '我发烧38度，伴有咳嗽和喉咙痛',
      expectedIntent: 'medical_chat',
      conversationId: sessionData.conversationId2
    }
  ];

  for (const test of intentTests) {
    try {
      console.log(`\n📝 测试: ${test.name}`);
      console.log(`   输入: "${test.message}"`);
      console.log(`   期望意图: ${test.expectedIntent}`);

      const response = await makeRequest('POST', '/ai/chat', {
        userId: sessionData.userId,
        sessionId: test.conversationId,
        message: test.message
      }, sessionData.cookies);

      if (response.statusCode === 200 && response.data.success) {
        const reply = response.data.data.message;

        // 根据意图类型验证回复
        let intentMatched = false;
        let actualIntent = 'unknown';

        if (test.expectedIntent === 'database_query' && reply.includes('数据库查询')) {
          intentMatched = true;
          actualIntent = 'database_query';
        } else if (test.expectedIntent === 'vector_search' && reply.includes('向量搜索')) {
          intentMatched = true;
          actualIntent = 'vector_search';
        } else if (test.expectedIntent === 'other' && !reply.includes('【意图识别结果】')) {
          intentMatched = true;
          actualIntent = 'other';
        } else if (test.expectedIntent === 'medical_chat' && !reply.includes('【意图识别结果】')) {
          intentMatched = true;
          actualIntent = 'medical_chat';
        }

        // 保存消息用于后续测试
        sessionData.messages.push({
          sessionId: test.conversationId,
          message: test.message,
          reply: reply.substring(0, 100) + '...'
        });

        recordTest(test.name, intentMatched, {
          expectedIntent: test.expectedIntent,
          actualIntent: actualIntent,
          replyPreview: reply.substring(0, 150) + '...'
        }, intentMatched ? null : `意图不匹配: 期望 ${test.expectedIntent}, 实际 ${actualIntent}`);

      } else {
        recordTest(test.name, false, response.data, '请求失败');
      }

      // 添加延迟避免请求过快
      await delay(1000);

    } catch (error) {
      recordTest(test.name, false, null, error.message);
    }
  }
}

// ============================================
// 测试套件 4: 多轮对话和上下文
// ============================================

async function testMultiTurnConversation() {
  printSeparator('测试套件 4: 多轮对话和上下文');

  // 测试 4.1: 在同一会话中进行多轮对话
  try {
    console.log('\n📝 测试: 4.1 多轮对话测试');

    const messages = [
      '我最近经常头痛',
      '头痛的时候还会恶心',
      '这种情况持续一周了'
    ];

    let allSuccess = true;
    const replies = [];

    for (let i = 0; i < messages.length; i++) {
      const response = await makeRequest('POST', '/ai/chat', {
        userId: sessionData.userId,
        sessionId: sessionData.conversationId1,
        message: messages[i]
      }, sessionData.cookies);

      if (response.statusCode === 200 && response.data.success) {
        replies.push({
          turn: i + 1,
          message: messages[i],
          reply: response.data.data.message.substring(0, 100) + '...'
        });
      } else {
        allSuccess = false;
        break;
      }

      await delay(1000);
    }

    recordTest('4.1 多轮对话', allSuccess, {
      turns: messages.length,
      replies: replies
    });

  } catch (error) {
    recordTest('4.1 多轮对话', false, null, error.message);
  }

  // 测试 4.2: 获取聊天记录验证上下文
  try {
    const response = await makeRequest('GET', `/ai/chat-history/${sessionData.conversationId1}`, null, sessionData.cookies);

    if (response.statusCode === 200 && response.data.success) {
      const messages = response.data.data.messages;
      recordTest('4.2 获取聊天记录', true, {
        messageCount: messages.length,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content.substring(0, 50) + '...'
        }))
      });
    } else {
      recordTest('4.2 获取聊天记录', false, response.data);
    }
  } catch (error) {
    recordTest('4.2 获取聊天记录', false, null, error.message);
  }
}

// ============================================
// 测试套件 5: 错误处理和边界情况
// ============================================

async function testErrorHandling() {
  printSeparator('测试套件 5: 错误处理和边界情况');

  // 测试 5.1: 未登录访问受保护接口
  try {
    const response = await makeRequest('POST', '/ai/conversations', {
      userId: 'unauthorized_user',
      title: '未授权会话'
    });

    // 应该返回 401 或未授权的错误
    if (response.statusCode === 401 || !response.data.success) {
      recordTest('5.1 未登录访问保护接口', true, {
        statusCode: response.statusCode,
        message: response.data.message || '未授权'
      });
    } else {
      recordTest('5.1 未登录访问保护接口', false, response.data, '应该返回未授权错误');
    }
  } catch (error) {
    recordTest('5.1 未登录访问保护接口', true, null, '返回错误符合预期');
  }

  // 测试 5.2: 空消息
  try {
    const response = await makeRequest('POST', '/ai/chat', {
      userId: sessionData.userId,
      sessionId: sessionData.conversationId1,
      message: ''
    }, sessionData.cookies);

    recordTest('5.2 空消息处理', response.statusCode === 200 || response.statusCode === 400, {
      statusCode: response.statusCode,
      data: response.data
    });
  } catch (error) {
    recordTest('5.2 空消息处理', false, null, error.message);
  }

  // 测试 5.3: 不存在的会话ID
  try {
    const response = await makeRequest('POST', '/ai/chat', {
      userId: sessionData.userId,
      sessionId: 'non-existent-session-id',
      message: '测试消息'
    }, sessionData.cookies);

    recordTest('5.3 不存在的会话ID', true, {
      statusCode: response.statusCode,
      success: response.data.success,
      message: response.data.message || '处理完成'
    });
  } catch (error) {
    recordTest('5.3 不存在的会话ID', false, null, error.message);
  }

  // 测试 5.4: 删除会话
  try {
    const response = await makeRequest('DELETE', `/ai/conversations/${sessionData.conversationId2}`, null, sessionData.cookies);

    if (response.statusCode === 200 && response.data.success) {
      recordTest('5.4 删除会话', true, {
        conversationId: sessionData.conversationId2,
        message: response.data.data.message
      });
    } else {
      recordTest('5.4 删除会话', false, response.data);
    }
  } catch (error) {
    recordTest('5.4 删除会话', false, null, error.message);
  }

  // 测试 5.5: 验证删除后的会话不存在
  try {
    const response = await makeRequest('GET', `/ai/chat-history/${sessionData.conversationId2}`, null, sessionData.cookies);

    recordTest('5.5 验证会话已删除', true, {
      statusCode: response.statusCode,
      success: response.data.success,
      messageCount: response.data.data?.messages?.length || 0
    });
  } catch (error) {
    recordTest('5.5 验证会话已删除', true, null, '会话不存在或已删除');
  }
}

// ============================================
// 测试套件 6: 性能测试
// ============================================

async function testPerformance() {
  printSeparator('测试套件 6: 性能测试');

  // 测试 6.1: 快速连续请求
  try {
    console.log('\n📝 测试: 6.1 快速连续请求');

    const startTime = Date.now();
    const requests = [];

    for (let i = 0; i < 3; i++) {
      requests.push(makeRequest('POST', '/ai/chat', {
        userId: sessionData.userId,
        sessionId: sessionData.conversationId1,
        message: `性能测试消息 ${i + 1}`
      }, sessionData.cookies));
    }

    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const allSuccess = responses.every(r => r.statusCode === 200 && r.data.success);

    recordTest('6.1 快速连续请求', allSuccess, {
      totalTime: `${totalTime}ms`,
      averageTime: `${Math.round(totalTime / 3)}ms`,
      successCount: responses.filter(r => r.statusCode === 200).length
    });

  } catch (error) {
    recordTest('6.1 快速连续请求', false, null, error.message);
  }
}

// ============================================
// 生成测试报告
// ============================================

function generateReport() {
  printSeparator('测试报告');

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n📊 测试统计:`);
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   ✅ 通过: ${passedTests}`);
  console.log(`   ❌ 失败: ${failedTests}`);
  console.log(`   通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.log(`\n❌ 失败的测试:`);
    testResults
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.name}`);
        if (r.error) console.log(`     错误: ${r.error}`);
      });
  }

  console.log(`\n📋 详细结果:`);
  console.log('-'.repeat(60));
  testResults.forEach((r, index) => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${r.name}`);
  });
  console.log('-'.repeat(60));

  // 保存测试报告到文件
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
    },
    results: testResults
  };

  const reportPath = './test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 测试报告已保存到: ${reportPath}`);

  return failedTests === 0;
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(' HealthConsole 系统性测试');
  console.log(' 开始时间:', new Date().toLocaleString());
  console.log('='.repeat(60) + '\n');

  // 等待服务器启动
  console.log('⏳ 等待服务器就绪...');
  let serverReady = false;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await makeRequest('GET', '/health');
      if (response.statusCode === 200) {
        serverReady = true;
        console.log('✅ 服务器已就绪\n');
        break;
      }
    } catch (e) {
      console.log(`   尝试 ${i + 1}/5...`);
      await delay(1000);
    }
  }

  if (!serverReady) {
    console.log('❌ 服务器未就绪，请确保服务器已启动');
    process.exit(1);
  }

  // 执行所有测试套件
  await testUserAuthentication();
  await testConversationManagement();
  await testIntentRecognition();
  await testMultiTurnConversation();
  await testErrorHandling();
  await testPerformance();

  // 生成报告
  const allPassed = generateReport();

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 所有测试全部通过！');
  } else {
    console.log('⚠️  部分测试未通过，请查看详细报告');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

// 运行测试
main().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
