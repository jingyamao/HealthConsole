# HealthConsole AI Agent 改进方案

## 一、当前系统问题诊断

### 问题 1：数据库查询工具覆盖不全（核心问题）

**现状**：`databaseQueryTool` 仅支持 4 张表的查询：

| 已支持 | 未支持 |
|--------|--------|
| Patient（基础信息+统计） | CurrentSymptom（主诉/症状） |
| Diagnosis（诊断分布） | PhysicalExamination（体格检查） |
| TreatmentPlan（用药分析） | ExaminationResult（检查结果） |
| MedicalHistory（病史统计） | ProgressNote（病程记录） |
| | FinancialInfo（费用/医保） |
| | MedicalTeam（医疗团队） |

**直接后果**：用户问"疾病类型、年龄分布、治疗情况"时，AI 只能做有限的诊断统计，无法回答"治疗情况"（缺少 TreatmentPlan 的用药/手术分析）和"费用情况"（完全缺失）。

---

### 问题 2：会话历史未注入 LLM

**现状**：
- `AgentManager.sessionHistories` 维护了 20 条消息的历史记录
- 但 `medicalChatTool`、`intentRecognitionTool`、`databaseQueryTool` 调用 LLM 时**均未传入历史**
- LLM 每次都是"无记忆"状态，无法理解上下文

**直接后果**：
- 用户说"再查一下男性的"，AI 不知道"再查"指的是什么
- 多轮对话体验极差，每次都是独立问答

---

### 问题 3：意图识别双重调用 LLM，浪费资源

**现状**：
- `AgentManager.execute()` 并行调用 LLM 分析意图 + `intentRecognitionTool`（内部又调一次 LLM）
- 相当于**每次请求消耗 2 次 LLM 调用**，仅用于判断该用哪个工具
- 而且 `intentRecognitionTool` 内部也用 LLM 做分类，与 `AgentManager` 的分析完全重复

---

### 问题 4：数据库查询的 LLM 提示词过于简单

**现状**：`databaseQueryTool` 的查询计划生成提示词（lines 97-133）存在以下问题：
- 缺少 `CurrentSymptom`、`ProgressNote`、`FinancialInfo` 等表的 schema
- 没有明确告诉 LLM 如何做聚合统计（GROUP BY、COUNT、AVG）
- 对复杂查询（如"按年龄段统计各疾病的治疗费用"）无法生成正确的查询计划
- `buildWhereClause()` 仅支持有限的过滤条件，缺少 `insurance`（医保类型）、`paymentStatus`（支付状态）等

---

### 问题 5：向量搜索结果未有效利用

**现状**：
- `vector_search` 找到相关文档后，将前 3 条结果拼接成字符串传给 `medicalChatTool`
- 但 `medicalChatTool` 的提示词没有引导 LLM "基于以下资料回答"，容易被忽略
- 知识库文档列表查询（`listKnowledgeBaseTool`）只返回标题，不返回摘要

---

### 问题 6：system prompt 缺乏领域上下文

**现状**：`AgentManager` 的系统提示词仅定义了通用的医疗助手规则，没有：
- 告知 LLM 数据库中有哪些患者数据、数据结构
- 引导 LLM 在需要数据时主动使用 `database_query`
- 定义输出格式（如表格、列表、分段等）
- 说明如何处理模糊查询（如"大概有多少"→ 应调用统计查询）

---

## 二、改进方案

### 改进 1：扩展 databaseQueryTool 支持全部 10 张业务表

**修改文件**：`server/services/langchain/tools/tool/databaseQuery.js`

新增支持的表及查询能力：

| 表名 | 查询能力 |
|------|----------|
| **CurrentSymptom** | 按主诉、症状类型、严重程度统计；搜索特定症状的患者 |
| **PhysicalExamination** | 按检查异常项统计；查看特定患者的检查结果 |
| **ExaminationResult** | 按检验/影像结果统计异常率 |
| **ProgressNote** | 按病程记录类型统计；查看特定患者的诊疗过程 |
| **FinancialInfo** | 按费用区间、支付状态、医保类型统计；费用趋势分析 |
| **MedicalTeam** | 按医生/科室统计工作量 |

