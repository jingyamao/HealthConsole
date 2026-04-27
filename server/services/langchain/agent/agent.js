// agent.js - LangChain Agent 框架实现 (v0.2)
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
  return `你是 HealthConsole 智能医疗系统的 AI 助手。

## 你的能力
1. **查询患者数据库**：疾病统计、年龄分布、治疗情况、费用分析、症状分布、病程记录等
2. **搜索医学知识库**：临床指南、诊疗规范、医学文献（通过向量相似度检索）
3. **医疗健康咨询**：症状分析、疾病科普、健康管理建议

## 数据库说明
系统中存有大量患者的完整医疗档案，主要数据表包括：
- Patient：患者基础信息（姓名、年龄、性别、联系方式、医保类型、地址等）
- Diagnosis：诊断信息（主要诊断、次要诊断、鉴别诊断、ICD编码）
- CurrentSymptom：症状信息（主诉、症状描述、持续时间、严重程度）
- TreatmentPlan：治疗方案（用药记录、手术方案、生活建议、随访计划）
- MedicalHistory：病史信息（既往史、家族史、过敏史、个人史）
- ProgressNote：病程记录（入院记录、病程记录、手术记录、出院记录）
- FinancialInfo：费用信息（总费用、医保报销、自费金额、支付状态）
- PhysicalExamination：体格检查（生命体征、各系统检查结果）
- ExaminationResult：检查结果（实验室检验、影像学检查、特殊检查）
- MedicalTeam：医疗团队（主治医生、会诊医生、护理团队、科室信息）

## 工具使用规则
1. 当用户询问患者数据相关问题（如"有多少患者"、"疾病分布"、"治疗情况"、"费用"等）时，**必须优先使用 database_query 工具**获取真实数据
2. 当用户搜索医学知识、诊疗指南、相似病例时，使用 vector_search 工具
3. 当用户进行医疗健康咨询、症状分析时，使用 medical_chat 工具
4. 当用户想查看知识库有哪些内容时，使用 list_knowledge_base 工具
5. 涉及数据查询时，优先使用 database_query 获取真实数据，不要凭空编造数字

## 重要规则
1. 不能替代医生诊断，仅供参考
2. 紧急症状必须建议立即就医
3. 不提供具体药物剂量
4. 用通俗易懂的语言回答
5. 回答数据相关问题时，给出具体数字而非笼统描述
6. 支持 Markdown 格式输出（表格、列表、加粗等）`;
}

/**
 * Agent管理器
 * 提供简化的Agent使用接口 - 强制先进行意图识别，再执行相应操作
 */
export class AgentManager {
  constructor() {
    this.llm = defaultLLM;
    this.sessionHistories = new Map(); // sessionId -> [{role, content}]
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
  async execute(input, sessionId = 'default') {
    try {
      console.log("🤖 Agent 执行:", input, "会话:", sessionId);

      // 获取会话历史（最近6条 = 3轮对话）
      const history = this.sessionHistories.get(sessionId) || [];
      const recentHistory = history.slice(-6);
      const historyText = recentHistory.map(m =>
        `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`
      ).join('\n');

      // 仅使用意图识别工具（去掉重复的LLM分析，节省1次LLM调用）
      let toolIntent;
      try {
        const intentResult = await intentRecognitionTool.invoke({ message: input });
        toolIntent = JSON.parse(intentResult);
      } catch (e) {
        toolIntent = { intent: "medical_chat", confidence: 0.5 };
      }

      // 综合决策
      let finalDecision = this.makeDecision(toolIntent, input, historyText);
      console.log("⚖️ 决策:", finalDecision.action);

      // 执行对应操作
      let output;

      switch (finalDecision.action) {
        case "medical_chat":
          output = await medicalChatTool.invoke({ query: input, history: historyText });
          break;

        case "database_query":
          try {
            const dbResult = await databaseQueryTool.invoke({ query: input, history: historyText });
            const parsed = JSON.parse(dbResult);
            output = parsed.success ? parsed.answer : `查询失败：${parsed.error}`;
          } catch (e) {
            output = await medicalChatTool.invoke({ query: input, history: historyText });
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
              const context = parsed.results.map((r, i) =>
                `【来源${i + 1}】${r.title}\n${r.content.substring(0, 200)}...`
              ).join('\n\n');
              output = await medicalChatTool.invoke({
                query: input,
                context: `以下是与问题相关的参考资料：\n\n${context}\n\n请基于以上参考资料回答用户问题。优先使用参考资料中的信息，如果参考资料不足以回答，可以补充通用医学知识。引用具体的来源编号。`
              });
            } else {
              output = await medicalChatTool.invoke({ query: input, history: historyText });
            }
          } catch (e) {
            output = await medicalChatTool.invoke({ query: input, history: historyText });
          }
          break;

        case "list_knowledge_base":
          try {
            const listResult = await listKnowledgeBaseTool.invoke({ includeContent: false });
            const parsed = JSON.parse(listResult);
            if (parsed.success) {
              const docList = parsed.documents.map(d => `${d.index}. ${d.title}`).join('\n');
              const response = await this.llm.invoke([
                { role: "system", content: "你是知识库助手，友好地介绍知识库中的文档内容。" },
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
          output = await medicalChatTool.invoke({ query: input, history: historyText });
      }

      // 更新会话级对话历史（限制20条）
      history.push({ role: "user", content: input });
      history.push({ role: "assistant", content: output });
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      this.sessionHistories.set(sessionId, history);

      return { success: true, output };
    } catch (error) {
      console.error("❌ Agent 执行失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 综合意图识别结果和关键词规则，做出最终决策
   * @param {Object} toolIntent - 工具意图识别结果
   * @param {string} input - 用户原始输入
   * @param {string} historyText - 会话历史文本
   * @returns {Object} 最终决策
   */
  makeDecision(toolIntent, input, historyText) {
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

    // 优先级2: 使用意图识别工具结果（置信度 >= 0.7）
    if (toolIntent.confidence >= 0.7) {
      return {
        action: toolIntent.intent,
        reasoning: toolIntent.reasoning,
        searchQuery: input
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
  clearHistory(sessionId) {
    if (sessionId) {
      this.sessionHistories.delete(sessionId);
      console.log("🗑️ 会话历史已清空:", sessionId);
    } else {
      this.sessionHistories.clear();
      console.log("🗑️ 所有会话历史已清空");
    }
  }
}

// 导出默认实例
export const agentManager = new AgentManager();
