import Mock from "mockjs";
import { PrismaClient } from "../generated/prisma/index.js";
import fs from "fs";
import path from "path";
const prisma = new PrismaClient();

// 生成随机向量（1536维，匹配OpenAI）
function generateRandomVector(dimension = 1536) {
  const vector = [];
  for (let i = 0; i < dimension; i++) {
    vector.push(Math.random() * 2 - 1);
  }
  return vector;
}

// 读取知识库文档
function readKnowledgeDocuments() {
  const knowledgeBaseDir = path.join(process.cwd(), 'knowledge_base');
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

// 生成测试数据
const generateMockData = async () => {
  console.log("开始生成模拟医疗数据...");

  const patients = Array.from({ length: 100 }, (_, index) => {
    const patientId = `P2024${String(index + 1).padStart(6, '0')}`;
    const birthYear = Mock.Random.integer(1940, 2010);
    const birthMonth = Mock.Random.integer(1, 12);
    const birthDay = Mock.Random.integer(1, 28);

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

  await prisma.patient.createMany({ data: patients });
  console.log(`已插入 ${patients.length} 个患者记录`);

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
      mainComplaint: Mock.Random.ctitle(3, 8),
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
      diagnosisName: Mock.Random.ctitle(3, 8),
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
        { type: Mock.Random.pick(['饮食', '运动', '作息']), recommendation: Mock.Random.csentence(10, 20) },
        { type: Mock.Random.pick(['饮食', '运动', '作息']), recommendation: Mock.Random.csentence(10, 20) }
      ]),
      followUpPlan: JSON.stringify({
        nextAppointment: Mock.Random.date('yyyy-MM-dd'),
        purpose: Mock.Random.ctitle(3, 8),
        doctor: Mock.Random.cname()
      }),
      createdAt: new Date()
    }));

    const noteTypes = ['入院记录', '病程记录', '手术记录', '出院记录'];
    const progressNotes = Array.from({ length: Mock.Random.integer(1, 3) }, () => ({
      patientId: patient.id,
      noteDate: new Date(Mock.Random.date('yyyy-MM-dd')),
      noteTime: `${Mock.Random.integer(8, 20)}:${String(Mock.Random.integer(0, 59)).padStart(2, '0')}:00`,
      author: Mock.Random.cname(),
      content: Mock.Random.csentence(20, 50),
      type: Mock.Random.pick(noteTypes),
      createdAt: new Date()
    }));

    const financialInfo = {
      patientId: patient.id,
      totalCost: Mock.Random.float(1000, 50000, 2, 2),
      insuranceCoverage: Mock.Random.float(0, 30000, 2, 2),
      selfPayment: Mock.Random.float(100, 20000, 2, 2),
      paymentStatus: Mock.Random.pick(['未支付', '部分支付', '已支付']),
      paymentHistory: JSON.stringify([
        { date: Mock.Random.date('yyyy-MM-dd'), amount: Mock.Random.float(100, 5000, 2, 2), method: Mock.Random.pick(['现金', '银行卡', '支付宝', '微信支付']) }
      ]),
      createdAt: new Date()
    };

    const medicalTeam = {
      patientId: patient.id,
      primaryPhysician: JSON.stringify({
        name: Mock.Random.cname(),
        department: Mock.Random.pick(['心内科', '呼吸科', '消化科', '神经内科', '骨科', '普外科']),
        title: Mock.Random.pick(['主任医师', '副主任医师', '主治医师', '住院医师']),
        contact: Mock.Random.string('number', 11)
      }),
      nurse: JSON.stringify({
        name: Mock.Random.cname(),
        department: Mock.Random.pick(['心内科', '呼吸科', '消化科', '神经内科', '骨科', '普外科']),
        title: Mock.Random.pick(['主管护师', '护师', '护士']),
        contact: Mock.Random.string('number', 11)
      }),
      specialists: JSON.stringify([
        { name: Mock.Random.cname(), department: Mock.Random.pick(['内分泌科', '肾内科', '血液科', '肿瘤科']), title: '副主任医师', contact: Mock.Random.string('number', 11) }
      ]),
      createdAt: new Date()
    };

    await prisma.$transaction(async (tx) => {
      if (medicalHistories.length > 0) {
        await tx.medicalHistory.createMany({ data: medicalHistories });
      }

      if (currentSymptoms.length > 0) {
        await tx.currentSymptom.createMany({ data: currentSymptoms });
      }

      if (physicalExaminations.length > 0) {
        await tx.physicalExamination.createMany({ data: physicalExaminations });
      }

      await tx.examinationResult.create({ data: examinationResults });

      if (diagnoses.length > 0) {
        await tx.diagnosis.createMany({ data: diagnoses });
      }

      if (treatmentPlans.length > 0) {
        await tx.treatmentPlan.createMany({ data: treatmentPlans });
      }

      if (progressNotes.length > 0) {
        await tx.progressNote.createMany({ data: progressNotes });
      }

      await tx.financialInfo.create({ data: financialInfo });
      await tx.medicalTeam.create({ data: medicalTeam });

      const patientVector = generateRandomVector(1536);
      const patientVectorData = {
        sourceType: 'patient',
        sourceId: patient.id,
        patientId: patient.id,
        title: `${patient.name}的患者信息`,
        content: `患者${patient.name}，${patient.gender}，${patient.age}岁，主要症状：头痛、发热...`,
        vector: patientVector,
        contentType: 'patient_record',
        tags: ['患者', patient.gender, `${patient.age}岁`],
        metadata: { patientName: patient.name, patientId: patient.id, gender: patient.gender, age: patient.age },
        relevance: Mock.Random.float(0, 1, 2, 2)
      };

      await tx.vectorStore.create({ data: patientVectorData });
    });
  }

  console.log("患者数据生成完成！");

  await generateKnowledgeDocuments();
};

