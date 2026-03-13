// agent.js - LangChain Agent 框架实现 (v0.2)
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { defaultLLM } from "../core/llm.js";
import {
  medicalChatTool,
  intentRecognitionTool,
  vectorSearchTool,
} from "../tools/index.js";

/**
 * 创建系统提示词模板
 * @returns {string} 系统提示词
 */
function createSystemPrompt() {
  return `你是一位专业的医疗助手AI，具备丰富的医学知识。
    你的职责是回答用户的医疗健康相关问题，提供症状分析、治疗建议。

    重要提醒：
    1. 你的建议仅供参考，不能替代专业医生的诊断
    2. 对于紧急情况或严重症状，必须建议用户立即就医
    3. 不要给出具体的药物剂量建议
    4. 使用通俗易懂的语言解释医学概念

    你可以使用以下工具来帮助用户：
    - intent_recognition: 分析用户消息的意图类型
    - medical_chat: 回答医疗健康相关问题
    - vector_search: 搜索医疗知识库、查找相似病例、检索诊疗指南

    当用户发送消息时，请根据情况选择合适的工具来提供帮助。`;
}

/**
 * 创建Agent执行器
 * @param {Object} options - 配置选项
 * @param {Object} options.llm - 语言模型实例
 * @param {boolean} options.verbose - 是否显示详细日志
 * @param {number} options.maxIterations - 最大迭代次数
 * @returns {Promise<AgentExecutor>} Agent执行器
 */
export async function createAgent(options = {}) {
  const llm = options.llm || defaultLLM;

  // 定义可用的工具
  const tools = [intentRecognitionTool, medicalChatTool, vectorSearchTool];

  // 创建提示模板
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", createSystemPrompt()],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // 创建工具调用Agent（LangChain 0.2 推荐方式）
  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  // 创建Agent执行器
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: options.verbose || false,
    maxIterations: options.maxIterations || 5,
  });

  console.log("✅ Agent 创建成功（使用工具调用模式）");
  return agentExecutor;
}

/**
 * Agent管理器
 * 提供简化的Agent使用接口 - 强制先进行意图识别，再执行相应操作
 */
export class AgentManager {
  constructor() {
    this.llm = defaultLLM;
    this.chatHistory = [];
  }

  /**
   * 初始化Agent
   * @param {Object} options - 配置选项
   */
  async initialize(options = {}) {
    console.log("✅ AgentManager 初始化完成");
  }

