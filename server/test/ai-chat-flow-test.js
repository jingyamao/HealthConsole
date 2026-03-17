/**
 * AI Agent 完整功能测试
 * 测试场景：
 * 1. 用户登录/登出
 * 2. 会话管理（创建/获取/更新/删除）
 * 3. 意图识别功能（医疗对话/向量搜索/数据库查询/其他）
 * 4. 多轮对话和上下文保持
 * 5. 向量搜索功能（添加文档/搜索知识库/搜索病例）
 */

// API 基础地址
const BASE_URL = "http://127.0.0.1:8080/api";

// 测试用户数据
const testUser = {
  userId: `agent_test_${Date.now()}`,
  userName: "Agent测试用户"
};

// 存储测试过程中的数据
let sessionData = {
  userId: null,
  sessionId1: null,
  sessionId2: null,
  conversations: [],
  testResults: []
};

/**
 * 辅助函数：发送 HTTP 请求
 */
async function request(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📤 ${method.toUpperCase()} ${url}`);
  if (data) {
    console.log("请求数据:", JSON.stringify(data, null, 2));
  }

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      console.error("❌ 响应失败:");
      console.error("状态码:", response.status);
      console.error("响应数据:", JSON.stringify(result, null, 2));
      throw new Error(`HTTP ${response.status}: ${result.error?.message || 'Unknown error'}`);
    }

    console.log("✅ 响应成功:");
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ 请求失败:");
    console.error("错误信息:", error.message);
    throw error;
  }
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
  sessionData.testResults.push(result);

  const icon = success ? '✅' : '❌';
  console.log(`\n${icon} ${testName}`);
  if (details && !success) {
    console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
  }
  if (error) {
    console.log(`   错误: ${error}`);
  }
  return success;
}

/**
 * 打印分隔线
 */
function printSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log(` ${title}`);
  console.log("=".repeat(60));
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

async function testUserLogin() {
  printSection("测试 1: 用户登录");

  try {
    const result = await request("POST", "/user/login", testUser);

    if (result.success) {
      sessionData.userId = result.data.user.userId;
      return recordTest("1. 用户登录", true, {
        userId: sessionData.userId,
        userName: result.data.user.userName
      });
    }
    return recordTest("1. 用户登录", false, result);
  } catch (error) {
    return recordTest("1. 用户登录", false, null, error.message);
  }
}

async function testUserLogout() {
  printSection("测试 10: 用户登出");

  try {
    const result = await request("POST", "/user/logout");
    return recordTest("10. 用户登出", result.success, result.data);
  } catch (error) {
    return recordTest("10. 用户登出", false, null, error.message);
  }
}

// ============================================
// 测试套件 2: 会话管理
// ============================================

async function testCreateConversation1() {
  printSection("测试 2: 创建会话 1（医疗对话测试）");

  try {
    const result = await request("POST", "/ai/conversations", {
      userId: sessionData.userId,
      title: "医疗对话测试会话"
    });

    if (result.success) {
      sessionData.sessionId1 = result.data.conversation.id;
      return recordTest("2. 创建会话 1", true, {
        sessionId: sessionData.sessionId1,
        title: result.data.conversation.title
      });
    }
    return recordTest("2. 创建会话 1", false, result);
  } catch (error) {
    return recordTest("2. 创建会话 1", false, null, error.message);
  }
}

async function testCreateConversation2() {
  printSection("测试 7: 创建会话 2（向量搜索测试）");

  try {
    const result = await request("POST", "/ai/conversations", {
      userId: sessionData.userId,
      title: "向量搜索测试会话"
    });

    if (result.success) {
      sessionData.sessionId2 = result.data.conversation.id;
      return recordTest("7. 创建会话 2", true, {
        sessionId: sessionData.sessionId2,
        title: result.data.conversation.title
      });
    }
    return recordTest("7. 创建会话 2", false, result);
  } catch (error) {
    return recordTest("7. 创建会话 2", false, null, error.message);
  }
}

async function testGetUserConversations() {
  printSection("测试 8: 获取用户的所有会话");

  try {
    const result = await request("GET", `/ai/conversations/${sessionData.userId}`);

    if (result.success) {
      sessionData.conversations = result.data.conversations;
      return recordTest("8. 获取所有会话", true, {
        count: result.data.count,
        conversations: result.data.conversations.map(c => ({
          id: c.id,
          title: c.title,
          messageCount: c.messageCount
        }))
      });
    }
    return recordTest("8. 获取所有会话", false, result);
  } catch (error) {
    return recordTest("8. 获取所有会话", false, null, error.message);
  }
}

async function testUpdateConversationTitle() {
  printSection("测试 9: 更新会话标题");

  try {
    const result = await request("PUT", `/ai/conversations/${sessionData.sessionId1}/title`, {
      title: "更新后的标题 - 医疗对话测试"
    });

    return recordTest("9. 更新会话标题", result.success, result.data);
  } catch (error) {
    return recordTest("9. 更新会话标题", false, null, error.message);
  }
}

// ============================================
// 测试套件 3: 意图识别功能
// ============================================

async function testIntentMedicalChat() {
  printSection("测试 3: 意图识别 - 医疗对话");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId1,
      message: "你好，我最近经常头痛，可能是什么原因？"
    });

    if (result.success) {
      // 检查是否调用了医疗对话（回复中不应包含【意图识别结果】标记）
      const isMedicalChat = !result.data.message.includes("【意图识别结果】");
      return recordTest("3. 医疗对话意图", isMedicalChat, {
        replyPreview: result.data.message.substring(0, 150) + "...",
        isDirectMedicalResponse: isMedicalChat
      });
    }
    return recordTest("3. 医疗对话意图", false, result);
  } catch (error) {
    return recordTest("3. 医疗对话意图", false, null, error.message);
  }
}

async function testIntentDatabaseQuery() {
  printSection("测试 4: 意图识别 - 数据库查询");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId1,
      message: "帮我查询一下糖尿病患者的信息"
    });

    if (result.success) {
      const message = result.data.message;

      // 检查是否正确识别为数据库查询意图
      const isDatabaseQuery = message.includes("数据库查询");

      // 检查是否包含查询计划信息
      const hasQueryPlan = message.includes("查询计划");

      // 检查是否返回了实际的查询结果（不是失败提示）
      const hasValidResult = !message.includes("查询失败") &&
                             !message.includes("暂未实现") &&
                             (message.includes("患者") ||
                              message.includes("统计") ||
                              message.includes("查询结果"));

      // 检查回复长度（有效的查询回复应该有一定长度）
      const hasContent = message.length > 100;

      const success = isDatabaseQuery && hasQueryPlan && hasValidResult && hasContent;

      return recordTest("4. 数据库查询意图", success, {
        replyPreview: message.substring(0, 200) + "...",
        recognizedAsDatabaseQuery: isDatabaseQuery,
        hasQueryPlan: hasQueryPlan,
        hasValidResult: hasValidResult,
        hasContent: hasContent,
        messageLength: message.length,
        fullResponse: message
      });
    }
    return recordTest("4. 数据库查询意图", false, result);
  } catch (error) {
    return recordTest("4. 数据库查询意图", false, null, error.message);
  }
}

async function testIntentVectorSearch() {
  printSection("测试 5: 意图识别 - 向量搜索");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId1,
      message: "搜索一下与高血压相关的诊疗指南"
    });

    if (result.success) {
      // 检查是否正确识别为向量搜索意图并执行搜索
      const isVectorSearch = result.data.message.includes("向量搜索") ||
                             result.data.message.includes("搜索结果");
      return recordTest("5. 向量搜索意图", isVectorSearch, {
        replyPreview: result.data.message.substring(0, 200) + "...",
        recognizedAsVectorSearch: isVectorSearch
      });
    }
    return recordTest("5. 向量搜索意图", false, result);
  } catch (error) {
    return recordTest("5. 向量搜索意图", false, null, error.message);
  }
}

async function testIntentOther() {
  printSection("测试 6: 意图识别 - 其他（闲聊）");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId1,
      message: "你好，今天天气怎么样？"
    });

    if (result.success) {
      // 检查是否正确处理其他意图（不应显示意图识别标记）
      const isOtherIntent = !result.data.message.includes("【意图识别结果】");
      return recordTest("6. 其他意图（闲聊）", isOtherIntent, {
        replyPreview: result.data.message.substring(0, 150) + "...",
        isGeneralResponse: isOtherIntent
      });
    }
    return recordTest("6. 其他意图（闲聊）", false, result);
  } catch (error) {
    return recordTest("6. 其他意图（闲聊）", false, null, error.message);
  }
}

// ============================================
// 测试套件 4: 向量搜索功能详细测试
// ============================================

async function testVectorSearchKnowledge() {
  printSection("测试 11: 向量搜索 - 知识库搜索");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId2,
      message: "查找关于糖尿病的诊疗知识"
    });

    if (result.success) {
      const hasSearchResults = result.data.message.includes("搜索结果") ||
                               result.data.message.includes("找到") ||
                               result.data.message.includes("未找到");
      return recordTest("11. 知识库向量搜索", hasSearchResults, {
        replyPreview: result.data.message.substring(0, 200) + "...",
        hasSearchResults: hasSearchResults
      });
    }
    return recordTest("11. 知识库向量搜索", false, result);
  } catch (error) {
    return recordTest("11. 知识库向量搜索", false, null, error.message);
  }
}

async function testVectorSearchPatientCase() {
  printSection("测试 12: 向量搜索 - 相似病例搜索");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId2,
      message: "搜索与头痛症状相似的患者病例"
    });

    if (result.success) {
      const hasSearchResults = result.data.message.includes("搜索结果") ||
                               result.data.message.includes("找到") ||
                               result.data.message.includes("未找到");
      return recordTest("12. 相似病例搜索", hasSearchResults, {
        replyPreview: result.data.message.substring(0, 200) + "...",
        hasSearchResults: hasSearchResults
      });
    }
    return recordTest("12. 相似病例搜索", false, result);
  } catch (error) {
    return recordTest("12. 相似病例搜索", false, null, error.message);
  }
}

async function testVectorSearchWithKeywords() {
  printSection("测试 13: 向量搜索 - 关键词搜索");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId2,
      message: "查找高血压治疗方法的相关文档"
    });

    if (result.success) {
      const hasSearchResults = result.data.message.includes("搜索结果") ||
                               result.data.message.includes("找到") ||
                               result.data.message.includes("未找到");
      return recordTest("13. 关键词向量搜索", hasSearchResults, {
        replyPreview: result.data.message.substring(0, 200) + "...",
        hasSearchResults: hasSearchResults
      });
    }
    return recordTest("13. 关键词向量搜索", false, result);
  } catch (error) {
    return recordTest("13. 关键词向量搜索", false, null, error.message);
  }
}

// ============================================
// 测试套件 5: 数据库查询功能详细测试
// ============================================

async function testDatabaseQueryPatientCount() {
  printSection("测试 14: 数据库查询 - 患者数量统计");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId2,
      message: "统计一下医院有多少患者"
    });

    if (result.success) {
      const message = result.data.message;

      // 检查是否识别为数据库查询
      const isDatabaseQuery = message.includes("数据库查询");
      // 检查是否包含查询计划
      const hasQueryPlan = message.includes("查询计划");
      // 检查是否包含统计结果
      const hasStats = message.includes("统计") || message.includes("数量") || message.includes("共") || message.includes("人");
      // 检查是否不是失败消息
      const notFailed = !message.includes("查询失败") && !message.includes("暂未实现");

      const success = isDatabaseQuery && hasQueryPlan && hasStats && notFailed;

      return recordTest("14. 数据库查询-患者数量统计", success, {
        replyPreview: message.substring(0, 200) + "...",
        isDatabaseQuery,
        hasQueryPlan,
        hasStats,
        notFailed,
        fullResponse: message
      });
    }
    return recordTest("14. 数据库查询-患者数量统计", false, result);
  } catch (error) {
    return recordTest("14. 数据库查询-患者数量统计", false, null, error.message);
  }
}

async function testDatabaseQueryPatientList() {
  printSection("测试 15: 数据库查询 - 患者列表查询");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId2,
      message: "列出所有男性患者的信息"
    });

    if (result.success) {
      const message = result.data.message;

      // 检查是否识别为数据库查询
      const isDatabaseQuery = message.includes("数据库查询");
      // 检查是否包含查询计划
      const hasQueryPlan = message.includes("查询计划");
      // 检查是否包含列表结果
      const hasListResult = message.includes("患者") || message.includes("列表") || message.includes("姓名");
      // 检查是否不是失败消息
      const notFailed = !message.includes("查询失败") && !message.includes("暂未实现");

      const success = isDatabaseQuery && hasQueryPlan && hasListResult && notFailed;

      return recordTest("15. 数据库查询-患者列表查询", success, {
        replyPreview: message.substring(0, 200) + "...",
        isDatabaseQuery,
        hasQueryPlan,
        hasListResult,
        notFailed,
        fullResponse: message
      });
    }
    return recordTest("15. 数据库查询-患者列表查询", false, result);
  } catch (error) {
    return recordTest("15. 数据库查询-患者列表查询", false, null, error.message);
  }
}

async function testDatabaseQueryDiseaseStats() {
  printSection("测试 16: 数据库查询 - 疾病统计分析");

  try {
    const result = await request("POST", "/ai/chat", {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId2,
      message: "分析一下各年龄段患者的疾病分布情况"
    });

    if (result.success) {
      const message = result.data.message;

      // 检查是否识别为数据库查询
      const isDatabaseQuery = message.includes("数据库查询");
      // 检查是否包含查询计划
      const hasQueryPlan = message.includes("查询计划");
      // 检查是否包含统计分析
      const hasAnalysis = message.includes("分析") || message.includes("分布") || message.includes("统计");
      // 检查是否不是失败消息
      const notFailed = !message.includes("查询失败") && !message.includes("暂未实现");

      const success = isDatabaseQuery && hasQueryPlan && hasAnalysis && notFailed;

      return recordTest("16. 数据库查询-疾病统计分析", success, {
        replyPreview: message.substring(0, 200) + "...",
        isDatabaseQuery,
        hasQueryPlan,
        hasAnalysis,
        notFailed,
        fullResponse: message
      });
    }
    return recordTest("16. 数据库查询-疾病统计分析", false, result);
  } catch (error) {
    return recordTest("16. 数据库查询-疾病统计分析", false, null, error.message);
  }
}

// ============================================
// 测试套件 6: 多轮对话测试
// ============================================

async function testMultiTurnConversation() {
  printSection("测试 17: 多轮对话测试");

  try {
    const messages = [
      "我最近经常头痛",
      "头痛的时候还会恶心",
      "这种情况持续一周了，应该怎么办？"
    ];

    let allSuccess = true;
    const replies = [];

    for (let i = 0; i < messages.length; i++) {
      console.log(`\n  第 ${i + 1} 轮对话: "${messages[i]}"`);

      const result = await request("POST", "/ai/chat", {
        userId: sessionData.userId,
        sessionId: sessionData.sessionId1,
        message: messages[i]
      });

      if (result.success) {
        replies.push({
          turn: i + 1,
          message: messages[i],
          reply: result.data.message.substring(0, 100) + "..."
        });
      } else {
        allSuccess = false;
        break;
      }

      await delay(1000);
    }

    return recordTest("17. 多轮对话", allSuccess, {
      turns: messages.length,
      replies: replies
    });
  } catch (error) {
    return recordTest("17. 多轮对话", false, null, error.message);
  }
}

async function testChatHistory() {
  printSection("测试 18: 查看聊天记录");

  try {
    const result = await request("GET", `/ai/chat-history/${sessionData.sessionId1}`);

    if (result.success) {
      return recordTest("18. 查看聊天记录", true, {
        messageCount: result.data.count,
        messages: result.data.messages.map(m => ({
          role: m.role,
          content: m.content.substring(0, 80) + "..."
        }))
      });
    }
    return recordTest("18. 查看聊天记录", false, result);
  } catch (error) {
    return recordTest("18. 查看聊天记录", false, null, error.message);
  }
}

// ============================================
// 测试套件 7: 删除会话
// ============================================

async function testDeleteConversation() {
  printSection("测试 19: 删除会话");

  try {
    const result = await request("DELETE", `/ai/conversations/${sessionData.sessionId2}`);
    return recordTest("19. 删除会话", result.success, result.data);
  } catch (error) {
    return recordTest("19. 删除会话", false, null, error.message);
  }
}

// ============================================
// 主测试流程
// ============================================

async function runFullTest() {
  console.log("\n" + "🧪".repeat(30));
  console.log(" AI Agent 完整功能测试");
  console.log("🧪".repeat(30));
  console.log(`\n测试用户: ${testUser.userName} (${testUser.userId})`);
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log("\n测试内容:");
  console.log("  1. 用户认证（登录/登出）");
  console.log("  2. 会话管理（创建/获取/更新/删除）");
  console.log("  3. 意图识别（医疗对话/向量搜索/数据库查询/其他）");
  console.log("  4. 数据库查询功能详细测试（统计/列表/分析）");
  console.log("  5. 向量搜索功能（知识库/病例/关键词）");
  console.log("  6. 多轮对话和上下文保持");
  console.log("  7. 聊天记录查看");

  // 定义测试步骤
  const testSteps = [
    // 基础功能
    testUserLogin,
    testCreateConversation1,

    // 意图识别测试
    testIntentMedicalChat,
    testIntentDatabaseQuery,  // 基础数据库查询意图识别
    testIntentVectorSearch,
    testIntentOther,

    // 会话管理
    testCreateConversation2,
    testGetUserConversations,
    testUpdateConversationTitle,

    // 向量搜索详细测试
    testVectorSearchKnowledge,
    testVectorSearchPatientCase,
    testVectorSearchWithKeywords,

    // 数据库查询功能详细测试（重点）
    testDatabaseQueryPatientCount,
    testDatabaseQueryPatientList,
    testDatabaseQueryDiseaseStats,

    // 多轮对话
    testMultiTurnConversation,
    testChatHistory,

    // 清理
    testDeleteConversation,
    testUserLogout
  ];

  // 执行所有测试
  for (const testFn of testSteps) {
    try {
      await testFn();
    } catch (error) {
      console.error(`\n❌ 测试执行失败: ${testFn.name}`);
      console.error(error.message);
    }
    await delay(500); // 测试间隔
  }

  // 生成测试报告
  printSection("测试报告");

  const totalTests = sessionData.testResults.length;
  const passedTests = sessionData.testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log("\n📊 测试统计:");
  console.log(`   总测试数: ${totalTests}`);
  console.log(`   ✅ 通过: ${passedTests}`);
  console.log(`   ❌ 失败: ${failedTests}`);
  console.log(`   通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.log("\n❌ 失败的测试:");
    sessionData.testResults
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.name}`);
        if (r.error) console.log(`     错误: ${r.error}`);
      });
  }

  console.log("\n📋 详细结果:");
  console.log("-".repeat(60));
  sessionData.testResults.forEach((r, index) => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${r.name}`);
  });
  console.log("-".repeat(60));

  // 保存测试报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
    },
    results: sessionData.testResults
  };

  const fs = await import('fs');
  fs.writeFileSync('./agent-test-report.json', JSON.stringify(report, null, 2));
  console.log("\n📄 测试报告已保存到: ./agent-test-report.json");

  console.log("\n" + "=".repeat(60));
  if (failedTests === 0) {
    console.log("🎉 所有测试全部通过！");
  } else {
    console.log(`⚠️  ${failedTests} 个测试未通过，请查看详细报告`);
  }
  console.log("=".repeat(60) + "\n");

  process.exit(failedTests === 0 ? 0 : 1);
}

// 运行测试
runFullTest().catch(error => {
  console.error("\n❌ 测试执行失败:", error.message);
  process.exit(1);
});
