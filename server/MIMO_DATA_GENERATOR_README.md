# MIMO 大模型数据生成工具

## 📋 概述

本项目新增了基于**小米 MIMO 大模型**的数据生成功能，用于生成更真实的患者医疗数据和权威医疗知识文档。

## 🎯 功能特性

### 1. 患者数据生成器
- ✅ **不联网模式**：快速生成，无需网络搜索
- ✅ **批量生成**：每次生成 100 个患者
- ✅ **完整数据**：包含病史、症状、检查、诊断、治疗方案等
- ✅ **自动向量化**：生成后自动创建向量数据
- ✅ **严格提示词**：确保数据格式规范、医学专业

### 2. 医疗知识文档生成器
- ✅ **联网模式**：搜索最新医学指南和文献
- ✅ **权威内容**：基于权威医学组织和指南
- ✅ **详细文档**：每份文档不少于 2000 字
- ✅ **自动存储**：保存到 knowledge_base 目录和数据库
- ✅ **自动生成向量**：支持 AI 检索和分析

## 📁 新增文件结构

```
server/
├── services/langchain/
│   ├── core/
│   │   └── mimoLLM.js                    # 小米 MIMO 大模型服务
│   └── tools/generators/
│       ├── patientDataGenerator.js       # 患者数据生成器
│       └── medicalKnowledgeGenerator.js  # 医疗知识文档生成器
├── scripts/
│   ├── dataGenerator.js                  # 统一调用脚本
│   └── testMIMO.js                       # MIMO 服务测试脚本
└── docs/
    └── data-generator-readme.md          # 详细使用文档
```

## 🚀 快速开始

### 环境准备

确保 `.env` 文件中配置了 MIMO API 密钥：

```bash
MIMO_API_KEY="sk-your-api-key-here"
```

### 基本用法

#### 1. 生成患者数据

```bash
# 生成 100 个患者数据
node scripts/dataGenerator.js patient

# 生成前先清空现有数据
node scripts/dataGenerator.js patient --clear
```

**输出示例：**
```
🏥 开始生成患者医疗数据
============================================================
🚀 开始生成 100 个患者医疗数据...
📡 正在调用 MIMO 大模型生成数据...
✅ 数据生成成功，正在解析...
📊 解析到 100 个患者数据
💾 开始存储患者数据到数据库...
✅ [1/100] 患者 张三 数据入库成功
...
✅ [100/100] 患者 王五 数据入库成功
🔍 患者 张三 向量化完成
...
============================================================
📊 存储统计:
   - 成功：100 人
   - 失败：0 人
```

#### 2. 生成医疗知识文档

```bash
# 生成 5 份默认主题的文档（联网）
node scripts/dataGenerator.js knowledge

# 生成 10 份文档
node scripts/dataGenerator.js knowledge 10

# 生成指定主题的文档
node scripts/dataGenerator.js topic "2 型糖尿病诊疗指南"
```

**输出示例：**
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
...
============================================================
```

#### 3. 查看推荐主题

```bash
node scripts/dataGenerator.js list
```

**推荐主题包括：**
- 心血管疾病（高血压、冠心病、心衰等）
- 内分泌疾病（糖尿病、甲状腺疾病等）
- 呼吸系统（哮喘、慢阻肺、肺炎等）
- 消化系统（胃炎、肝硬化、炎症性肠病等）
- 神经系统（卒中、癫痫、帕金森等）

#### 4. 全量生成

```bash
# 生成患者数据 + 医疗知识文档
node scripts/dataGenerator.js all

# 全量生成前清空患者数据
node scripts/dataGenerator.js all --clear
```

#### 5. 测试 MIMO 服务

```bash
# 测试 MIMO 服务是否正常工作
node scripts/testMIMO.js
```

## 💡 代码使用示例

### 在代码中调用生成器

```javascript
// 导入生成器
import patientDataGenerator from './services/langchain/tools/generators/patientDataGenerator.js';
import medicalKnowledgeGenerator from './services/langchain/tools/generators/medicalKnowledgeGenerator.js';

// 生成患者数据
const patientResult = await patientDataGenerator.generateAndStore(100);
console.log(`成功生成${patientResult.count}个患者数据`);

// 生成医疗文档
const topics = ['2 型糖尿病诊疗指南', '高血压诊治指南'];
const docResult = await medicalKnowledgeGenerator.generateBatch(topics);
console.log(`成功生成${docResult.success}份文档`);
```

### 使用 MIMO 服务

```javascript
import mimoService from './services/langchain/core/mimoLLM.js';

// 普通对话（不联网）
const response = await mimoService.send('请介绍高血压的预防措施', false);
console.log(response.data.content);

