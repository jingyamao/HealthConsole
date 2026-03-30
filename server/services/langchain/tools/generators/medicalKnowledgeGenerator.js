import mimoService from "../../core/mimoLLM.js";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../../../../generated/prisma/index.js";
import VectorService from "../../core/vectorStore.js";

const prisma = new PrismaClient();
const vectorService = new VectorService();

/**
 * 医疗知识文档生成器 - 使用小米 MIMO 大模型（联网模式）生成权威医疗文档
 */
class MedicalKnowledgeGenerator {
  constructor() {
    this.knowledgeBaseDir = path.join(process.cwd(), 'knowledge_base');
    this.sourcesDir = path.join(this.knowledgeBaseDir, 'sources');
    this.sourcesFile = path.join(this.sourcesDir, 'references.txt');
    this.defaultCount = 1; // 默认生成 1 个文档
  }

  /**
   * 确保知识库目录存在
   */
  ensureKnowledgeBaseDir() {
    if (!fs.existsSync(this.knowledgeBaseDir)) {
      fs.mkdirSync(this.knowledgeBaseDir, { recursive: true });
      console.log(`📁 创建知识库目录：${this.knowledgeBaseDir}`);
    }
    
    if (!fs.existsSync(this.sourcesDir)) {
      fs.mkdirSync(this.sourcesDir, { recursive: true });
      console.log(`📁 创建来源文件目录：${this.sourcesDir}`);
    }
    
    // 初始化来源文件（如果不存在）
    if (!fs.existsSync(this.sourcesFile)) {
      fs.writeFileSync(this.sourcesFile, '# 医疗知识文档参考文献来源\n\n', 'utf-8');
      console.log(`📄 创建来源文件：${this.sourcesFile}`);
    }
  }

  /**
   * 生成医疗知识文档的提示词模板（联网搜索）
   * @param {string} topic - 文档主题
   * @returns {string} 提示词
   */
  getKnowledgeGenerationPrompt(topic) {
    return `你是一名专业的医学专家，正在编写权威、详细的医疗知识文档。

## 任务要求：
请搜索最新的医学指南、权威文献和临床实践，围绕主题"${topic}"编写一份专业医疗文档。

## 文档要求：

### 1. 内容质量
- **权威性**: 基于最新的医学指南、共识和高质量研究
- **准确性**: 医学术语准确，数据可靠
- **实用性**: 对临床实践有指导意义
- **时效性**: 优先参考近 3-5 年的文献和指南
- **详细性**: 内容充实，不少于 2000 字

### 2. 文档结构
请按照以下结构组织内容（可根据主题适当调整）：

文档标题格式示例：
# [文档标题]

## 概述
- 定义和背景介绍
- 流行病学数据
- 疾病负担

## 病因和发病机制
- 主要病因
- 危险因素
- 病理生理机制

## 临床表现
- 症状和体征
- 临床分型/分期
- 并发症

## 诊断与鉴别诊断
- 诊断标准（引用权威指南）
- 辅助检查
- 鉴别诊断要点

## 治疗方案
- 治疗原则
- 药物治疗（具体药物、剂量、用法）
- 非药物治疗
- 最新治疗进展

## 预后与康复
- 预后评估
- 康复指导
- 随访管理

## 预防策略
- 一级预防
- 二级预防
- 高危人群管理

## 参考文献
- 列出主要参考的指南和文献

### 3. 格式要求（重要！）
- **不要使用 Markdown 格式**（不要用 #、*、- 等符号）
- 使用纯文本格式，标题用中文数字表示（如"一、概述"、"二、病因"）
- 列表使用阿拉伯数字（如"1. "、"2. "）
- 医学术语规范
- 药物名称使用通用名
- 段落之间用空行分隔

### 4. 来源标注
在文档末尾，请标注：
- 来源：中华医学会/国家卫健委/权威医学组织等
- 版本号：v1.0
- 日期：当前日期

## 输出格式：
请直接输出文档内容（Markdown 格式），不要添加任何额外说明。

## 主题：${topic}

现在开始编写：`;
  }

