import aiService from '../services/ai/aiService.js';

/**
 * KIMI 聊天功能测试
 */
async function testKIMIChat() {
  console.log('🚀 开始测试 KIMI 聊天功能...\n');
  
  try {
    // 1. 测试服务状态
    console.log('📊 检查 KIMI 服务状态...');
    const healthStatus = await aiService.getKIMIHealthStatus();
    console.log('健康状态:', healthStatus);
    console.log('');
    
    // 2. 测试可用模型
    console.log('🤖 获取可用模型列表...');
    const models = aiService.getKIMIAvailableModels();
    console.log('可用模型:', models);
    console.log('');
    
    // 3. 测试基本聊天功能
    console.log('💬 测试基本聊天功能...');
    const testMessage = "你好，我是一个医疗助手测试程序。请简单介绍一下你自己，并告诉我你能提供什么医疗相关的帮助？";
    console.log('用户消息:', testMessage);
    
    const response = await aiService.chatWithKIMI(testMessage);
    
    if (response.success) {
      console.log('🤖 KIMI 回复:', response.data.message);
      console.log('使用信息:', response.data.usage);
      console.log('对话ID:', response.data.conversationId);
    } else {
      console.error('❌ 聊天失败:', response.error);
    }
    console.log('');
    
    // 4. 测试医疗相关对话
    console.log('🏥 测试医疗相关对话...');
    const medicalQuestion = "我最近总是感觉疲劳，可能是什么原因？应该怎么办？";
    console.log('用户消息:', medicalQuestion);
    
    const medicalResponse = await aiService.chatWithKIMI(medicalQuestion);
    
    if (medicalResponse.success) {
      console.log('🤖 KIMI 医疗建议:', medicalResponse.data.message);
    } else {
      console.error('❌ 医疗咨询失败:', medicalResponse.error);
    }
    console.log('');
    
    // 5. 测试带对话历史的聊天
    console.log('🗣️ 测试带对话历史的聊天...');
    const conversationHistory = [
      {
        role: "user",
        content: "你好，我想了解一些关于糖尿病的问题"
      },
      {
        role: "assistant", 
        content: "你好！我很乐意帮助你了解糖尿病相关问题。糖尿病是一种常见的代谢性疾病，主要特征是高血糖。你有什么具体的问题想要咨询吗？"
      }
    ];
    
    const followUpQuestion = "糖尿病患者在饮食上应该注意什么？";
    console.log('用户跟进问题:', followUpQuestion);
    
    const followUpResponse = await aiService.chatWithKIMI(followUpQuestion, conversationHistory);
    
    if (followUpResponse.success) {
      console.log('🤖 KIMI 饮食建议:', followUpResponse.data.message);
    } else {
      console.error('❌ 跟进对话失败:', followUpResponse.error);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
  
  console.log('\n✅ KIMI 聊天功能测试完成！');
}

// 运行测试
testKIMIChat().catch(console.error);