// 联网搜索
const webResponse = await mimoService.send(
  '请搜索 2025 年最新的高血压治疗指南', 
  true,
  {
    searchConfig: {
      maxKeyword: 5,
      forceSearch: true,
      limit: 10
    }
  }
);
console.log(webResponse.data.content);
```

## 📊 数据结构

### 患者数据包含

1. **基本信息**
   - 姓名、性别、年龄、出生日期
   - 身份证号、手机号、住址
   - 保险、血型、婚姻状况
   - 职业、教育程度

2. **既往病史**
   - 慢性疾病、手术史
   - 过敏史、家族史
   - 疫苗接种记录

3. **当前症状**
   - 主诉、症状详情
   - 持续时间、严重程度
   - 加重/缓解因素

4. **体格检查**
   - 生命体征（血压、心率、呼吸、体温）
   - 各系统检查（头颈、胸部、心血管、腹部等）

5. **检查结果**
   - 实验室检查（血常规、生化等）
   - 影像学检查（X 光、CT、MRI 等）
   - 特殊检查（心电图、内镜等）

6. **诊断记录**
   - ICD 编码、诊断名称
   - 诊断类型（主要/次要/鉴别）
   - 诊断日期、医生姓名

7. **治疗方案**
   - 药物治疗（药名、剂量、频率）
   - 手术治疗
   - 生活方式建议
   - 随访计划

### 医疗文档包含

- **标题**：文档名称
- **内容**：完整的 Markdown 格式文档
- **来源**：权威医学组织
- **分类**：心血管疾病、内分泌疾病等
- **标签**：3-5 个关键词
- **版本**：v1.0
- **发布日期**

## 🔧 配置选项

### MIMO 服务配置

```javascript
await mimoService.chat(messages, {
  model: "mimo-v2-pro",        // 模型名称
  maxTokens: 4096,             // 最大 token 数
  temperature: 0.7,            // 温度参数 (0-1)
  topP: 0.95,                  // Top-p 采样
  frequencyPenalty: 0,         // 频率惩罚
  presencePenalty: 0           // 存在惩罚
});
```

### 联网搜索配置

```javascript
await mimoService.chatWithWebSearch(messages, options, {
  maxKeyword: 3,               // 最大关键词数
  forceSearch: true,           // 强制搜索
  limit: 5,                    // 搜索结果数量
  country: "China",            // 国家
  region: "Beijing",           // 省份
  city: "Beijing"              // 城市
});
```

## ⚠️ 注意事项

### API 使用
- MIMO API 需要稳定的网络连接
- 联网模式消耗更多 token
- 建议设置合理的请求间隔

### 数据质量
- 患者数据由 AI 生成，应人工审核
- 医疗文档仅供参考，不应直接用于临床
- 生成的数据仅供测试和研究使用

### 存储
- 患者数据存储在 PostgreSQL 数据库
- 医疗文档存储在 `knowledge_base` 目录
- 向量数据存储在 `vector_store` 表

## 🐛 故障排除

### 常见问题

1. **API 调用失败**
   ```bash
   # 检查 API 密钥
   echo $MIMO_API_KEY
   
   # 测试服务
   node scripts/testMIMO.js
   ```

2. **JSON 解析失败**
   - 代码已包含多种解析策略
   - 可以调整温度参数（降低随机性）

3. **数据库连接失败**
   ```bash
   # 确保 PostgreSQL 运行
   # 检查 DATABASE_URL 配置
   # 生成 Prisma 客户端
   npx prisma generate
   ```

## 📚 相关文档

- 详细使用文档：`docs/data-generator-readme.md`
- MIMO 官方文档：https://api.xiaomimimo.com
- 项目主 README：`Readme.md`

## 📝 更新日志

### v1.0 - 2026-03-25
- ✅ 新增小米 MIMO 大模型服务
- ✅ 新增患者数据生成器（不联网）
- ✅ 新增医疗知识文档生成器（联网）
- ✅ 新增统一调用脚本
- ✅ 新增测试脚本
- ✅ 支持自动生成向量数据
- ✅ 支持批量生成（100 个患者/次，5 份文档/次）

## 🎓 技术亮点

1. **严格的提示词设计**
   - 详细的字段说明和示例
   - 严格的 JSON 格式要求
   - 医学专业性保证

2. **智能解析策略**
   - 多种 JSON 解析方式
   - 自动容错处理
   - 元数据自动提取

3. **完整的数据流程**
   - 数据生成 → 数据库存储 → 向量化
   - 一站式自动化
   - 错误处理和日志记录

4. **灵活的调用方式**
   - 命令行工具
   - 代码调用 API
   - 支持自定义配置

## 🤝 贡献指南

如需添加新的生成主题或改进功能，请参考现有代码结构，保持代码风格一致。

---

**开发团队** - HealthConsole Project
**技术支持** - 小米 MIMO 大模型