  /**
   * 获取文档元数据的提示词
   * @param {string} content - 文档内容
   * @returns {string} 提示词
   */
  getMetadataExtractionPrompt(content) {
    return `请分析以下医疗文档，提取元数据信息。

文档内容（前 1000 字）：
${content.substring(0, 1000)}...

请以 JSON 格式返回以下信息：
{
  "title": "文档标题",
  "category": "文档分类（从以下选择：心血管疾病、内分泌疾病、呼吸系统、消化系统、神经系统、泌尿系统、血液系统、风湿免疫、感染性疾病、肿瘤、症状鉴别、中医诊疗、急诊医学、康复医学、预防医学、其他）",
  "tags": ["标签 1", "标签 2", "标签 3"], // 3-5 个关键词
  "source": "来源机构（如：中华医学会、国家卫健委等）",
  "publishDate": "发布日期（YYYY-MM-DD 格式，如果文档中没有明确日期，根据内容推断一个合理的过去日期）"
}

只输出 JSON，不要其他内容：`;
  }

  /**
   * 提取参考文献的提示词
   * @param {string} content - 文档内容
   * @returns {string} 提示词
   */
  getReferencesExtractionPrompt(content) {
    return `请从以下医疗文档中提取参考文献部分。

文档内容：
${content}

请提取文档末尾的"参考文献"部分的所有内容，按照学术论文格式整理。
如果文档中没有明确的参考文献，请根据文档内容推断可能参考的权威指南和文献。

输出格式要求：
1. 每条参考文献独立一行
2. 按照学术论文引用格式（如：作者。标题。期刊，年份，卷 (期): 页码）
3. 如果是指南或共识，格式为：发布机构。指南名称。发布年份

只输出参考文献列表，不要其他内容：`;
  }

  /**
   * 提取参考文献
   * @param {string} content - 文档内容
   * @returns {Promise<string>} 参考文献内容
   */
  async extractReferences(content) {
    try {
      const response = await mimoService.chat([
        {
          role: "user",
          content: this.getReferencesExtractionPrompt(content)
        }
      ], {
        maxTokens: 2048,
        temperature: 0.3
      });

      if (response.success) {
        return response.data.content.trim();
      }
    } catch (error) {
      console.error("提取参考文献失败:", error);
    }
    
    // 如果提取失败，返回默认值
    return "暂无明确参考文献";
  }

  /**
   * 生成单个医疗文档
   * @param {string} topic - 文档主题
   * @returns {Promise<Object>} 生成结果
   */
  async generateDocument(topic) {
    console.log(`\n📚 正在生成文档：${topic}`);
    
    try {
      // 使用联网模式生成文档
      console.log("🔍 正在搜索最新医学文献...");
      const response = await mimoService.chatWithWebSearch(
        [
          {
            role: "user",
            content: this.getKnowledgeGenerationPrompt(topic)
          }
        ],
        {
          maxTokens: 8192,
          temperature: 0.7
        },
        {
          maxKeyword: 5,
          forceSearch: true,
          limit: 10,
          country: "China",
          region: "Beijing",
          city: "Beijing"
        }
      );

      if (!response.success) {
        throw new Error(`MIMO API 调用失败：${response.error.message}`);
      }

      const content = response.data.content;
      console.log("✅ 文档内容生成成功");

      // 提取元数据
      console.log("🏷️  正在提取文档元数据...");
      const metadataResponse = await mimoService.chat([
        {
          role: "user",
          content: this.getMetadataExtractionPrompt(content)
        }
      ], {
        maxTokens: 1024,
        temperature: 0.3
      });

      let metadata = {};
      if (metadataResponse.success) {
        try {
          const jsonMatch = metadataResponse.data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            metadata = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("解析元数据失败，使用默认值");
        }
      }

      // 设置默认值
      const defaultMetadata = {
        title: topic,
        category: "医学指南",
        tags: [topic, "医学知识", "诊疗指南"],
        source: "医学文献",
        publishDate: new Date().toISOString().split('T')[0]
      };

      metadata = { ...defaultMetadata, ...metadata };

      // 提取参考文献
      console.log("📚 正在提取参考文献...");
      const references = await this.extractReferences(content);
      console.log("✅ 参考文献提取完成");

      return {
        success: true,
        content: content,
        metadata: metadata,
        topic: topic,
        references: references
      };

    } catch (error) {
      console.error(`❌ 生成文档"${topic}"失败:`, error);
      return {
        success: false,
        error: error.message,
        topic: topic
      };
    }
  }

