# 🚀 快速使用指南

## ⚡ 一行命令搞定

### 清空 + 生成全部数据
```bash
node scripts/dataGenerator.js all --clear
```

### 只生成患者数据（100 个）
```bash
node scripts/dataGenerator.js patient
```

### 只生成医疗文档（5 份）
```bash
node scripts/dataGenerator.js knowledge
```

---

## 📋 常用命令

| 命令 | 功能 | 说明 |
|------|------|------|
| `node scripts/clearPatientData.js` | 清空所有患者数据 | 显示详细统计 |
| `node scripts/dataGenerator.js patient` | 生成 100 个患者 | 包含 10 个表 |
| `node scripts/dataGenerator.js patient --clear` | 清空后生成患者 | 推荐用法 |
| `node scripts/dataGenerator.js knowledge` | 生成 5 份医疗文档 | 联网搜索 |
| `node scripts/dataGenerator.js knowledge 10` | 生成 10 份文档 | 可指定数量 |
| `node scripts/dataGenerator.js topic "主题"` | 生成指定主题 | 如"糖尿病" |
| `node scripts/dataGenerator.js all --clear` | 全量生成 | 一键搞定 |
| `node scripts/dataGenerator.js list` | 查看推荐主题 | 25+ 个主题 |
| `node scripts/testMIMO.js` | 测试 MIMO 服务 | 检查配置 |

---

## ✅ 自动生成向量

**问题：** 生成后需要手动调用向量化吗？

**答案：** ❌ 不需要！✅ 自动生成！

- 患者数据入库 → 自动向量化
- 医疗文档入库 → 自动向量化
- 全部自动，无需手动操作

---

## 📊 数据规模

### 每次生成 100 个患者
- **患者基本信息**：100 条
- **病程记录**：~300 条
- **费用信息**：100 条
- **医疗团队**：100 条
- **其他表**：~950 条
- **向量数据**：100 条
- **总计**：~1650 条记录

### 每次生成 5 份医疗文档
- **知识文档**：5 份
- **向量数据**：5 条
- **文件存储**：5 个.txt

---

## 🗂️ 10 个患者相关表

1. ✅ patients - 患者基本信息
2. ✅ medical_history - 既往病史
3. ✅ current_symptoms - 当前症状
4. ✅ physical_examination - 体格检查
5. ✅ examination_results - 检查结果
6. ✅ diagnoses - 诊断记录
7. ✅ treatment_plans - 治疗方案
8. ✅ **progress_notes** - 病程记录（新增）
9. ✅ **financial_info** - 费用信息（新增）
10. ✅ **medical_team** - 医疗团队（新增）

---

## 📚 文档位置

- **主文档**：`MIMO_DATA_GENERATOR_README.md`
- **详细说明**：`docs/data-generator-readme.md`
- **清空说明**：`docs/CLEAR_AND_GENERATE.md`
- **更新总结**：`UPDATE_SUMMARY.md`

---

## 🎯 推荐流程

```bash
# 1. 测试 MIMO 服务（可选）
node scripts/testMIMO.js

# 2. 清空现有数据
node scripts/clearPatientData.js

# 3. 生成患者数据
node scripts/dataGenerator.js patient

# 4. 生成医疗文档
node scripts/dataGenerator.js knowledge

# 或一键完成
node scripts/dataGenerator.js all --clear
```

---

## ⚠️ 注意事项

- ⚠️ 清空数据不可恢复
- ✅ 向量化完全自动
- ✅ 失败不阻塞主流程
- ✅ 支持断点续生成

---

**最后更新**：2026-03-25