// 生成知识文档数据
async function generateKnowledgeDocuments() {
  console.log("开始生成知识文档...");
  
  const documents = readKnowledgeDocuments();
  const createdDocuments = [];
  
  for (const document of documents) {
    const createdDoc = await prisma.knowledgeDocument.create({
      data: document
    });
    createdDocuments.push(createdDoc);
  }
  
  console.log(`已插入 ${createdDocuments.length} 个知识文档`);

  for (const document of createdDocuments) {
    const documentVector = generateRandomVector(1536);
    const vectorData = {
      sourceType: 'knowledge',
      sourceId: document.id.toString(),
      knowledgeDocumentId: document.id,
      title: document.title,
      content: document.content.substring(0, 500),
      vector: documentVector,
      contentType: 'knowledge_base',
      tags: document.tags,
      metadata: {
        documentId: document.id,
        category: document.category,
        source: document.source
      },
      relevance: Mock.Random.float(0, 1, 2, 2)
    };

    await prisma.vectorStore.create({ data: vectorData });
  }
  
  console.log(`已为 ${createdDocuments.length} 个知识文档生成向量数据`);
}

async function init() {
  try {
    console.log("开始清空现有数据...");
    await prisma.$transaction([
      prisma.vectorStore.deleteMany(),
      prisma.medicalTeam.deleteMany(),
      prisma.financialInfo.deleteMany(),
      prisma.progressNote.deleteMany(),
      prisma.treatmentPlan.deleteMany(),
      prisma.diagnosis.deleteMany(),
      prisma.examinationResult.deleteMany(),
      prisma.physicalExamination.deleteMany(),
      prisma.currentSymptom.deleteMany(),
      prisma.medicalHistory.deleteMany(),
      prisma.patient.deleteMany(),
      prisma.knowledgeDocument.deleteMany()
    ]);
    console.log("现有数据已清空");

    await generateMockData();

    const patientCount = await prisma.patient.count();
    const knowledgeDocCount = await prisma.knowledgeDocument.count();
    const vectorCount = await prisma.vectorStore.count();
    
    console.log(`数据库中现有患者数量: ${patientCount}`);
    console.log(`数据库中现有知识文档数量: ${knowledgeDocCount}`);
    console.log(`数据库中现有向量数据数量: ${vectorCount}`);

    await prisma.$disconnect();
    console.log("数据库连接已关闭");
  } catch (error) {
    console.error("数据生成过程中出现错误:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

init();