  /**
   * 保存文档到文件系统
   * @param {Object} document - 文档对象
   * @returns {string} 保存的文件路径
   */
  saveDocumentToFile(document) {
    this.ensureKnowledgeBaseDir();
    
    const fileName = `${document.metadata.title}.txt`;
    const filePath = path.join(this.knowledgeBaseDir, fileName);
    
    // 写入文档内容
    fs.writeFileSync(filePath, document.content, 'utf-8');
    
    console.log(`💾 文档已保存：${filePath}`);
    return filePath;
  }

  /**
   * 保存文档来源到统一的来源文件（追加模式）
   * @param {Object} document - 文档对象
   * @param {string} references - 参考文献内容
   */
  appendDocumentSources(document, references) {
    this.ensureKnowledgeBaseDir();
    
    const timestamp = new Date().toISOString();
    const sourceEntry = `
## ${document.metadata.title}
- **生成时间**: ${timestamp}
- **来源机构**: ${document.metadata.source}
- **分类**: ${document.metadata.category}
- **标签**: ${document.metadata.tags.join(', ')}
- **参考文献**:
${references.split('\n').map(line => `  ${line}`).join('\n')}

---

`;
    
    // 追加到来源文件
    fs.appendFileSync(this.sourcesFile, sourceEntry, 'utf-8');
    
    console.log(`📝 来源已追加到：${this.sourcesFile}`);
  }

  /**
   * 存储文档到数据库
   * @param {Object} document - 文档对象
   * @returns {Promise<Object>} 数据库记录
   */
  async storeDocumentToDB(document) {
    try {
      const doc = await prisma.knowledgeDocument.create({
        data: {
          title: document.metadata.title,
          content: document.content,
          source: document.metadata.source,
          version: 'v1.0',
          tags: document.metadata.tags,
          category: document.metadata.category,
          publishDate: new Date(document.metadata.publishDate),
          metadata: {
            generated_by: "MIMO_LLM_WebSearch",
            generated_at: new Date().toISOString(),
            topic: document.topic
          },
          isActive: true
        }
      });

      console.log(`📄 文档 "${document.metadata.title}" 已存入数据库`);
      return doc;
    } catch (error) {
      console.error(`❌ 存储文档到数据库失败：${document.metadata.title}`, error);
      throw error;
    }
  }

  /**
   * 生成文档向量
   * @param {Object} document - 文档对象
   * @param {number} documentId - 数据库文档 ID
   */
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

