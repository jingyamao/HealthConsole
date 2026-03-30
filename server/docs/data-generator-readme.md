# 数据生成工具使用说明

## 概述

本项目使用小米 MIMO 大模型生成真实的医疗数据，包括：
1. **患者数据生成器** - 生成 100 个患者及其完整医疗记录（不联网）
2. **医疗知识文档生成器** - 生成权威医疗知识文档（联网模式）

## 技术架构

### 核心组件

```
services/langchain/
├── core/
│   └── mimoLLM.js              # 小米 MIMO 大模型服务
├── tools/generators/
│   ├── patientDataGenerator.js  # 患者数据生成器
│   └── medicalKnowledgeGenerator.js  # 医疗知识文档生成器
scripts/
└── dataGenerator.js            # 统一调用脚本
```

## 环境配置

确保 `.env` 文件中配置了 MIMO API 密钥：

```bash
MIMO_API_KEY="your_mimo_api_key"
```

## 使用方法

### 1. 生成患者数据

生成 100 个患者及其完整医疗记录（包括病史、症状、检查、诊断、治疗方案等）：

```bash
# 生成患者数据
node scripts/dataGenerator.js patient

# 生成前先清空现有数据
node scripts/dataGenerator.js patient --clear
```

**特点：**
- ✅ 不联网模式，快速生成
- ✅ 每个患者包含完整的医疗记录
- ✅ 自动生成向量数据
- ✅ 数据符合医学常识

**数据结构：**
- 患者基本信息（姓名、性别、年龄、联系方式等）
- 既往病史（慢性疾病、手术史、过敏史等）
- 当前症状（主诉、症状详情、持续时间等）
- 体格检查（生命体征、各系统检查）
- 检查结果（实验室检查、影像学检查等）
- 诊断记录（ICD 编码、诊断名称、诊断类型）
- 治疗方案（药物、手术、生活方式建议、随访计划）
- 向量数据（用于 AI 检索和分析）

### 2. 生成医疗知识文档

生成权威医疗知识文档（使用联网搜索获取最新医学信息）：

```bash
# 生成 5 份默认主题的文档
node scripts/dataGenerator.js knowledge

# 生成指定数量的文档（从推荐列表中选择）
node scripts/dataGenerator.js knowledge 10

# 生成指定主题的文档
node scripts/dataGenerator.js topic "2 型糖尿病诊疗指南"
```

**特点：**
- ✅ 联网模式，搜索最新医学文献
- ✅ 内容权威、详细、专业
- ✅ 自动生成 Markdown 格式文档
- ✅ 存储到 knowledge_base 目录
- ✅ 自动存入数据库并生成向量

**文档质量：**
- 基于最新医学指南和权威文献
- 包含病因、诊断、治疗、预防等完整内容
- 标注来源和版本信息
- 不少于 2000 字

### 3. 查看推荐主题

```bash
# 查看所有推荐的知识文档主题
node scripts/dataGenerator.js list
```

推荐主题包括：
- 心血管疾病（高血压、冠心病、心衰等）
- 内分泌疾病（糖尿病、甲状腺疾病等）
- 呼吸系统（哮喘、慢阻肺、肺炎等）
- 消化系统（胃炎、肝硬化、炎症性肠病等）
- 神经系统（卒中、癫痫、帕金森等）
- 其他重要疾病

### 4. 全量生成

一次性生成患者数据和医疗知识文档：

```bash
# 全量生成（不清空现有数据）
node scripts/dataGenerator.js all

# 全量生成（先清空患者数据）
node scripts/dataGenerator.js all --clear
```

## 代码使用示例

### 在代码中调用

```javascript
// 导入生成器
import patientDataGenerator from './services/langchain/tools/generators/patientDataGenerator.js';
import medicalKnowledgeGenerator from './services/langchain/tools/generators/medicalKnowledgeGenerator.js';

// 生成患者数据
async function generatePatients() {
  const result = await patientDataGenerator.generateAndStore(100);
  console.log(`成功生成${result.count}个患者数据`);
}

// 生成医疗文档
async function generateKnowledge() {
  const topics = ['2 型糖尿病诊疗指南', '高血压诊治指南'];
  const result = await medicalKnowledgeGenerator.generateBatch(topics);
  console.log(`成功生成${result.success}份文档`);
}

// 使用 MIMO 服务
import mimoService from './services/langchain/core/mimoLLM.js';

// 普通对话（不联网）
const response = await mimoService.send('请介绍高血压的预防措施', false);
console.log(response.data.content);

// 联网搜索
const webResponse = await mimoService.send('请搜索 2025 年最新的高血压治疗指南', true);
console.log(webResponse.data.content);
```

