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
  databaseQueryTool,
  listKnowledgeBaseTool,
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
   * 执行对话 - 智能分析用户意图，灵活调用工具
   * @param {string} input - 用户输入
   * @returns {Promise<Object>} 执行结果
   */
  async execute(input) {
    try {
      console.log("🤖 Agent 执行:", input);

      // 步骤 1: 使用LLM分析用户对话，理解真实意图
      console.log("🧠 步骤 1: LLM分析用户意图...");
      const analysisPrompt = `请分析用户的这条消息，理解用户的真实意图：
        用户消息："${input}"

        请从以下角度分析：
        1. 用户是在询问医疗健康问题，还是在进行系统操作（如查询数据、搜索知识库）？
        2. 用户的真实需求是什么？
        3. 用户是否在纠正之前的误解或澄清需求？
        4. 最适合使用哪种工具来回应？

        可选工具：
        - medical_chat: 回答医疗健康咨询问题
        - vector_search: 搜索知识库、查找诊疗指南、相似病例等
        - database_query: 查询数据库中的患者信息、统计数据等

        请以JSON格式返回分析结果：
        {
          "userIntent": "用户的真实意图描述",
          "suggestedTool": "推荐的工具",
          "reasoning": "分析理由",
          "confidence": 0.9
        }`;

      const analysisResult = await this.llm.invoke([
        { role: "system", content: "你是一位智能对话分析专家，擅长理解用户的真实意图。" },
        { role: "user", content: analysisPrompt }
      ]);

      let llmAnalysis;
      try {
        const jsonMatch = analysisResult.content.match(/\{[\s\S]*\}/);
        llmAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResult.content);
      } catch (e) {
        llmAnalysis = {
          userIntent: "医疗咨询",
          suggestedTool: "medical_chat",
          reasoning: "解析失败，默认医疗对话",
          confidence: 0.5
        };
      }
      console.log("🧠 LLM分析结果:", llmAnalysis);

      // 步骤 2: 调用意图识别工具进行确认和细化
      console.log("🎯 步骤 2: 调用意图识别工具确认...");
      const intentResult = await intentRecognitionTool.invoke({
        message: input,
      });
      console.log("🎯 意图识别结果:", intentResult);

      let toolIntent;
      try {
        toolIntent = JSON.parse(intentResult);
      } catch (e) {
        toolIntent = {
          intent: "medical_chat",
          confidence: 0.5,
          reasoning: "解析失败，默认医疗对话",
        };
      }

      // 步骤 3: 综合LLM分析和工具识别结果，做出最终决策
      console.log("⚖️ 步骤 3: 综合决策...");
      let finalDecision = this.makeDecision(llmAnalysis, toolIntent, input);
      console.log("⚖️ 最终决策:", finalDecision);

      // 步骤 4: 根据最终决策执行相应操作
      let output;
      let intermediateSteps = [
        {
          tool: "llm_analysis",
          input: { message: input },
          output: llmAnalysis,
        },
        {
          tool: "intent_recognition",
          input: { message: input },
          output: toolIntent,
        },
      ];

      switch (finalDecision.action) {
        case "medical_chat":
          console.log("🏥 步骤 4: 执行医疗对话...");
          const medicalResult = await medicalChatTool.invoke({ query: input });
          output = medicalResult;
          intermediateSteps.push({
            tool: "medical_chat",
            input: { query: input },
            output: medicalResult,
          });
          break;

        case "database_query":
          console.log("🗄️ 步骤 4: 执行数据库查询...");
          try {
            const dbResult = await databaseQueryTool.invoke({
              query: input,
              context: `用户意图：${finalDecision.reasoning}`
            });
            const parsedResult = JSON.parse(dbResult);

            if (parsedResult.success) {
              output = parsedResult.answer;
              intermediateSteps.push({
                tool: 'database_query',
                input: { query: input },
                output: {
                  queryPlan: parsedResult.queryPlan,
                  rawData: parsedResult.rawData
                }
              });
            } else {
              output = `抱歉，数据库查询失败：${parsedResult.error}。让我直接为您解答。`;
              intermediateSteps.push({ tool: 'database_query', input: { query: input }, output: parsedResult });
            }
          } catch (error) {
            console.error("❌ 数据库查询执行失败:", error);
            output = `抱歉，数据库查询执行失败：${error.message}。让我直接为您解答。`;
            const fallbackResult = await medicalChatTool.invoke({ query: input });
            output += fallbackResult;
            intermediateSteps.push({ tool: 'medical_chat', input: { query: input }, output: fallbackResult });
          }
          break;

        case "vector_search":
          console.log("🔍 步骤 4: 执行向量搜索...");
          try {
            const vectorResult = await vectorSearchTool.invoke({
              query: finalDecision.searchQuery || input,
              limit: 5,
              minRelevance: 0.3,
            });

            const parsedResult = JSON.parse(vectorResult);

            if (parsedResult.success && parsedResult.resultCount > 0) {
              console.log("🤖 步骤 5: 整理搜索结果...");

              const searchSummary = parsedResult.results
                .map((r, i) => `[${i + 1}] ${r.title}\n内容: ${r.content}`)
                .join("\n\n");

              const organizePrompt = `用户问题："${input}"

从知识库中找到以下内容：
${searchSummary}

请用自然、友好的方式回答用户的问题。`;

              const organizedResponse = await medicalChatTool.invoke({
                query: organizePrompt,
              });

              output = organizedResponse;

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
              // 搜索无结果时，使用LLM生成更友好的回复
              const noResultPrompt = `用户问："${input}"

我在知识库中没有找到完全匹配的内容。请用友好、自然的方式告诉用户，并询问用户是否需要：
1. 换个方式描述问题
2. 询问其他医疗健康问题
3. 直接获得一般性的医疗建议

请给出简洁、有帮助的回复。`;

              const noResultResponse = await this.llm.invoke([
                { role: "system", content: "你是一位友好的医疗助手。" },
                { role: "user", content: noResultPrompt }
              ]);

              output = noResultResponse.content;
              intermediateSteps.push({
                tool: "vector_search",
                input: { query: input },
                output: parsedResult,
              });
            }
          } catch (error) {
            console.error("❌ 向量搜索执行失败:", error);
            output = `抱歉，搜索时出现了问题。让我直接为您解答：${input}`;
            const fallbackResult = await medicalChatTool.invoke({ query: input });
            output = fallbackResult;
            intermediateSteps.push({
              tool: "medical_chat",
              input: { query: input },
              output: fallbackResult,
            });
          }
          break;

        case "list_knowledge_base":
          console.log("📋 步骤 4: 获取知识库列表...");
          try {
            const listResult = await listKnowledgeBaseTool.invoke({
              includeContent: false
            });
            const parsedList = JSON.parse(listResult);

            if (parsedList.success) {
              // 使用LLM整理知识库列表，生成友好的回复
              const listPrompt = `用户问："${input}"

知识库中有以下内容：
${parsedList.documents.map(d => `${d.index}. ${d.title} (${d.type})`).join('\n')}

请用友好、自然的方式告诉用户知识库中有哪些内容，并简要说明这些文档的用途。`;

              const listResponse = await this.llm.invoke([
                { role: "system", content: "你是一位友好的医疗助手，正在介绍知识库内容。" },
                { role: "user", content: listPrompt }
              ]);

              output = listResponse.content;
              intermediateSteps.push({
                tool: "list_knowledge_base",
                input: { includeContent: false },
                output: parsedList,
              });
            } else {
              output = "抱歉，获取知识库列表时出现了问题。";
              intermediateSteps.push({
                tool: "list_knowledge_base",
                input: { includeContent: false },
                output: parsedList,
              });
            }
          } catch (error) {
            console.error("❌ 获取知识库列表失败:", error);
            output = "抱歉，获取知识库列表时出现了错误。";
          }
          break;

        case "direct_response":
          console.log("💬 步骤 4: 直接回复...");
          output = finalDecision.response;
          break;

        default:
          console.log("🏥 步骤 4: 默认医疗对话...");
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
   * 综合LLM分析和工具识别结果，做出最终决策
   * @param {Object} llmAnalysis - LLM分析结果
   * @param {Object} toolIntent - 工具意图识别结果
   * @param {string} input - 用户原始输入
   * @returns {Object} 最终决策
   */
  makeDecision(llmAnalysis, toolIntent, input) {
    const inputLower = input.toLowerCase();

    // 特殊情况：用户明确纠正或澄清需求
    if (inputLower.includes('不是') || inputLower.includes('错了') || inputLower.includes('我说的是')) {
      // 优先使用LLM的分析，因为用户可能在纠正
      if (llmAnalysis.suggestedTool === 'vector_search' || llmAnalysis.suggestedTool === 'database_query') {
        return {
          action: llmAnalysis.suggestedTool,
          reasoning: `用户纠正：${llmAnalysis.reasoning}`,
          searchQuery: llmAnalysis.userIntent
        };
      }
    }

    // 用户询问知识库内容列表（列举所有文档）
    if (inputLower.includes('知识库') && 
        (inputLower.includes('有哪些') || inputLower.includes('有什么') || 
         inputLower.includes('列表') || inputLower.includes('所有') || 
         inputLower.includes('内容') || inputLower.includes('文档'))) {
      return {
        action: 'list_knowledge_base',
        reasoning: '用户想查看知识库中的所有文档列表'
      };
    }

    // 用户询问患者/数据库信息
    if (inputLower.includes('患者') || inputLower.includes('病人') || inputLower.includes('统计')) {
      return {
        action: 'database_query',
        reasoning: '用户想查询患者数据'
      };
    }

    // 综合置信度判断
    if (llmAnalysis.confidence >= 0.7 && toolIntent.confidence >= 0.7) {
      // 两者都高置信度，优先使用LLM的判断（更理解上下文）
      return {
        action: llmAnalysis.suggestedTool,
        reasoning: `LLM分析：${llmAnalysis.reasoning}`
      };
    } else if (llmAnalysis.confidence >= 0.7) {
      // 只有LLM高置信度
      return {
        action: llmAnalysis.suggestedTool,
        reasoning: `LLM分析：${llmAnalysis.reasoning}`
      };
    } else if (toolIntent.confidence >= 0.7) {
      // 只有工具高置信度
      return {
        action: toolIntent.intent,
        reasoning: `工具识别：${toolIntent.reasoning}`
      };
    } else {
      // 都低置信度，默认医疗对话
      return {
        action: 'medical_chat',
        reasoning: '置信度较低，默认医疗对话'
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
