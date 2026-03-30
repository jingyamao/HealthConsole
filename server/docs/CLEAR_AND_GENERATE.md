# 数据清空与生成说明

## 📋 重要说明

### 关于向量化的自动处理

**是的，数据生成完毕后会自动调用向量化工具！**

#### 患者数据向量化
- ✅ **自动生成**：在 `patientDataGenerator.js` 中的 `generatePatientVector()` 方法会自动调用
- ✅ **调用时机**：每个患者数据入库成功后立即调用
- ✅ **存储位置**：`vector_store` 表
- ✅ **内容包含**：患者基本信息、既往病史、当前症状、诊断记录等摘要

#### 医疗文档向量化
- ✅ **自动生成**：在 `medicalKnowledgeGenerator.js` 中的 `generateDocumentVector()` 方法会自动调用
- ✅ **调用时机**：每份医疗文档存入数据库后立即调用
- ✅ **存储位置**：`vector_store` 表
- ✅ **内容包含**：文档完整内容、标题、分类、标签等

**无需手动调用向量化工具！**

---

## 🗑️ 清空患者数据

### 方法一：使用专用清空脚本（推荐）

```bash
node scripts/clearPatientData.js
```

**功能：**
- ✅ 按照依赖关系顺序删除所有 10 个患者相关表的数据
- ✅ 显示每个表删除的记录数
- ✅ 显示总计删除记录数
- ✅ 安全的删除顺序（从外键表到主表）

**删除的表：**
1. vector_store (向量数据)
2. progress_notes (病程记录)
3. financial_info (费用信息)
4. medical_team (医疗团队)
5. medical_history (既往病史)
6. current_symptoms (当前症状)
7. physical_examination (体格检查)
8. examination_results (检查结果)
9. diagnoses (诊断记录)
10. treatment_plans (治疗方案)
11. patients (患者基本信息)

**输出示例：**
```
🗑️  开始清空患者相关数据...

1️⃣  删除向量数据 (vector_store)...
   ✅ 已删除 104 条向量记录

2️⃣  删除病程记录 (progress_notes)...
   ✅ 已删除 0 条病程记录

...

1️⃣1️⃣  删除患者基本信息 (patients)...
   ✅ 已删除 100 条患者记录

════════════════════════════════════════════════════════════
✅ 数据清空完成！
════════════════════════════════════════════════════════════
📊 总计删除：1162 条记录
```

### 方法二：使用生成脚本的 --clear 参数

```bash
# 生成患者数据前先清空
node scripts/dataGenerator.js patient --clear

# 全量生成前先清空
node scripts/dataGenerator.js all --clear
```

---

## 📊 数据库表结构

### 10 个患者相关表

| 序号 | 表名 | 说明 | 每患者记录数 |
|------|------|------|-------------|
| 1 | patients | 患者基本信息 | 1 |
| 2 | medical_history | 既往病史 | 1-3 |
| 3 | current_symptoms | 当前症状 | 1-2 |
| 4 | physical_examination | 体格检查 | 1-2 |
| 5 | examination_results | 检查结果 | 1 |
| 6 | diagnoses | 诊断记录 | 1-3 |
| 7 | treatment_plans | 治疗方案 | 1-2 |
| 8 | **progress_notes** | **病程记录** | 2-4 |
| 9 | **financial_info** | **费用信息** | 1 |
| 10 | **medical_team** | **医疗团队** | 1 |

### 向量化相关表

| 表名 | 说明 | 自动向量化 |
|------|------|-----------|
| vector_store | 向量存储表 | ✅ 是 |
| knowledge_documents | 知识文档表 | ✅ 是 |

---

## 🚀 完整使用流程

### 场景 1：全新开始（推荐）

```bash
# 1. 清空现有数据
node scripts/clearPatientData.js

# 2. 生成患者数据（100 个）
node scripts/dataGenerator.js patient

# 3. 生成医疗知识文档（5 份）
node scripts/dataGenerator.js knowledge
```

### 场景 2：只生成患者数据

```bash
# 直接生成（不清空）
node scripts/dataGenerator.js patient

# 或先清空再生成
node scripts/dataGenerator.js patient --clear
```

### 场景 3：只生成医疗文档

```bash
# 生成 5 份默认主题
node scripts/dataGenerator.js knowledge

# 生成指定数量
node scripts/dataGenerator.js knowledge 10

# 生成指定主题
node scripts/dataGenerator.js topic "2 型糖尿病诊疗指南"
```

### 场景 4：全量生成

```bash
# 生成患者数据 + 医疗文档
node scripts/dataGenerator.js all

# 全量生成前清空患者数据
node scripts/dataGenerator.js all --clear
```

---

## ✅ 验证向量化

### 方法 1：查看数据库

```sql
-- 查看向量数据总数
SELECT COUNT(*) FROM vector_store;

-- 查看患者向量
SELECT * FROM vector_store WHERE source_type = 'patient';

-- 查看知识文档向量
SELECT * FROM vector_store WHERE source_type = 'knowledge';
```

### 方法 2：查看控制台输出

生成患者数据时，会看到：
```
✅ [1/100] 患者 张三 数据入库成功
🔍 患者 张三 向量化完成
✅ [2/100] 患者 李四 数据入库成功
🔍 患者 李四 向量化完成
...
```

