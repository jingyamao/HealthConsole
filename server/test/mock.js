import Mock from "mockjs";
import { PrismaClient } from "../generated/prisma/index.js";
import fs from "fs";
import path from "path";
import VectorService from "../services/langchain/core/vectorStore.js";

const prisma = new PrismaClient();
const vectorService = new VectorService();

// 读取知识库文档
function readKnowledgeDocuments() {
  const knowledgeBaseDir = path.join(process.cwd(), 'knowledge_base');
  
  if (!fs.existsSync(knowledgeBaseDir)) {
    console.log('知识库目录不存在，跳过知识文档向量化');
    return [];
  }
  
  const files = fs.readdirSync(knowledgeBaseDir);
  
  const documents = [];
  files.forEach(file => {
    if (!file.endsWith('.txt')) return;
    
    const filePath = path.join(knowledgeBaseDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const title = file.replace('.txt', '');
    const category = extractCategory(title, content);
    const tags = extractTags(content);
    const source = extractSource(content);
    
    documents.push({
      title,
      content,
      source,
      version: 'v1.0',
      tags,
      category,
      publishDate: new Date('2020-01-01'),
      metadata: {
        fileName: file,
        category,
        source
      },
      isActive: true
    });
  });
  
  console.log(`读取到 ${documents.length} 个知识文档`);
  return documents;
}

// 提取文档分类
function extractCategory(title, content) {
  if (title.includes('症状')) return '症状鉴别';
  if (title.includes('心肌梗死')) return '心血管疾病';
  if (title.includes('糖尿病')) return '内分泌疾病';
  if (title.includes('高血压')) return '心血管疾病';
  if (title.includes('中医')) return '中医诊疗';
  return '医学指南';
}

// 提取标签
function extractTags(content) {
  const keywords = [];
  
  const medicalKeywords = [
    '发热', '头痛', '胸痛', '呼吸困难', '腹痛', '水肿', '晕厥',
    '心肌梗死', '糖尿病', '高血压', '中医', '辨证论治',
    '诊断', '治疗', '指南', '并发症', '预防', '康复',
    '针灸', '中药', '生活方式', '危险因素', '药物治疗'
  ];
  
  medicalKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords.slice(0, 5);
}

// 提取来源信息
function extractSource(content) {
  const sourceMatch = content.match(/来源[:：]\s*([^\n]+)/);
  if (sourceMatch) {
    return sourceMatch[1].trim();
  }
  return '医学文献';
}

// 生成患者向量化数据
async function generatePatientVectorData(patient) {
  try {
    // 构建患者摘要信息
    const patientSummary = `
患者基本信息：
姓名：${patient.name}，性别：${patient.gender}，年龄：${patient.age}岁
住址：${patient.address}
血型：${patient.bloodType}，职业：${patient.occupation}
    `;

    // 生成向量并存储
    await vectorService.storePatientVector({
      patientId: patient.id,
      content: patientSummary,
      title: `${patient.name}的医疗档案`,
      category: '患者档案',
      metadata: {
        age: patient.age,
        gender: patient.gender,
        bloodType: patient.bloodType,
        occupation: patient.occupation
      }
    });

    console.log(`✅ 患者 ${patient.name} 向量化完成`);
  } catch (error) {
    console.error(`❌ 患者 ${patient.name} 向量化失败:`, error);
  }
}

// 存储知识文档向量
async function storeKnowledgeVectors(documents) {
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    try {
      await vectorService.storeKnowledgeVector({
        documentId: `doc_${i + 1}`,
        content: doc.content,
        title: doc.title,
        metadata: {
          category: doc.category,
          tags: doc.tags,
          source: doc.source,
          ...doc.metadata
        }
      });
      console.log(`✅ 知识文档 "${doc.title}" 向量化完成`);
    } catch (error) {
      console.error(`❌ 知识文档 "${doc.title}" 向量化失败:`, error);
    }
  }
}