**具体改动**：

1. 在 `DATABASE_SCHEMA` 常量中补充 6 张表的完整字段描述
2. 新增 6 个查询函数：
   - `queryCurrentSymptomTable()` — 症状统计与搜索
   - `queryPhysicalExaminationTable()` — 体格检查统计
   - `queryExaminationResultTable()` — 检查结果统计
   - `queryProgressNoteTable()` — 病程记录查询
   - `queryFinancialInfoTable()` — 费用分析
   - `queryMedicalTeamTable()` — 医疗团队统计
3. 在 `executeQuery()` 的 switch 中注册新表
4. 扩展 `buildWhereClause()` 支持更多过滤字段：
   - `paymentStatus`（未支付/部分支付/已支付）
   - `insurance`（医保类型模糊匹配）
   - `severity`（轻/中/重）
   - `noteType`（入院/病程/手术/出院记录）

---

### 改进 2：将会话历史注入 LLM 调用

**修改文件**：`server/services/langchain/agent/agent.js`

**方案**：

1. 在 `execute()` 方法中，从 `sessionHistories` 获取最近 6 条消息（3 轮对话）
2. 将历史格式化为 LangChain 的 `SystemMessage` / `HumanMessage` / `AIMessage`
3. 在以下 LLM 调用中注入历史：
   - `AgentManager` 的意图分析 LLM 调用
   - `medicalChatTool` 的回复生成
   - `databaseQueryTool` 的结果总结
4. 修改工具接口，支持可选的 `history` 参数

**代码结构**：

```javascript
// agent.js - execute() 方法
const history = this.getHistory(sessionId, 6) // 最近 3 轮
const historyText = history.map(m =>
  `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`
).join('\n')

// 传入各工具
const result = await tool.invoke({
  query: input,
  history: historyText  // 新增参数
})
```

---

### 改进 3：优化意图识别，减少 LLM 调用

**修改文件**：`server/services/langchain/agent/agent.js`、`tools/tool/intentRecognition.js`

**方案 A（推荐）**：去掉 `AgentManager` 中重复的 LLM 意图分析，仅保留 `intentRecognitionTool`

- 删除 `execute()` 中的 LLM 意图分析调用（lines 107-115 的 `Promise.all`）
- 仅使用 `intentRecognitionTool` 的结果
- 节省 1 次 LLM 调用，响应速度提升约 40%

**方案 B（备选）**：保留双重分析，但用规则引擎替代 LLM

- 用关键词 + 正则表达式做初筛
- 仅在规则引擎无法判断时才调用 LLM
- 适合意图类型固定的场景

---

### 改进 4：增强 databaseQueryTool 的提示词

**修改文件**：`server/services/langchain/tools/tool/databaseQuery.js`

**改进查询计划生成提示词**：

```
你是数据库查询专家。根据用户的问题生成精确的查询计划。

可用表和字段：
{完整的 DATABASE_SCHEMA}

规则：
1. "有多少" → queryType: "统计查询", aggregations: [{field: "*", operation: "count"}]
2. "按XX统计" → queryType: "统计查询", groupBy: ["XX"]
3. "查看/列出" → queryType: "列表查询"
4. "XX的详情" → queryType: "详情查询"
5. "XX的趋势" → queryType: "分析查询", groupBy: ["时间字段"]
6. 费用相关查询 → targetTable: "FinancialInfo"
7. 治疗方案查询 → targetTable: "TreatmentPlan"
8. 症状查询 → targetTable: "CurrentSymptom"
9. 病程记录查询 → targetTable: "ProgressNote"

返回 JSON 格式：
{
  "queryType": "统计查询|列表查询|详情查询|分析查询",
  "targetTable": "表名",
  "filters": {"字段名": "条件"},
  "aggregations": [{"field": "字段", "operation": "count|sum|avg|min|max"}],
  "groupBy": ["分组字段"],
  "orderBy": {"field": "排序字段", "direction": "asc|desc"},
  "limit": 数量,
  "reasoning": "选择此查询的原因"
}
```

---

### 改进 5：优化 RAG 响应流程

**修改文件**：`server/services/langchain/agent/agent.js`、`tools/tool/medicalChat.js`