## 提示词设计

### 患者数据生成提示词

- 严格的 JSON 格式要求
- 详细的字段说明和示例
- 医学专业性要求
- 数据多样性和真实性要求

### 医疗文档生成提示词

- 权威来源要求（医学指南、专家共识）
- 文档结构模板
- 内容质量要求（2000 字以上）
- 格式规范（Markdown）
- 元数据提取

## 输出示例

### 患者数据输出

```
🏥 开始生成患者医疗数据
============================================================
🚀 开始生成 100 个患者医疗数据...
📡 正在调用 MIMO 大模型生成数据...
✅ 数据生成成功，正在解析...
📊 解析到 100 个患者数据
💾 开始存储患者数据到数据库...
✅ [1/100] 患者 张三 数据入库成功
✅ [2/100] 患者 李四 数据入库成功
...
✅ [100/100] 患者 王五 数据入库成功

📊 存储统计:
   - 成功：100 人
   - 失败：0 人
============================================================
```

### 医疗文档生成输出

```
📚 开始生成医疗知识文档（联网模式）
============================================================
🚀 开始生成 5 份医疗知识文档（联网模式）...

[1/5] 处理：2 型糖尿病诊疗指南
📚 正在生成文档：2 型糖尿病诊疗指南
🔍 正在搜索最新医学文献...
✅ 文档内容生成成功
🏷️  正在提取文档元数据...
💾 文档已保存：/path/to/knowledge_base/2 型糖尿病诊疗指南.txt
📄 文档 "2 型糖尿病诊疗指南" 已存入数据库
🔍 文档 "2 型糖尿病诊疗指南" 向量化完成
⏳ 等待 3 秒后继续...

...

============================================================
📊 医疗知识文档生成结果:
   - 状态：全部成功
   - 成功生成：5 份
   - 生成失败：0 份

   📄 生成的文档：
      1. 2 型糖尿病诊疗指南
      2. 高血压急症诊治指南
      3. 社区获得性肺炎诊疗规范
      4. 急性心肌梗死急诊 PCI 治疗指南
      5. 脑卒中早期康复诊疗指南
============================================================
```

## 注意事项

### API 调用
- MIMO API 调用需要稳定的网络连接
- 联网模式会消耗更多 token
- 建议设置合理的请求间隔，避免触发限流

### 数据质量
- 患者数据由 AI 生成，可能存在不合理之处
- 医疗文档应人工审核后再使用
- 生成的数据仅供测试和研究使用

### 存储
- 患者数据存储在 PostgreSQL 数据库
- 医疗文档存储在 `knowledge_base` 目录
- 向量数据存储在 `vector_store` 表

## 故障排除

### 常见问题

1. **API 调用失败**
   - 检查 `.env` 中的 MIMO_API_KEY 是否正确
   - 检查网络连接
   - 查看错误日志

2. **JSON 解析失败**
   - LLM 返回的格式可能不完美
   - 代码已包含多种解析策略
   - 可以调整提示词或温度参数

3. **数据库连接失败**
   - 确保 PostgreSQL 服务运行
   - 检查 `DATABASE_URL` 配置
   - 运行 `npx prisma generate`

### 调试技巧

```bash
# 启用详细日志
export DEBUG=true
node scripts/dataGenerator.js patient

# 只生成少量数据测试
# 修改代码中的 batchSize 参数
```

## 扩展功能

### 添加新的生成主题

编辑 `medicalKnowledgeGenerator.js` 中的 `getRecommendedTopics()` 方法：

```javascript
getRecommendedTopics() {
  return [
    // ... 现有主题
    "你的新主题"
  ];
}
```

### 自定义患者数据

修改 `patientDataGenerator.js` 中的提示词，可以调整：
- 生成的患者数量
- 数据字段
- 疾病类型分布
- 年龄范围等

## 更新日志

- 2026-03-25: 初始版本，支持患者数据和医疗知识文档生成
- 使用小米 MIMO 大模型，支持联网搜索

## 技术支持

如有问题，请查看：
- MIMO 官方文档：https://api.xiaomimimo.com
- 项目 README.md
