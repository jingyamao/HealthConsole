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

      // 并行执行：LLM分析 + 意图识别工具
      const [analysisResult, intentResult] = await Promise.all([
        // LLM分析
        this.llm.invoke([
          { role: "system", content: "分析用户意图，返回JSON格式：{userIntent, suggestedTool, reasoning, confidence}" },
          { role: "user", content: `分析："${input}"` }
        ]),
        // 意图识别工具
        intentRecognitionTool.invoke({ message: input })
      ]);

      // 解析LLM分析结果
      let llmAnalysis;
      try {
        const jsonMatch = analysisResult.content.match(/\{[\s\S]*\}/);
        llmAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResult.content);
      } catch (e) {
        llmAnalysis = { suggestedTool: "medical_chat", confidence: 0.5 };
      }

      // 解析工具意图结果
      let toolIntent;
      try {
        toolIntent = JSON.parse(intentResult);
      } catch (e) {
        toolIntent = { intent: "medical_chat", confidence: 0.5 };
      }

      // 综合决策
      let finalDecision = this.makeDecision(llmAnalysis, toolIntent, input);
      console.log("⚖️ 决策:", finalDecision.action);

      // 执行对应操作
      let output;
      let intermediateSteps = [];

      switch (finalDecision.action) {
        case "medical_chat":
          output = await medicalChatTool.invoke({ query: input });
          break;

        case "database_query":
          try {
            const dbResult = await databaseQueryTool.invoke({ query: input });
            const parsed = JSON.parse(dbResult);
            output = parsed.success ? parsed.answer : `查询失败：${parsed.error}`;
          } catch (e) {
            output = await medicalChatTool.invoke({ query: input });
          }
          break;

        case "vector_search":
          try {
            const vectorResult = await vectorSearchTool.invoke({
              query: finalDecision.searchQuery || input,
              limit: 5,
              minRelevance: 0.3
            });
            const parsed = JSON.parse(vectorResult);
            if (parsed.success && parsed.resultCount > 0) {
              const summary = parsed.results.map((r, i) => `[${i + 1}] ${r.title}: ${r.content.substring(0, 100)}...`).join('\n');
              output = await medicalChatTool.invoke({
                query: `基于以下内容回答"${input}"：\n${summary}`
              });
            } else {
              output = await medicalChatTool.invoke({ query: input });
            }
          } catch (e) {
            output = await medicalChatTool.invoke({ query: input });
          }
          break;

        case "list_knowledge_base":
          try {
            const listResult = await listKnowledgeBaseTool.invoke({ includeContent: false });
            const parsed = JSON.parse(listResult);
            if (parsed.success) {
              const docList = parsed.documents.map(d => `${d.index}. ${d.title}`).join('\n');
              const response = await this.llm.invoke([
                { role: "system", content: "介绍知识库内容" },
                { role: "user", content: `用户问："${input}"\n\n知识库文档：\n${docList}\n\n请友好地介绍这些文档。` }
              ]);
              output = response.content;
            } else {
              output = "获取知识库列表失败";
            }
          } catch (e) {
            output = "获取知识库列表出错";
          }
          break;

        default:
          output = await medicalChatTool.invoke({ query: input });
      }

      // 更新对话历史（限制20条）
      this.chatHistory.push({ role: "user", content: input });
      this.chatHistory.push({ role: "assistant", content: output });
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      return { success: true, output };
    } catch (error) {
      console.error("❌ Agent 执行失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 综合LLM分析和工具识别结果，做出最终决策（简化版）
   * @param {Object} llmAnalysis - LLM分析结果
   * @param {Object} toolIntent - 工具意图识别结果
   * @param {string} input - 用户原始输入
   * @returns {Object} 最终决策
   */
  makeDecision(llmAnalysis, toolIntent, input) {
    const inputLower = input.toLowerCase();

    // 优先级1: 知识库列表查询（关键词匹配）
    const listKeywords = ['有哪些', '有什么', '列表', '所有', '全部', '目录', '列举'];
    const hasKnowledgeRef = inputLower.includes('知识库') || inputLower.includes('知识文档') || 
                            inputLower.includes('文档') || inputLower.includes('指南');
    if (hasKnowledgeRef && listKeywords.some(kw => inputLower.includes(kw))) {
      return {
        action: 'list_knowledge_base',
        reasoning: '用户想查看知识库中的所有文档列表'
      };
    }

    // 优先级2: 使用工具识别的意图（如果置信度足够）
    if (toolIntent.confidence >= 0.7) {
      return {
        action: toolIntent.intent,
        reasoning: toolIntent.reasoning
      };
    }

    // 优先级3: 使用LLM分析结果（如果置信度足够）
    if (llmAnalysis.confidence >= 0.7 && llmAnalysis.suggestedTool) {
      return {
        action: llmAnalysis.suggestedTool,
        reasoning: llmAnalysis.reasoning,
        searchQuery: llmAnalysis.userIntent
      };
    }

    // 默认: 医疗对话
    return {
      action: 'medical_chat',
      reasoning: '默认医疗对话'
    };
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
