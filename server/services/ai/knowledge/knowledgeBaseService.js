import VectorService from '../vector/vectorService.js';
import prisma from '../../../prisma/index.js';
import fs from 'fs/promises';
import path from 'path';

const vectorService = new VectorService();

class KnowledgeBaseService {
  constructor() {
    this.vectorService = vectorService;
  }

  /**
   * 从知识库目录加载文档并生成向量
   * @param {string} knowledgeBaseDir - 知识库目录路径
   */
  async loadKnowledgeDocuments(knowledgeBaseDir = '../../../knowledge_base') {
    try {
      const fullPath = path.resolve(new URL(import.meta.url).pathname, knowledgeBaseDir);
      const files = await fs.readdir(fullPath);
      
      console.log(`发现 ${files.length} 个知识库文档`);
      
      for (const file of files) {
        if (file.endsWith('.txt')) {
          console.log(`正在处理文档: ${file}`);
          
          const filePath = path.join(fullPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const title = file.replace('.txt', '');
          
          // 检查是否已存在相同的文档
          const existingDoc = await prisma.knowledgeDocument.findFirst({
            where: { title: title }
          });
          
          if (existingDoc) {
            console.log(`文档 "${title}" 已存在，跳过...`);
            continue;
          }
          
          // 创建知识文档记录
          const knowledgeDoc = await prisma.knowledgeDocument.create({
            data: {
              title: title,
              content: content,
              source: '知识库导入',
              version: 'v1.0',
              tags: this.extractTags(content),
              category: this.classifyDocument(title, content),
              publishDate: new Date(),
              metadata: {
                fileName: file,
                wordCount: content.length,
                importedAt: new Date().toISOString()
              },
              isActive: true
            }
          });
          
          console.log(`知识文档创建成功: ${knowledgeDoc.id} - ${title}`);
          
          // 生成并存储向量
          const vectorRecord = await this.vectorService.storeKnowledgeVector({
            documentId: knowledgeDoc.id,
            content: content,
            title: title,
            metadata: {
              documentId: knowledgeDoc.id,
              category: knowledgeDoc.category,
              source: knowledgeDoc.source,
              tags: knowledgeDoc.tags
            }
          });
          
          console.log(`向量记录创建成功: ${vectorRecord.id}`);
        }
      }
      
      console.log('知识库文档加载完成！');
    } catch (error) {
      console.error('加载知识库文档时出错:', error);
      throw error;
    }
  }

  /**
   * 从文本内容中提取标签
   * @param {string} content - 文档内容
   * @returns {string[]} - 提取的标签数组
   */
  extractTags(content) {
    const medicalKeywords = [
      '发热', '头痛', '胸痛', '呼吸困难', '腹痛', '水肿', '晕厥',
      '心肌梗死', '糖尿病', '高血压', '中医', '辨证论治',
      '诊断', '治疗', '指南', '并发症', '预防', '康复',
      '针灸', '中药', '生活方式', '危险因素', '药物治疗',
      '症状', '检查', '实验室', '影像学', '手术'
    ];
    
    const foundTags = [];
    medicalKeywords.forEach(keyword => {
      if (content.includes(keyword) && !foundTags.includes(keyword)) {
        foundTags.push(keyword);
      }
    });
    
    // 限制标签数量，最多5个
    return foundTags.slice(0, 5);
  }

  /**
   * 根据标题和内容分类文档
   * @param {string} title - 文档标题
   * @param {string} content - 文档内容
   * @returns {string} - 文档分类
   */
  classifyDocument(title, content) {
    if (title.includes('症状') || content.includes('症状')) return '症状鉴别';
    if (title.includes('心肌梗死') || content.includes('心肌梗死')) return '心血管疾病';
    if (title.includes('糖尿病') || content.includes('糖尿病')) return '内分泌疾病';
    if (title.includes('高血压') || content.includes('高血压')) return '心血管疾病';
    if (title.includes('中医') || content.includes('中医')) return '中医诊疗';
    if (title.includes('指南') || content.includes('指南')) return '临床指南';
    if (title.includes('诊断') || content.includes('诊断')) return '诊断标准';
    if (title.includes('治疗') || content.includes('治疗')) return '治疗方案';
    
    return '医学资料';
  }

  /**
   * 搜索知识库
   * @param {string} query - 查询语句
   * @param {Object} options - 搜索选项
   */
  async searchKnowledge(query, options = {}) {
    const results = await this.vectorService.similaritySearch(query, {
      ...options,
      sourceType: 'knowledge'
    });
    
    return results;
  }

  /**
   * 搜索患者记录
   * @param {string} query - 查询语句
   * @param {Object} options - 搜索选项
   */
  async searchPatients(query, options = {}) {
    const results = await this.vectorService.similaritySearch(query, {
      ...options,
      sourceType: 'patient'
    });
    
    return results;
  }

  /**
   * 关闭服务
   */
  async close() {
    await this.vectorService.disconnect();
  }
}

export default KnowledgeBaseService;