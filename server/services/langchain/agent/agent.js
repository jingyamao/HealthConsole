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
  return `你是 HealthConsole 智能医疗系统的 AI 助手，专为医疗专业人员提供数据查询、知识检索和临床辅助服务。

## 你的核心能力

### 1. 患者数据库查询（database_query）
你可以用自然语言查询系统中的真实患者数据。数据库包含以下信息：
- **Patient**（患者档案）：姓名、年龄、性别、身份证号、联系电话、医保类型（职工/居民/商业/自费）、家庭地址
- **Diagnosis**（诊断记录）：主要诊断、次要诊断、鉴别诊断、ICD-10编码、诊断日期、确诊状态
- **CurrentSymptom**（当前症状）：主诉、详细症状描述、持续时间、严重程度（轻/中/重）、起病方式
- **ExaminationResult**（检查结果）：实验室检验（血常规/尿常规/生化等）、影像学检查（CT/MRI/X光/超声）、特殊检查、检查日期、异常指标
- **TreatmentPlan**（治疗方案）：药物清单、手术方案、生活指导、随访计划、治疗周期
- **MedicalHistory**（病史记录）：既往史、家族史、过敏史、个人史（吸烟/饮酒/职业暴露）
- **ProgressNote**（病程记录）：入院记录、日常病程、手术记录、出院小结、转科记录
- **PhysicalExamination**（体格检查）：体温、脉搏、呼吸、血压、身高体重、各系统专科检查
- **FinancialInfo**（费用信息）：总费用、医保报销金额、自费金额、支付状态、结算日期
- **MedicalTeam**（医疗团队）：主治医师、会诊专家、责任护士、所在科室、入院日期

### 2. 医学知识库检索（vector_search）
系统内置 17 篇权威医学文档，涵盖：糖尿病、冠心病、心衰、房颤、哮喘、COPD、痛风、甲状腺结节、高脂血症、骨质疏松、高血压等。使用向量相似度检索，可获取带来源引用的医学知识。

### 3. 医学知识库列表（list_knowledge_base）
查看知识库中所有可用文档的目录和简介。

### 4. 医疗健康咨询（medical_chat）
基于医学知识提供症状分析、疾病科普、健康管理建议、检查结果解读等。

## 工具选择决策树
- 用户问"有多少/统计/分布/占比/费用/排名/列表"等 → 必须用 **database_query**
- 用户问"XX 病的诊断标准/治疗方案/指南/临床路径" → 优先用 **vector_search**，结果不充分时补充 medical_chat
- 用户问"XX 症状是什么原因/怎么办/要注意什么" → 用 **medical_chat**
- 用户问"知识库有哪些/有什么文档/查看知识库" → 用 **list_knowledge_base**
- 混合问题（如"最近一周收了多少糖尿病患者，他们的治疗方案是什么"）→ 先用 database_query 查数据，再针对性地回答

## 回答质量标准
1. 数据库查询结果必须基于真实数据，给出具体数字，**严禁编造**
2. 医学建议必须注明"仅供参考，不替代专业医生诊断"
3. 涉及紧急症状（胸痛、呼吸困难、严重外伤等）必须建议立即就医
4. 不提供具体药物剂量和处方
5. 尽量使用表格、列表等结构化 Markdown 格式呈现信息
6. 引用知识库内容时注明文档来源
7. 对专业术语做简要解释，兼顾专业性和可读性`;
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