// 生成测试数据
const generateMockData = async () => {
  console.log("开始生成模拟医疗数据...");

  try {
    // 清空现有数据（按照依赖关系顺序删除）
    console.log("正在清空现有数据...");
    await prisma.vectorStore.deleteMany({});
    await prisma.medicalHistory.deleteMany({});
    await prisma.currentSymptom.deleteMany({});
    await prisma.physicalExamination.deleteMany({});
    await prisma.examinationResult.deleteMany({});
    await prisma.diagnosis.deleteMany({});
    await prisma.treatmentPlan.deleteMany({});
    await prisma.progressNote.deleteMany({});
    await prisma.financialInfo.deleteMany({});
    await prisma.medicalTeam.deleteMany({});
    await prisma.patient.deleteMany({});
    
    console.log("数据清理完成");

    // 生成100个患者
    const patients = Array.from({ length: 100 }, (_, index) => {
      const patientId = `P2024${String(index + 1).padStart(6, '0')}`;
      const birthYear = Mock.Random.integer(1940, 2010);
      const birthMonth = Mock.Random.integer(1, 12);
      const birthDay = Mock.Random.integer(1, 28);

      // 常见疾病列表
      const commonDiseases = ['高血压', '糖尿病', '冠心病', '哮喘', '关节炎', '肝炎', '胃炎', '肺炎'];
      const mainComplaints = ['头痛', '胸痛', '发热', '咳嗽', '腹痛', '头晕', '乏力', '心悸'];

      return {
        id: patientId,
        name: Mock.Random.cname(),
        gender: Mock.Random.pick(['男', '女']),
        age: Mock.Random.integer(10, 90),
        dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
        idCard: Mock.Random.id(),
        phone: Mock.Random.string('number', 11),
        emergencyContact: JSON.stringify({
          name: Mock.Random.cname(),
          relationship: Mock.Random.pick(['配偶', '父母', '子女', '其他']),
          phone: Mock.Random.string('number', 11)
        }),
        address: `${Mock.Random.province()}${Mock.Random.city()}${Mock.Random.county()}${Mock.Random.county()}街道${Mock.Random.integer(1, 100)}号`,
        insurance: `${Mock.Random.pick(['职工医保', '居民医保', '新农合', '商业保险'])}:${Mock.Random.string('number', 12)}`,
        bloodType: Mock.Random.pick(['A型阳性', 'A型阴性', 'B型阳性', 'B型阴性', 'O型阳性', 'O型阴性', 'AB型阳性', 'AB型阴性']),
        maritalStatus: Mock.Random.pick(['未婚', '已婚', '离异', '丧偶']),
        occupation: Mock.Random.pick(['公务员', '教师', '医生', '工程师', '工人', '农民', '自由职业', '退休', '学生']),
        education: Mock.Random.pick(['小学', '初中', '高中', '大专', '本科', '硕士', '博士']),
        aiConsent: Mock.Random.boolean(),
        vectorVersion: `v${Mock.Random.integer(1, 10)}.${Mock.Random.integer(0, 9)}`,
        aiNotes: JSON.stringify({ notes: Mock.Random.csentence(10, 20) }),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    // 批量插入患者数据
    await prisma.patient.createMany({ data: patients });
    console.log(`✅ 已插入 ${patients.length} 个患者记录`);

    // 为每个患者生成关联数据
    for (const patient of patients) {
      const historyTypes = ['慢性疾病', '手术史', '过敏史', '家族史', '疫苗接种'];
      const medicalHistories = Array.from({ length: Mock.Random.integer(1, 3) }, () => ({
        patientId: patient.id,
        type: Mock.Random.pick(historyTypes),
        details: JSON.stringify({
          name: Mock.Random.pick(['高血压', '糖尿病', '冠心病', '哮喘', '关节炎', '肝炎']),
          diagnosedDate: Mock.Random.date('yyyy-MM-dd'),
          severity: Mock.Random.pick(['轻度', '中度', '重度']),
          currentControl: Mock.Random.pick(['药物控制', '生活方式控制', '控制良好', '控制不佳']),
          lastReview: Mock.Random.date('yyyy-MM-dd')
        }),
        createdAt: new Date()
      }));

      const currentSymptoms = Array.from({ length: Mock.Random.integer(1, 2) }, () => ({
        patientId: patient.id,
        mainComplaint: Mock.Random.pick(['头痛', '胸痛', '发热', '咳嗽', '腹痛', '头晕', '乏力', '心悸']),
        symptoms: JSON.stringify([
          { name: Mock.Random.ctitle(2, 4), description: Mock.Random.csentence(5, 10), duration: `${Mock.Random.integer(1, 10)}天`, severity: Mock.Random.integer(1, 10) },
          { name: Mock.Random.ctitle(2, 4), description: Mock.Random.csentence(5, 10), duration: `${Mock.Random.integer(1, 10)}天`, severity: Mock.Random.integer(1, 10) }
        ]),
        duration: `${Mock.Random.integer(1, 10)}天`,
        severity: Mock.Random.pick(['轻度', '中度', '重度']),
        aggravatingFactors: Mock.Random.pick(['劳累', '情绪激动', '天气变化', '进食后']),
        relievingFactors: Mock.Random.pick(['休息', '服药', '热敷', '按摩']),
        createdAt: new Date()
      }));

      const physicalExaminations = Array.from({ length: Mock.Random.integer(1, 2) }, () => ({
        patientId: patient.id,
        vitalSigns: `血压${Mock.Random.integer(110, 160)}/${Mock.Random.integer(70, 100)}mmHg,心率${Mock.Random.integer(60, 100)}次/分,呼吸${Mock.Random.integer(16, 24)}次/分,体温${(36 + Mock.Random.float(0, 1, 1, 1)).toFixed(1)}℃`,
        generalAppearance: Mock.Random.pick(['神志清楚', '神志模糊', '发育正常', '营养良好', '营养不良']),
        headAndNeck: Mock.Random.csentence(5, 10),
        chest: Mock.Random.csentence(5, 10),
        cardiovascular: Mock.Random.csentence(5, 10),
        abdomen: Mock.Random.csentence(5, 10),
        extremities: Mock.Random.csentence(5, 10),
        neurological: Mock.Random.csentence(5, 10),
        createdAt: new Date()
      }));

      const examinationResults = {
        patientId: patient.id,
        laboratoryTests: Mock.Random.csentence(10, 20),
        imagingStudies: Mock.Random.csentence(10, 20),
        specialTests: Mock.Random.csentence(10, 20),
        createdAt: new Date()
      };

      const diagnosisTypes = ['主要诊断', '次要诊断', '鉴别诊断'];
      const diagnoses = Array.from({ length: Mock.Random.integer(1, 3) }, () => ({
        patientId: patient.id,
        icdCode: `ICD${Mock.Random.string('number', 6)}`,
        diagnosisName: Mock.Random.pick(['高血压', '糖尿病', '冠心病', '哮喘', '关节炎', '肝炎', '胃炎', '肺炎']),
        type: Mock.Random.pick(diagnosisTypes),
        diagnosisDate: new Date(Mock.Random.date('yyyy-MM-dd')),
        doctorName: Mock.Random.cname(),
        createdAt: new Date()
      }));

      const treatmentPlans = Array.from({ length: Mock.Random.integer(1, 2) }, () => ({
        patientId: patient.id,
        medication: JSON.stringify([
          { name: Mock.Random.ctitle(2, 4), dose: `${Mock.Random.integer(10, 100)}mg`, frequency: Mock.Random.pick(['每日1次', '每日2次', '每日3次']), route: '口服' },
          { name: Mock.Random.ctitle(2, 4), dose: `${Mock.Random.integer(10, 100)}mg`, frequency: Mock.Random.pick(['每日1次', '每日2次', '每日3次']), route: '口服' }
        ]),
        procedures: JSON.stringify([
          { name: Mock.Random.ctitle(3, 6), date: Mock.Random.date('yyyy-MM-dd'), outcome: Mock.Random.pick(['成功', '完成', '进行中']) }
        ]),
        lifestyleRecommendations: JSON.stringify([
          { type: Mock.Random.pick(['饮食', '运动', '作息']), recommendation: Mock.Random.csentence(10, 20) }
        ]),
        followUpPlan: JSON.stringify({
          nextAppointment: Mock.Random.date('yyyy-MM-dd'),
          purpose: Mock.Random.ctitle(3, 8),
          doctor: Mock.Random.cname()
        }),
        createdAt: new Date()
      }));

      // 批量插入关联数据
      await prisma.medicalHistory.createMany({ data: medicalHistories });
      await prisma.currentSymptom.createMany({ data: currentSymptoms });
      await prisma.physicalExamination.createMany({ data: physicalExaminations });
      await prisma.examinationResult.create({ data: examinationResults });
      await prisma.diagnosis.createMany({ data: diagnoses });
      await prisma.treatmentPlan.createMany({ data: treatmentPlans });

      // 生成患者向量化数据
      await generatePatientVectorData(patient);
    }

    // 读取并向量化知识库文档
    console.log("开始向量化知识库文档...");
    const knowledgeDocuments = readKnowledgeDocuments();
    await storeKnowledgeVectors(knowledgeDocuments);

    console.log("✅ 模拟数据生成完成！");
    console.log(`📊 生成统计：`);
    console.log(`   - 患者记录：${patients.length} 个`);
    console.log(`   - 知识文档：${knowledgeDocuments.length} 个`);

  } catch (error) {
    console.error("❌ 生成模拟数据时出错:", error);
  } finally {
    await prisma.$disconnect();
  }
};

// 运行生成函数
console.log(" 开始执行mock数据生成脚本...");
generateMockData().catch(error => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});

export default generateMockData;