  /**
   * 执行对话 - 强制先调用意图识别，再根据结果执行相应操作
   * @param {string} input - 用户输入
   * @returns {Promise<Object>} 执行结果
   */
  async execute(input) {
    try {
      console.log("🤖 Agent 执行:", input);

      // 步骤 1: 强制调用意图识别工具
      console.log("🎯 步骤 1: 调用意图识别工具...");
      const intentResult = await intentRecognitionTool.invoke({
        message: input,
      });
      console.log("🎯 意图识别结果:", intentResult);

      let intent;
      try {
        intent = JSON.parse(intentResult);
      } catch (e) {
        intent = {
          intent: "medical_chat",
          confidence: 0.5,
          reasoning: "解析失败，默认医疗对话",
        };
      }

      // 步骤 2: 根据意图类型决定如何处理
      let output;
      let intermediateSteps = [
        {
          tool: "intent_recognition",
          input: { message: input },
          output: intent,
        },
      ];

      switch (intent.intent) {
        case "medical_chat":
          console.log("🏥 步骤 2: 意图为医疗对话，调用医疗对话工具...");
          const medicalResult = await medicalChatTool.invoke({ query: input });
          output = medicalResult;
          intermediateSteps.push({
            tool: "medical_chat",
            input: { query: input },
            output: medicalResult,
          });
          break;

        case "database_query":
          console.log("🗄️ 步骤 2: 意图为数据库查询");
          output = `【意图识别结果】\n类型: 数据库查询\n置信度: ${intent.confidence}\n理由: ${intent.reasoning}\n\n抱歉，数据库查询功能暂未实现。请尝试询问医疗健康问题，或使用向量搜索功能查找相关知识。`;
          break;

        case "vector_search":
          console.log("🔍 步骤 2: 意图为向量搜索，调用向量搜索工具...");
          try {
            console.log("🔍 正在调用 vectorSearchTool.invoke...");
            const vectorResult = await vectorSearchTool.invoke({
              query: input,
              limit: 5,
              minRelevance: 0.3,
            });
            console.log(
              "🔍 向量搜索工具返回结果:",
              vectorResult.substring(0, 200)
            );

            const parsedResult = JSON.parse(vectorResult);
            console.log("🔍 解析后的结果:", {
              success: parsedResult.success,
              resultCount: parsedResult.resultCount,
            });

            if (parsedResult.success && parsedResult.resultCount > 0) {
              console.log("🤖 步骤 3: 调用医疗对话工具整理搜索结果...");

              // 构建搜索结果摘要
              const searchSummary = parsedResult.results
                .map(
                  (r, i) =>
                    `[${i + 1}] ${r.title} (相似度: ${(
                      r.similarity * 100
                    ).toFixed(1)}%)\n内容: ${r.content}`
                )
                .join("\n\n");

              // 调用医疗对话工具整理搜索结果
              const organizePrompt = `用户问题："${input}"\n\n从知识库中搜索到以下内容：\n\n${searchSummary}\n\n请基于以上搜索结果，为用户提供一个专业、准确、易懂的医疗知识回答。要求：\n1. 整合搜索结果中的关键信息\n2. 使用通俗易懂的语言解释\n3. 提供实用的建议或指导\n4. 提醒用户这些信息仅供参考，不能替代专业医生诊断\n5. 如果症状严重或持续，建议及时就医`;

              const organizedResponse = await medicalChatTool.invoke({
                query: organizePrompt,
              });

              output = `【意图识别结果】\n类型: 向量搜索\n置信度: ${
                intent.confidence
              }\n理由: ${
                intent.reasoning
              }\n\n【搜索结果整理】\n${organizedResponse}\n\n---\n📚 参考来源：\n${parsedResult.results
                .map(
                  (r, i) =>
                    `${i + 1}. ${r.title} (相似度: ${(
                      r.similarity * 100
                    ).toFixed(1)}%)`
                )
                .join("\n")}`;

              intermediateSteps.push({
                tool: "vector_search",
                input: { query: input },
                output: parsedResult,
              });
              intermediateSteps.push({
                tool: "medical_chat",
                input: { query: organizePrompt },
                output: organizedResponse,
              });
            } else {
              output = `【意图识别结果】\n类型: 向量搜索\n置信度: ${intent.confidence}\n理由: ${intent.reasoning}\n\n【搜索结果】\n${parsedResult.message}\n\n建议：您可以尝试使用其他关键词，或询问具体的医疗健康问题，我可以直接为您解答。`;
              intermediateSteps.push({
                tool: "vector_search",
                input: { query: input },
                output: parsedResult,
              });
            }
          } catch (error) {
            console.error("❌ 向量搜索执行失败:", error);
            console.error("错误堆栈:", error.stack);
            output = `【意图识别结果】\n类型: 向量搜索\n置信度: ${intent.confidence}\n理由: ${intent.reasoning}\n\n抱歉，向量搜索执行失败: ${error.message}。让我直接为您解答相关问题。\n\n`;

            // 如果向量搜索失败，回退到医疗对话
            const fallbackResult = await medicalChatTool.invoke({
              query: input,
            });
            output += fallbackResult;
            intermediateSteps.push({
              tool: "medical_chat",
              input: { query: input },
              output: fallbackResult,
            });
          }
          break;

        case "other":
          console.log("💬 步骤 2: 意图为其他对话");
          // 对于其他意图，直接调用 LLM 进行一般性对话
          const generalResponse = await this.llm.invoke([
            {
              role: "system",
              content:
                "你是一位友好的医疗助手。如果用户不是询问医疗问题，请礼貌地回应，并引导用户询问医疗健康相关问题。",
            },
            { role: "user", content: input },
          ]);
          output = generalResponse.content;
          break;

        default:
          console.log("🏥 步骤 2: 默认使用医疗对话");
          const defaultResult = await medicalChatTool.invoke({ query: input });
          output = defaultResult;
          intermediateSteps.push({
            tool: "medical_chat",
            input: { query: input },
            output: defaultResult,
          });
      }

      // 更新对话历史
      this.chatHistory.push({ role: "user", content: input });
      this.chatHistory.push({ role: "assistant", content: output });

      // 限制历史长度，避免上下文过长
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      return {
        success: true,
        output: output,
        intermediateSteps: intermediateSteps,
      };
    } catch (error) {
      console.error("❌ Agent 执行失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.chatHistory = [];
    console.log("🗑️ 对话历史已清空");
  }
}

// 导出默认实例
export const agentManager = new AgentManager();
