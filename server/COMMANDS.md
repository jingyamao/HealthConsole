# 数据生成工具命令手册

## 📋 概述

本项目使用小米 MIMO 大模型生成医疗数据，包括患者数据和医疗知识文档。

---

## 🏥 患者数据生成

### 基本命令

```bash
# 生成 5 个患者数据
node scripts/dataGenerator.js patient

# 生成前先清空现有数据
node scripts/dataGenerator.js patient --clear
```

**说明：**
- 每次生成 5 个患者
- 每个患者包含完整的医疗记录（10 个表）
- 生成模式：每次调用大模型生成 1 个患者，立即存储到数据库
- 自动向量化

**数据结构：**
- 患者基本信息
- 既往病史
- 当前症状
- 体格检查
- 检查结果
- 诊断记录
- 治疗方案
- 病程记录
- 费用信息
- 医疗团队

---

## 📚 医疗知识文档生成

### 基本命令

```bash
# 生成 1 个医疗知识文档（默认主题）
node scripts/dataGenerator.js knowledge

# 生成指定主题的文档
node scripts/dataGenerator.js topic "2 型糖尿病诊疗指南"
```

**说明：**
- 每次生成 1 个文档
- 使用联网模式搜索最新医学文献
- 文档存储：`knowledge_base/文档标题.txt`
- 参考文献：追加到 `knowledge_base/sources/references.txt`
- 自动存储到数据库并生成向量

**输出位置：**
- 文档原文：`knowledge_base/` 目录
- 参考文献：`knowledge_base/sources/references.txt`

---

## 🔄 全量生成

### 同时生成患者数据和医疗文档

```bash
# 生成 5 个患者 + 1 份医疗文档
node scripts/dataGenerator.js all

# 清空患者数据后全量生成
node scripts/dataGenerator.js all --clear
```

---

## 🗑️ 清空数据

### 清空所有患者相关数据

```bash
node scripts/clearPatientData.js
```

**说明：**
- 清空 10 个患者相关表的数据
- 显示每个表删除的记录数
- 安全的删除顺序（避免外键冲突）

---

## 📖 帮助和主题列表

### 查看帮助信息

```bash
node scripts/dataGenerator.js help
```

### 查看推荐的文档主题

```bash
node scripts/dataGenerator.js list
```

**推荐主题包括：**
- 心血管疾病（高血压、冠心病等）
- 内分泌疾病（糖尿病、甲状腺疾病等）
- 呼吸系统（哮喘、慢阻肺等）
- 消化系统（胃炎、肝硬化等）
- 神经系统（卒中、癫痫等）

---

## 🧪 测试命令

### 测试 MIMO 服务

```bash
node scripts/testMIMO.js
```

**说明：**
- 检查 MIMO API 配置
- 测试普通对话（不联网）
- 测试联网搜索
- 显示可用模型

---

## 📊 命令速查表

| 命令 | 功能 | 说明 |
|------|------|------|
| `patient` | 生成 5 个患者 | 默认数量 |
| `patient --clear` | 清空后生成 5 个患者 | 推荐用法 |
| `knowledge` | 生成 1 份医疗文档 | 默认主题 |
| `knowledge <数量>` | 生成指定数量文档 | 从推荐列表选择 |
| `topic "主题"` | 生成指定主题文档 | 如"糖尿病" |
| `all` | 生成患者 + 医疗文档 | 全量生成 |
| `all --clear` | 清空后全量生成 | 一键搞定 |
| `clearPatientData.js` | 清空所有患者数据 | 显示统计 |
| `list` | 查看推荐主题 | 25+ 个主题 |
| `help` | 显示帮助信息 | 使用说明 |
| `testMIMO.js` | 测试 MIMO 服务 | 检查配置 |

---

## 💡 常用场景

### 场景 1：快速测试

```bash
# 清空数据
node scripts/clearPatientData.js

# 生成 5 个患者
node scripts/dataGenerator.js patient

# 生成 1 份医疗文档
node scripts/dataGenerator.js knowledge
```

### 场景 2：一键全量

```bash
node scripts/dataGenerator.js all --clear
```

### 场景 3：生成指定主题的文档

```bash
node scripts/dataGenerator.js topic "2 型糖尿病诊疗指南"
```

---

## ⚙️ 配置说明

### 修改默认生成数量

**患者数据：**
- 文件：`services/langchain/tools/generators/patientDataGenerator.js`
- 位置：第 360 行
- 修改：`async generateAndStore(count = 5)` 中的 `5`

**医疗文档：**
- 文件：`services/langchain/tools/generators/medicalKnowledgeGenerator.js`
- 位置：第 17 行
- 修改：`this.defaultCount = 1` 中的 `1`

### 修改 API 调用延迟

**患者数据：**
- 文件：`services/langchain/tools/generators/patientDataGenerator.js`
- 位置：第 384 行
- 修改：`setTimeout(resolve, 1000)` 中的 `1000`（毫秒）

---

## ⚠️ 注意事项

1. **API 密钥**：确保 `.env` 文件中配置了 `MIMO_API_KEY`
2. **网络连接**：医疗文档生成需要联网搜索
3. **数据库**：确保 PostgreSQL 服务正常运行
4. **向量化**：文档太长时向量化可能失败（不影响存储）
5. **清空数据**：清空操作不可恢复，请谨慎操作

---

## 📁 文件结构

```
server/
├── scripts/
│   ├── dataGenerator.js          # 统一调用脚本
│   ├── clearPatientData.js       # 清空数据脚本
│   └── testMIMO.js               # 测试脚本
├── services/langchain/
│   ├── core/
│   │   └── mimoLLM.js            # MIMO 服务
│   └── tools/generators/
│       ├── patientDataGenerator.js    # 患者数据生成器
│       └── medicalKnowledgeGenerator.js  # 医疗文档生成器
└── knowledge_base/
    ├── sources/
    │   └── references.txt        # 参考文献来源
    └── *.txt                     # 医疗文档
```

---

## 🎯 快速开始

```bash
# 1. 测试服务
node scripts/testMIMO.js

# 2. 生成数据
node scripts/dataGenerator.js patient
node scripts/dataGenerator.js knowledge

# 或一键完成
node scripts/dataGenerator.js all --clear
```

---

**最后更新**：2026-03-25  
**项目**：HealthConsole - 基于小米 MIMO 大模型的医疗数据生成系统