  /**
   * 生成单个医疗文档
   * @param {string} topic - 主题
   * @returns {Promise<Object>} 生成结果
   */
  async generateSingle(topic) {
    console.log(`\n🚀 开始生成 1 份医疗知识文档（联网模式）`);
    console.log(`📋 生成模式：生成一个，存储一个（实时入库）\n`);
    
    try {
      // 生成文档
      console.log(`📚 正在生成文档：${topic}`);
      const document = await this.generateDocument(topic);
      
      if (!document.success) {
        throw new Error(document.error);
      }

      // 保存到文件（knowledge_base 目录）
      const filePath = this.saveDocumentToFile(document);

      // 保存来源到统一文件（knowledge_base/sources/references.txt）
      console.log("📝 正在保存参考文献来源...");
      this.appendDocumentSources(document, document.references);

      // 存储到数据库
      const dbDoc = await this.storeDocumentToDB(document);

      // 生成向量
      await this.generateDocumentVector(document, dbDoc.id);

      console.log("\n" + "=".repeat(60));
      console.log("✅ 文档生成完成！");
      console.log("=".repeat(60));
      console.log(`📄 文档标题：${document.metadata.title}`);
      console.log(`📂 文档路径：${filePath}`);
      console.log(`📚 来源文件：${this.sourcesFile}`);
      console.log(`💾 数据库 ID: ${dbDoc.id}`);
      console.log("=".repeat(60));

      return {
        success: true,
        count: 1,
        documents: [{
          topic: topic,
          title: document.metadata.title,
          id: dbDoc.id,
          filePath: filePath
        }]
      };

    } catch (error) {
      console.error(`❌ 生成文档失败:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量生成医疗文档
   * @param {number} count - 生成数量
   * @param {Array<string>} customTopics - 自定义主题列表
   * @returns {Promise<Object>} 生成结果
   */
  async generateBatch(count = 1, customTopics = null) {
    // 如果没有指定主题，使用默认主题列表
    const defaultTopics = this.getRecommendedTopics();
    const topicsToUse = customTopics && customTopics.length > 0 
      ? customTopics 
      : defaultTopics;
    
    // 限制生成数量不超过可用主题数
    const actualCount = Math.min(count, topicsToUse.length);
    
    console.log(`📋 计划生成：${actualCount} 份文档`);
    console.log(`📚 可用主题数：${topicsToUse.length}`);
    console.log('');
    
    const allResults = {
      success: 0,
      failed: 0,
      documents: [],
      errors: []
    };
    
    // 循环生成指定数量的文档
    for (let i = 0; i < actualCount; i++) {
      const topic = topicsToUse[i];
      console.log(`\n[文档 ${i + 1}/${actualCount}] 主题：${topic}`);
      
      try {
        const result = await this.generateSingle(topic);
        
        if (result.success) {
          allResults.success++;
          allResults.documents.push(...result.documents);
        } else {
          allResults.failed++;
          allResults.errors.push({
            topic: topic,
            error: result.error
          });
        }
        
        // 添加延迟，避免 API 调用过快
        if (i < actualCount - 1) {
          console.log('⏳ 等待 3 秒后继续...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        allResults.failed++;
        allResults.errors.push({
          topic: topic,
          error: error.message
        });
        console.error(`❌ "${topic}" 生成失败:`, error);
      }
    }
    
    return {
      success: allResults.success > 0,
      count: allResults.success,
      failed: allResults.failed,
      documents: allResults.documents,
      errors: allResults.errors
    };
  }

  /**
   * 获取推荐的文档主题列表
   * @returns {Array<string>} 主题列表
   */
  getRecommendedTopics() {
    return [
      // 心血管疾病
      "冠心病介入治疗指南",
      "心力衰竭药物治疗指南",
      "心房颤动抗凝治疗专家共识",
      "血脂异常防治指南",
      
      // 内分泌疾病
      "2 型糖尿病防治指南",
      "甲状腺结节诊疗指南",
      "骨质疏松症诊疗指南",
      "痛风及高尿酸血症诊疗指南",
      
      // 呼吸系统
      "支气管哮喘防治指南",
      "慢性阻塞性肺疾病诊治指南",
      "肺栓塞诊治指南",
      "间质性肺疾病诊疗指南",
      
      // 消化系统
      "胃食管反流病诊疗指南",
      "炎症性肠病诊断与治疗共识",
      "肝硬化诊治指南",
      "幽门螺杆菌感染处理共识",
      
      // 神经系统
      "缺血性卒中早期诊治指南",
      "癫痫临床诊疗指南",
      "帕金森病诊断和治疗指南",
      "阿尔茨海默病诊疗指南",
      
      // 其他重要疾病
      "类风湿关节炎诊疗指南",
      "系统性红斑狼疮诊疗指南",
      "慢性肾脏病诊疗指南",
      "恶性肿瘤疼痛治疗指南",
      "抗菌药物临床应用指导原则"
    ];
  }
}

// 创建单例实例
const medicalKnowledgeGenerator = new MedicalKnowledgeGenerator();

export default medicalKnowledgeGenerator;
export { MedicalKnowledgeGenerator };