**当前问题**：向量搜索结果传给 `medicalChatTool` 时，提示词不够明确。

**改进方案**：

1. 修改 `medicalChatTool` 支持可选的 `context` 参数
2. 当有知识库上下文时，使用专门的 RAG 提示词：

```javascript
const ragPrompt = `
你是专业的医疗助手。请基于以下参考资料回答用户的问题。

参考资料：
${context}

要求：
1. 优先使用参考资料中的信息
2. 如果参考资料不足以回答，可以补充通用医学知识
3. 明确标注哪些信息来自参考资料
4. 引用具体的指南名称或文献来源
`
```

3. 在 `AgentManager` 的 `vector_search` 分支中，将搜索结果格式化为带来源标注的文本

---

### 改进 6：增强 system prompt 的领域上下文

**修改文件**：`server/services/langchain/agent/agent.js`

**当前提示词**（仅 15 行通用规则）→ **改进为**：

```
你是 HealthConsole 智能医疗系统的 AI 助手。

## 你的能力
1. 查询患者数据库：疾病统计、年龄分布、治疗情况、费用分析等
2. 搜索医学知识库：临床指南、诊疗规范、医学文献
3. 医疗健康咨询：症状分析、疾病科普、健康管理建议

## 数据库说明
系统中有 208+ 位患者的完整医疗档案，包括：
- 基础信息：姓名、年龄、性别、联系方式、医保类型
- 诊断信息：主要诊断、次要诊断、鉴别诊断（含 ICD 编码）
- 症状信息：主诉、症状描述、持续时间、严重程度
- 治疗方案：用药记录、手术方案、生活建议、随访计划
- 病程记录：入院记录、病程记录、手术记录、出院记录
- 费用信息：总费用、医保报销、自费金额、支付状态
- 体格检查：生命体征、各系统检查结果
- 检查结果：实验室检验、影像学检查、特殊检查

## 重要规则
1. 不能替代医生诊断，仅供参考
2. 紧急症状必须建议立即就医
3. 不提供具体药物剂量
4. 用通俗易懂的语言回答
5. 涉及数据查询时，优先使用 database_query 工具获取真实数据
6. 回答数据相关问题时，给出具体数字而非笼统描述
7. 支持 Markdown 格式输出（表格、列表、加粗等）
```

---

## 三、改进优先级与实施顺序

| 优先级 | 改进项 | 预计工作量 | 影响范围 |
|--------|--------|-----------|----------|
| P0 | 改进 1：扩展 databaseQueryTool | 大（~300 行新代码） | 核心查询能力 |
| P0 | 改进 4：增强查询提示词 | 中（~50 行修改） | 查询准确率 |
| P0 | 改进 6：增强 system prompt | 小（~30 行修改） | 整体回答质量 |
| P1 | 改进 2：注入会话历史 | 中（~80 行修改） | 多轮对话体验 |
| P1 | 改进 5：优化 RAG 流程 | 小（~40 行修改） | 知识库利用率 |
| P2 | 改进 3：优化意图识别 | 小（~20 行删除） | 响应速度/成本 |

**建议实施顺序**：P0 → P1 → P2

---

## 四、预期效果

改进后，用户可以：

1. **"查询疾病类型、年龄分布、治疗情况"**
   → AI 同时调用 Diagnosis 表（疾病统计）、Patient 表（年龄分布）、TreatmentPlan 表（用药/手术分析），返回结构化的综合报告

2. **"查看费用最高的 5 位患者"**
   → AI 调用 FinancialInfo 表，按 totalCost 降序排列，返回患者姓名、总费用、医保报销、自费金额

3. **"男性患者的高血压用药情况"**
   → AI 组合查询 Patient（gender=男）+ Diagnosis（diagnosisName LIKE %高血压%）+ TreatmentPlan（medication 分析）

4. **"再查一下女性的"**（多轮对话）
   → AI 结合会话历史，理解"再查"指的是同样的查询条件，仅将 gender 改为"女"

5. **"糖尿病的最新治疗指南是什么"**
   → AI 搜索知识库中糖尿病相关文档，返回指南摘要和来源
