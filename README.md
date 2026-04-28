# HealthConsole — 智能医疗后台管理系统

基于 Vue 3 + Koa + Prisma + LangChain 的医疗病历管理与 AI 辅助决策系统。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API)、Vite/Rolldown、Element Plus、Pinia、marked |
| 后端 | Node.js ESM、Koa 3.x、@koa/router |
| 数据库 | PostgreSQL + Prisma ORM |
| AI/LLM | LangChain v0.2、KIMI (Moonshot)、Xiaomi MIMO、Aliyun embeddings |
| 向量存储 | 自研 JSONB 向量存储 + 余弦相似度检索（PostgreSQL） |

## AI / Agent 系统

### 整体架构

```
用户请求
  ↓
 aiChatController
  ↓
 AgentManager（自定义编排层）
  ├── 意图识别 (intentRecognition) → LLM 5 路分类
  └── 工具调度
       ├── databaseQuery   → 自然语言 → SQL → Prisma 查询 → 格式化答案
       ├── medicalChat     → 医学专家系统 LLM 对话
       ├── vectorSearch    → 向量检索 + RAG 增强生成
       └── listKnowledge   → 知识库文档枚举
  ↓
 结果持久化 → 返回前端（SSE / JSON）
```

### 核心 Agent 设计

Agent 采用**自定义编排**而非 LangChain 原生 `AgentExecutor`，实现了更低延迟、更可控的决策链路：

1. **意图识别** — 调用 KIMI LLM 将用户输入分类为 `database_query | medical_chat | vector_search | list_knowledge_base | other`，同时结合关键词规则兜底
2. **Database Query 工具**（1028 行）— 三步 LLM 流水线：
   - Step 1：LLM 分析查询意图，生成 JSON 查询计划（目标表、筛选条件、聚合、分组等）
   - Step 2：`executeQueryPlan()` 映射到 10 张业务表的 Prisma 查询函数
   - Step 3：LLM 将查询结果格式化为自然语言 Markdown 答案
3. **RAG 检索增强** — `vectorSearch` 触发向量相似度检索，结果注入 `medicalChat` 作为上下文，实现带源引用的医学问答

### AI 患者分析

两个独立维度的 AI 能力，结果持久化到 `Patient.aiNotes` JSONB 字段：

| 功能 | 路径 | 说明 |
|------|------|------|
| 综合分析 | `POST /api/analysis/:id/analyze` | 格式化患者全部病历为结构化文本 → KIMI LLM 临床评估 → 输出 `riskLevel` / `keyFindings` / `diagnosisAssessment` 等 7 项结构化结果 |
| 诊疗建议 | `POST /api/analysis/:id/suggest` | 基于患者全量数据 → LLM 生成 Markdown 格式的诊断建议、检查建议、治疗优化、生活指导、随访建议、风险提示 |

风险分级标准：**high**（严重疾病/多异常指标/复杂治疗）、**moderate**（需持续监测）、**low**（病情稳定）

### 知识库系统

- **17 篇医学文档**：覆盖糖尿病、冠心病、心衰、房颤、哮喘、COPD、痛风、甲状腺结节、高脂血症、骨质疏松、高血压等
- **自研向量存储**：基于 PostgreSQL JSONB 列，文档分块（1500 字符/块）→ Aliyun `text-embedding-v2` 嵌入 → 余弦相似度检索
- **文档生成器**：MIMO LLM 联网搜索自动生成权威医学文献，分块存储 + 源引用追踪
- **前端管理界面**：知识库列表搜索、分类筛选、分页浏览、详情查看

### LLM 配置

| 用途 | 模型 | SDK |
|------|------|------|
| Agent 推理 / 分析 / 建议 | KIMI (moonshot-v1-8k) | @langchain/openai |
| 文档 / 患者数据生成 | Xiaomi MIMO (mimo-v2-pro) | openai SDK（含联网搜索） |
| 文本嵌入 | Aliyun text-embedding-v2 | @langchain/openai（兼容模式） |

## 功能模块

- **仪表盘**：患者总量、AI 覆盖率、高风险统计、费用汇总、科室负荷、活动热力图、预警事件
- **患者管理**：列表搜索/筛选/分页、详情页 Tab 式 CRUD（9 种子记录类型）、可视化表单（tags/kvlist/rows 结构化输入）
- **AI 对话**：Agent 驱动的医学问答、多会话管理、Markdown 渲染、导出 HTML
- **AI 分析**：患者综合评估 + 诊疗建议、结果持久化、折叠/展开、重新生成
- **知识库管理**：文档 CRUD、向量化存储、语义检索

## 启动方式

```bash
# 后端
cd server
npm install
cp .env.example .env   # 填写 API Key
npx prisma generate
npx prisma db push
node app.js             # 默认端口 8000

# 前端
cd client
npm install
npm run dev             # 默认端口 5173
```

## 项目结构

```
HealthConsole/
├── client/                    # Vue 3 前端
│   └── src/
│       ├── api/               # 后端 API 封装
│       ├── components/        # 通用组件
│       ├── views/             # 页面
│       │   ├── AISystem/      # AI 对话
│       │   ├── Dashboard/     # 仪表盘
│       │   ├── KnowledgeBase/ # 知识库管理
│       │   └── Patient/       # 患者管理
│       ├── router/            # 路由
│       └── stores/            # Pinia 状态管理
├── server/                    # Koa 后端
│   ├── controller/            # 控制器（15 个）
│   ├── model/                 # 数据层（13 个）
│   ├── router/                # 路由（14 个）
│   ├── services/langchain/    # AI/Agent 核心
│   │   ├── agent/             # Agent 编排
│   │   ├── core/              # LLM/Embedding/VectorStore
│   │   └── tools/             # 工具集 + 生成器
│   ├── prisma/                # Prisma schema + client
│   └── knowledge_base/        # 医学知识文档（17 篇 .txt）
└── README.md
```