生成医疗文档时，会看到：
```
💾 文档已保存：/path/to/knowledge_base/2 型糖尿病诊疗指南.txt
📄 文档 "2 型糖尿病诊疗指南" 已存入数据库
🔍 文档 "2 型糖尿病诊疗指南" 向量化完成
```

---

## 📝 代码实现细节

### 患者数据向量化实现

位置：`patientDataGenerator.js` 第 547-571 行

```javascript
async generatePatientVector(patient, rawData) {
  try {
    const patientSummary = `
患者基本信息：
姓名：${patient.name}，性别：${patient.gender}，年龄：${patient.age}岁
出生日期：${patient.dateOfBirth}
住址：${patient.address}
血型：${patient.bloodType}，职业：${patient.occupation}
婚姻状况：${patient.maritalStatus}，教育程度：${patient.education}

既往病史：
${rawData.medical_histories?.map(h => `- ${h.type}: ${JSON.stringify(h.details)}`).join('\n') || '无'}

当前症状：
${rawData.current_symptoms?.map(s => `- ${s.main_complaint}: ${s.duration}, ${s.severity}`).join('\n') || '无'}

诊断记录：
${rawData.diagnoses?.map(d => `- ${d.diagnosis_name} (${d.type})`).join('\n') || '无'}
    `;

    await vectorService.storePatientVector({
      patientId: patient.id,
      content: patientSummary,
      title: `${patient.name}的医疗档案`,
      category: '患者档案',
      metadata: {
        age: patient.age,
        gender: patient.gender,
        bloodType: patient.bloodType,
        occupation: patient.occupation,
        generated_by: "MIMO_LLM"
      }
    });

    console.log(`🔍 患者 ${patient.name} 向量化完成`);
  } catch (error) {
    console.error(`❌ 患者 ${patient.name} 向量化失败:`, error);
  }
}
```

### 医疗文档向量化实现

位置：`medicalKnowledgeGenerator.js` 第 216-232 行

```javascript
async generateDocumentVector(document, documentId) {
  try {
    await vectorService.storeKnowledgeVector({
      documentId: documentId.toString(),
      content: document.content,
      title: document.metadata.title,
      metadata: {
        category: document.metadata.category,
        tags: document.metadata.tags,
        source: document.metadata.source,
        generated_by: "MIMO_LLM_WebSearch"
      }
    });

    console.log(`🔍 文档 "${document.metadata.title}" 向量化完成`);
  } catch (error) {
    console.error(`❌ 文档向量化失败：${document.metadata.title}`, error);
  }
}
```

---

## ⚠️ 注意事项

### 清空数据
- ⚠️ 清空操作不可恢复，请谨慎操作
- ✅ 建议先备份重要数据
- ✅ 清空后需要重新生成数据

### 向量化
- ✅ 自动生成，无需手动调用
- ✅ 失败不影响主数据存储
- ✅ 每个患者/文档都会尝试向量化
- ⚠️ 向量化需要 embeddings API 支持

### 数据完整性
- ✅ 10 个患者相关表全部生成
- ✅ 外键关系正确处理
- ✅ 数据一致性保证

---

## 📊 统计信息

### 每次生成的数据量（100 个患者）

| 表名 | 最少记录 | 最多记录 | 预计记录 |
|------|---------|---------|---------|
| patients | 100 | 100 | 100 |
| medical_history | 100 | 300 | 200 |
| current_symptoms | 100 | 200 | 150 |
| physical_examination | 100 | 200 | 150 |
| examination_results | 100 | 100 | 100 |
| diagnoses | 100 | 300 | 200 |
| treatment_plans | 100 | 200 | 150 |
| progress_notes | 200 | 400 | 300 |
| financial_info | 100 | 100 | 100 |
| medical_team | 100 | 100 | 100 |
| vector_store | 100 | 100 | 100 |
| **总计** | **1200** | **2200** | **~1650** |

### 每次生成的数据量（5 份医疗文档）

| 项目 | 数量 |
|------|------|
| knowledge_documents | 5 |
| vector_store | 5 |
| 文件存储 | 5 个.txt 文件 |

---

## 🎯 总结

**问题回答：**

> **当前患者和医疗文档数据生成完毕后是否会自动调用向量化工具存储到向量表中？**

**答案：是的，会自动调用！**

1. **患者数据**：每个患者入库成功后，立即调用 `generatePatientVector()` 方法
2. **医疗文档**：每个文档入库成功后，立即调用 `generateDocumentVector()` 方法
3. **无需手动操作**：所有向量化操作都是自动的
4. **失败不阻塞**：向量化失败不影响主数据存储

**使用建议：**

```bash
# 完整流程
node scripts/clearPatientData.js                    # 清空数据
node scripts/dataGenerator.js patient               # 生成 100 个患者（自动向量化）
node scripts/dataGenerator.js knowledge             # 生成 5 份文档（自动向量化）

# 或一键完成
node scripts/dataGenerator.js all --clear           # 清空 + 全量生成（全部自动向量化）
```

---

**技术支持** - HealthConsole Project
**更新时间** - 2026-03-25
