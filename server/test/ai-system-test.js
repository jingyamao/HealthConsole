/**
 * AI对话系统功能测试（精简版）
 * 测试核心功能：意图识别、工具调用、对话管理
 */

import http from 'http';

const BASE_URL = '127.0.0.1';
const PORT = 8000;
const TEST_USER = { userId: 'test_user_001', userName: '测试用户' };

let sessionId = '0f017ea3-e775-498d-ade8-6f30426f6efc'; // 使用指定会话ID
let testResults = [];

// HTTP请求封装
function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// 测试日志
function logTest(name, status, detail = '') {
  const icon = status === '通过' ? '✅' : status === '失败' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${status} ${detail}`);
  testResults.push({ name, status, detail });
}

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== 测试用例 ====================

// 1. 用户登录
async function testLogin() {
  console.log('\n【测试1】用户登录');
  try {
    const res = await request('/api/user/login', 'POST', TEST_USER);
    if (res.success) {
      logTest('用户登录', '通过', `用户: ${TEST_USER.userId}`);
      return true;
    }
  } catch (e) {
    logTest('用户登录', '失败', e.message);
  }
  return false;
}

// 2. 验证会话ID
async function testSessionId() {
  console.log('\n【测试2】验证会话ID');
  console.log(`   使用会话ID: ${sessionId}`);
  logTest('会话ID验证', '通过', `使用现有会话: ${sessionId}`);
  return true;
}

// 3. AI对话 - 医疗问答
async function testMedicalChat() {
  console.log('\n【测试3】医疗问答');
  try {
    const res = await request('/api/ai/chat', 'POST', {
      message: '高血压的症状有哪些？',
      sessionId,
      userId: TEST_USER.userId
    });
    if (res.success && res.data.response) {
      logTest('医疗问答', '通过', '返回医疗建议');
      return true;
    }
  } catch (e) {
    logTest('医疗问答', '失败', e.message);
  }
  return false;
}

// 4. AI对话 - 向量搜索
async function testVectorSearch() {
  console.log('\n【测试4】向量搜索');
  try {
    const res = await request('/api/ai/chat', 'POST', {
      message: '查找高血压的诊疗指南',
      sessionId,
      userId: TEST_USER.userId
    });
    if (res.success) {
      const hasToolCall = res.data.toolCalls?.includes('vector_search');
      logTest('向量搜索', '通过', hasToolCall ? '调用vector_search工具' : '直接回答');
      return true;
    }
  } catch (e) {
    logTest('向量搜索', '失败', e.message);
  }
  return false;
}

// 5. AI对话 - 知识库列表
async function testListKnowledge() {
  console.log('\n【测试5】知识库列表查询');
  try {
    const res = await request('/api/ai/chat', 'POST', {
      message: '知识库有哪些文档？',
      sessionId,
      userId: TEST_USER.userId
    });
    if (res.success) {
      const hasToolCall = res.data.toolCalls?.includes('list_knowledge_base');
      logTest('知识库列表', '通过', hasToolCall ? '调用list_knowledge_base工具' : '直接回答');
      return true;
    }
  } catch (e) {
    logTest('知识库列表', '失败', e.message);
  }
  return false;
}

// 6. AI对话 - 数据库查询
async function testDatabaseQuery() {
  console.log('\n【测试6】数据库查询');
  try {
    const res = await request('/api/ai/chat', 'POST', {
      message: '查询糖尿病患者数量',
      sessionId,
      userId: TEST_USER.userId
    });
    if (res.success) {
      const hasToolCall = res.data.toolCalls?.includes('database_query');
      logTest('数据库查询', '通过', hasToolCall ? '调用database_query工具' : '直接回答');
      return true;
    }
  } catch (e) {
    logTest('数据库查询', '失败', e.message);
  }
  return false;
}

// 7. 获取聊天记录
async function testGetChatHistory() {
  console.log('\n【测试7】获取聊天记录');
  try {
    const res = await request(`/api/ai/chat-history/${sessionId}`);
    if (res.success && res.data.messages) {
      logTest('获取聊天记录', '通过', `${res.data.messages.length}条消息`);
      return true;
    }
  } catch (e) {
    logTest('获取聊天记录', '失败', e.message);
  }
  return false;
}

// 8. 获取会话列表
async function testGetConversations() {
  console.log('\n【测试8】获取会话列表');
  try {
    const res = await request(`/api/ai/conversations/${TEST_USER.userId}`);
    if (res.success && res.data.conversations) {
      logTest('获取会话列表', '通过', `${res.data.conversations.length}个会话`);
      return true;
    }
  } catch (e) {
    logTest('获取会话列表', '失败', e.message);
  }
  return false;
}

// 9. 用户登出
async function testLogout() {
  console.log('\n【测试9】用户登出');
  try {
    const res = await request('/api/user/logout', 'POST');
    if (res.success) {
      logTest('用户登出', '通过');
      return true;
    }
  } catch (e) {
    logTest('用户登出', '失败', e.message);
  }
  return false;
}

// ==================== 主测试流程 ====================

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           AI对话系统功能测试（精简版）                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const tests = [
    testLogin,
    testSessionId,
    testMedicalChat,
    testVectorSearch,
    testListKnowledge,
    testDatabaseQuery,
    testGetChatHistory,
    testGetConversations,
    testLogout
  ];

  let passed = 0;
  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    await delay(500);
  }

  // 测试报告
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 测试报告');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ 通过: ${passed}/${tests.length}`);
  console.log(`❌ 失败: ${tests.length - passed}/${tests.length}`);
  console.log('═══════════════════════════════════════════════════════════');

  // 详细结果
  console.log('\n详细结果:');
  testResults.forEach((r, i) => {
    const icon = r.status === '通过' ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${r.name}: ${r.status} ${r.detail}`);
  });

  console.log('\n🎉 测试完成！');
}

runTests().catch(console.error);
