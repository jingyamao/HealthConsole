import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

// 生成随机向量
function generateRandomVector(dimension) {
  const vector = [];
  for (let i = 0; i < dimension; i++) {
    vector.push(Math.random() * 2 - 1); // 生成-1到1之间的随机数
  }
  return vector;
}

// 将向量转换为PostgreSQL数组格式
function vectorToPgArray(vector) {
  return `[${vector.join(',')}]`;
}

// 测试pgvector功能
async function testPgVector() {
  console.log("测试pgvector功能...");
  
  try {
    // 获取一个患者
    const patient = await prisma.patient.findFirst();
    if (!patient) {
      console.log("没有找到患者数据，请先运行mock.js生成测试数据");
      return;
    }
    
    console.log(`使用患者: ${patient.name} (${patient.id})`);
    
    // 生成向量数据 (使用1536维向量匹配OpenAI)
    const patientVector = generateRandomVector(1536);
    const diagnosisVector = generateRandomVector(1536);
    
    // 插入向量数据
    console.log("插入向量数据...");
    
    // 使用原始SQL插入患者向量
    const patientVectorSql = `
      INSERT INTO vector_store ("patientId", content, vector, "contentType", metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `;
    
    const patientVectorResult = await prisma.$executeRawUnsafe(
      `INSERT INTO vector_store ("patientId", content, vector, "contentType", metadata, created_at, updated_at) VALUES ($1, $2, vector($3), $4, CAST($5 AS jsonb), NOW(), NOW()) RETURNING id`,
      patient.id,
      `患者${patient.name}，${patient.gender}，${patient.age}岁，主要症状：头痛、发热...`,
      `[${patientVector.join(',')}]`,
      "patient",
      JSON.stringify({ patientName: patient.name, patientId: patient.id })
    );
    console.log(`患者向量插入成功`);
    
    // 使用原始SQL插入诊断向量
    const diagnosisVectorSql = `
      INSERT INTO vector_store ("patientId", content, vector, "contentType", metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `;
    
    const diagnosisVectorResult = await prisma.$executeRawUnsafe(
      `INSERT INTO vector_store ("patientId", content, vector, "contentType", metadata, created_at, updated_at) VALUES ($1, $2, vector($3), $4, CAST($5 AS jsonb), NOW(), NOW()) RETURNING id`,
      patient.id,
      "诊断：上呼吸道感染，建议：多喝水，休息，服用感冒药...",
      `[${diagnosisVector.join(',')}]`,
      "diagnosis",
      JSON.stringify({ diagnosisType: "主要诊断", patientId: patient.id })
    );
    console.log(`诊断向量插入成功`);
    
    // 查询患者的向量数据
    console.log("查询患者的向量数据...");
    const patientVectors = await prisma.$queryRaw`
      SELECT id, content, "contentType", created_at
      FROM vector_store
      WHERE "patientId" = ${patient.id}
    `;
    
    console.log(`患者 ${patient.name} 的向量数据:`);
    patientVectors.forEach(vec => {
      console.log(`- ${vec.contentType}: ${vec.content.substring(0, 50)}...`);
    });
    
    // 执行向量相似度搜索
    console.log("执行向量相似度搜索...");
    
    // 使用原始SQL执行向量相似度搜索
    const similarVectors = await prisma.$queryRawUnsafe(
      `SELECT id, content, "contentType", metadata, 1 - (vector <=> vector($1)) as similarity FROM vector_store ORDER BY similarity DESC LIMIT 3`,
      `[${patientVector.join(',')}]`
    );
    
    console.log("相似度搜索结果（前3个）:");
    similarVectors.forEach(vec => {
      console.log(`- 相似度: ${vec.similarity.toFixed(4)}, 类型: ${vec.contentType}, 内容: ${vec.content.substring(0, 50)}...`);
    });
    
    console.log("测试完成！");
    
  } catch (error) {
    console.error("测试过程中出现错误:", error);
  } finally {
    await prisma.$disconnect();
    console.log("数据库连接已关闭");
  }
}

// 执行测试
testPgVector();
