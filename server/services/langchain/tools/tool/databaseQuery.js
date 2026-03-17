import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PrismaClient } from "../../../../generated/prisma/index.js";
import { defaultLLM } from "../../core/llm.js";

const prisma = new PrismaClient();

/**
 * 数据库Schema定义（用于LLM理解数据库结构）
 */
const DATABASE_SCHEMA = `
数据库表结构：

1. Patient (患者表)
   - id: String (UUID主键)
   - name: String (姓名)
   - gender: Gender enum (男/女)
   - age: Int (年龄)
   - phone: String (电话)
   - address: String (地址)
   - bloodType: String (血型)
   - createdAt: DateTime (创建时间)
   - 关联: medicalHistories, currentSymptoms, diagnoses, treatmentPlans等

2. MedicalHistory (既往病史表)
   - id: Int
   - patientId: String (患者ID)
   - type: HistoryType enum (慢性疾病/手术史/过敏史/家族史/疫苗接种)
   - details: Json (详情)

3. CurrentSymptom (当前症状表)
   - id: Int
   - patientId: String
   - mainComplaint: String (主诉)
   - symptoms: Json (症状详情)
   - duration: String (持续时间)
   - severity: String (严重程度)

4. Diagnosis (诊断表)
   - id: Int
   - patientId: String
   - icdCode: String (ICD编码)
   - diagnosisName: String (诊断名称)
   - type: DiagnosisType enum (主要诊断/次要诊断/鉴别诊断)
   - diagnosisDate: DateTime (诊断日期)

5. TreatmentPlan (治疗方案表)
   - id: Int
   - patientId: String
   - medication: Json (药物信息)
   - procedures: Json (手术/治疗程序)
   - lifestyleRecommendations: Json (生活方式建议)

6. ProgressNote (病程记录表)
   - id: Int
   - patientId: String
   - noteDate: DateTime (记录日期)
   - content: String (内容)
   - type: NoteType enum (入院记录/病程记录/手术记录/出院记录)
`;

/**
 * 数据库查询工具 - LLM智能查询
 * 使用LLM将自然语言转换为数据库查询并执行
 */
export const databaseQueryTool = new DynamicStructuredTool({
  name: "database_query",
  description: `用于查询医疗数据库中的患者信息、统计数据、疾病分析等。

支持通过自然语言提问，例如：
- "统计一下糖尿病患者的数量"
- "列出所有高血压患者"
- "分析一下各年龄段疾病的分布情况"
- "查询患者张三的病历信息"
- "统计北京地区的患者数量"
- "分析一下糖尿病的常用治疗方案"

查询类型包括：
1. 患者数量统计
2. 患者列表查询
3. 疾病统计分析
4. 治疗方案分析
5. 患者详细信息查询

参数说明：
- query: 用户的自然语言查询问题
- context: 可选的上下文信息`,

  schema: z.object({
    query: z.string().describe("用户的自然语言查询问题，例如：'统计糖尿病患者的数量'"),
    context: z.string().optional().describe("可选的上下文信息，用于辅助理解查询意图")
  }),

  func: async ({ query, context = "" }) => {
    try {
      console.log("🤖 LLM数据库查询:", query);

      // 步骤1: 使用LLM分析查询意图并生成查询计划
      const analysisPrompt = `你是一个医疗数据库查询专家。请分析用户的查询请求，并生成查询计划。

${DATABASE_SCHEMA}

用户查询: "${query}"
${context ? `上下文: ${context}` : ""}

请分析这个查询，并以JSON格式返回：
{
  "queryType": "统计查询|列表查询|详情查询|分析查询",
  "targetTable": "主要查询的表",
  "filters": {
    "字段名": "筛选条件描述"
  },
  "aggregations": ["需要统计的字段"],
  "groupBy": ["分组字段"],
  "orderBy": "排序字段",
  "limit": 返回数量限制,
  "explanation": "查询意图的解释"
}

只返回JSON，不要其他内容。`;

      const analysisResponse = await defaultLLM.invoke([
        { role: "system", content: "你是一个医疗数据库查询专家，擅长分析查询意图并生成查询计划。" },
        { role: "user", content: analysisPrompt }
      ]);

      let queryPlan;
      try {
        const jsonMatch = analysisResponse.content.match(/\{[\s\S]*\}/);
        queryPlan = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResponse.content);
        console.log("📋 查询计划:", queryPlan);
      } catch (e) {
        console.error("解析查询计划失败:", e);
        queryPlan = { queryType: "列表查询", targetTable: "Patient", filters: {} };
      }

      // 步骤2: 根据查询计划执行数据库查询
      const dbResult = await executeQueryPlan(queryPlan);
      console.log("✅ 数据库查询完成，结果数:", 
        dbResult.patients?.length || 
        dbResult.statistics?.length || 
        dbResult.count || 
        "N/A"
      );

      // 步骤3: 使用LLM整理查询结果
      const organizePrompt = `用户问："${query}"

我查询了数据库，找到了这些信息：
${JSON.stringify(dbResult, null, 2)}

请用自然、友好的方式回答用户的问题。重点是要让用户容易理解查询结果，如果数据中有特别重要的发现，可以重点说明。`;

      const organizedResponse = await defaultLLM.invoke([
        { role: "system", content: "你是一个友好的医疗助手，擅长用简单易懂的方式解释医疗数据。" },
        { role: "user", content: organizePrompt }
      ]);

      return JSON.stringify({
        success: true,
        query,
        queryPlan,
        answer: organizedResponse.content,
        rawData: dbResult
      });

    } catch (error) {
      console.error("❌ LLM数据库查询失败:", error);
      return JSON.stringify({
        success: false,
        query,
        error: error.message
      });
    }
  }
});

/**
 * 根据查询计划执行数据库查询
 */
async function executeQueryPlan(queryPlan) {
  const { queryType, targetTable, filters, aggregations, groupBy, orderBy, limit = 20 } = queryPlan;

  // 根据目标表和查询类型执行相应的查询
  switch (targetTable) {
    case "Patient":
    case "患者":
      return await queryPatientTable(queryPlan);
    case "Diagnosis":
    case "诊断":
      return await queryDiagnosisTable(queryPlan);
    case "TreatmentPlan":
    case "治疗方案":
      return await queryTreatmentTable(queryPlan);
    case "MedicalHistory":
    case "病史":
      return await queryMedicalHistoryTable(queryPlan);
    default:
      // 默认查询患者表
      return await queryPatientTable(queryPlan);
  }
}

/**
 * 查询患者表
 */
async function queryPatientTable(queryPlan) {
  const { queryType, filters } = queryPlan;
  const limit = queryPlan.limit || 20; // 确保 limit 有默认值
  const where = buildWhereClause(filters);

  // 统计查询
  if (queryType?.includes("统计") || queryType?.includes("count")) {
    const count = await prisma.patient.count({ where });
    return {
      type: "统计",
      count,
      description: `符合条件的患者共 ${count} 人`
    };
  }

  // 详情查询
  if (queryType?.includes("详情") || queryType?.includes("detail")) {
    const patient = await prisma.patient.findFirst({
      where,
      include: {
        medicalHistories: true,
        currentSymptoms: true,
        diagnoses: true,
        treatmentPlans: true,
        progressNotes: {
          orderBy: { noteDate: "desc" },
          take: 5
        }
      }
    });

    if (!patient) {
      return { type: "详情", found: false, message: "未找到符合条件的患者" };
    }

    return {
      type: "详情",
      found: true,
      patient: {
        id: patient.id,
        name: patient.name,
        gender: patient.gender,
        age: patient.age,
        phone: patient.phone ? `${patient.phone.slice(0, 3)}****${patient.phone.slice(-4)}` : null,
        address: patient.address,
        bloodType: patient.bloodType,
        diagnosisCount: patient.diagnoses.length,
        diagnoses: patient.diagnoses.map(d => d.diagnosisName),
        hasTreatmentPlan: patient.treatmentPlans.length > 0
      }
    };
  }

  // 默认列表查询
  const patients = await prisma.patient.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      diagnoses: {
        select: { diagnosisName: true }
      }
    }
  });

  return {
    type: "列表",
    count: patients.length,
    patients: patients.map(p => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      age: p.age,
      address: p.address,
      diagnoses: p.diagnoses.map(d => d.diagnosisName).join(", ") || "暂无诊断"
    }))
  };
}

/**
 * 查询诊断表
 */
async function queryDiagnosisTable(queryPlan) {
  const { filters, groupBy } = queryPlan;
  const limit = queryPlan.limit || 20;
  const where = {};

  // 解析疾病筛选
  if (filters?.disease || filters?.疾病) {
    const diseaseName = filters.disease || filters.疾病;
    where.diagnosisName = {
      contains: diseaseName
    };
  }

  // 获取诊断数据
  const diagnoses = await prisma.diagnosis.findMany({
    where,
    take: limit * 2,
    include: {
      patient: {
        select: {
          gender: true,
          age: true,
          address: true
        }
      }
    }
  });

  // 统计分析
  const stats = {
    total: diagnoses.length,
    byDisease: {},
    byGender: {},
    byAgeGroup: {}
  };

  diagnoses.forEach(d => {
    // 按疾病统计
    stats.byDisease[d.diagnosisName] = (stats.byDisease[d.diagnosisName] || 0) + 1;

    // 按性别统计
    const gender = d.patient?.gender || "未知";
    stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;

    // 按年龄段统计
    const age = d.patient?.age;
    let ageGroup = "未知";
    if (age !== null && age !== undefined) {
      if (age < 18) ageGroup = "0-17岁";
      else if (age < 30) ageGroup = "18-29岁";
      else if (age < 40) ageGroup = "30-39岁";
      else if (age < 50) ageGroup = "40-49岁";
      else if (age < 60) ageGroup = "50-59岁";
      else if (age < 70) ageGroup = "60-69岁";
      else ageGroup = "70岁以上";
    }
    stats.byAgeGroup[ageGroup] = (stats.byAgeGroup[ageGroup] || 0) + 1;
  });

  return {
    type: "疾病统计",
    totalCases: stats.total,
    byDisease: Object.entries(stats.byDisease).map(([name, count]) => ({ name, count })),
    byGender: Object.entries(stats.byGender).map(([name, count]) => ({ name, count })),
    byAgeGroup: Object.entries(stats.byAgeGroup).map(([name, count]) => ({ name, count }))
  };
}

/**
 * 查询治疗方案表
 */
async function queryTreatmentTable(queryPlan) {
  const { filters } = queryPlan;
  const limit = queryPlan.limit || 20;

  const where = {};

  // 如果指定了疾病，通过患者关联查询
  if (filters?.disease || filters?.疾病) {
    const diseaseName = filters.disease || filters.疾病;
    where.patient = {
      diagnoses: {
        some: {
          diagnosisName: {
            contains: diseaseName
          }
        }
      }
    };
  }

  const treatments = await prisma.treatmentPlan.findMany({
    where,
    take: limit,
    include: {
      patient: {
        include: {
          diagnoses: true
        }
      }
    }
  });

  // 分析药物使用情况
  const medicationStats = {};
  treatments.forEach(t => {
    if (t.medication) {
      try {
        const meds = typeof t.medication === 'string' ? JSON.parse(t.medication) : t.medication;
        if (Array.isArray(meds)) {
          meds.forEach(med => {
            const name = med.name || med.药物名称 || med.药品名称 || "未知药物";
            medicationStats[name] = (medicationStats[name] || 0) + 1;
          });
        }
      } catch (e) {
        // 解析失败则跳过
      }
    }
  });

  return {
    type: "治疗分析",
    totalTreatments: treatments.length,
    topMedications: Object.entries(medicationStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  };
}

/**
 * 查询病史表
 */
async function queryMedicalHistoryTable(queryPlan) {
  const { filters } = queryPlan;
  const limit = queryPlan.limit || 20;

  const where = {};

  if (filters?.type || filters?.类型) {
    where.type = filters.type || filters.类型;
  }

  const histories = await prisma.medicalHistory.findMany({
    where,
    take: limit,
    include: {
      patient: {
        select: {
          name: true,
          gender: true,
          age: true
        }
      }
    }
  });

  // 按类型统计
  const typeStats = {};
  histories.forEach(h => {
    typeStats[h.type] = (typeStats[h.type] || 0) + 1;
  });

  return {
    type: "病史统计",
    totalRecords: histories.length,
    byType: Object.entries(typeStats).map(([name, count]) => ({ name, count })),
    records: histories.map(h => ({
      patientName: h.patient?.name,
      type: h.type,
      details: h.details
    }))
  };
}

/**
 * 构建查询条件
 */
function buildWhereClause(filters) {
  const where = {};

  if (!filters) return where;

  // 性别筛选
  if (filters.gender || filters.性别) {
    where.gender = filters.gender || filters.性别;
  }

  // 年龄范围
  if (filters.ageMin !== undefined || filters.ageMax !== undefined || filters.年龄) {
    where.age = {};
    if (filters.ageMin !== undefined) where.age.gte = filters.ageMin;
    if (filters.ageMax !== undefined) where.age.lte = filters.ageMax;

    // 解析"30岁"这样的条件
    if (filters.年龄) {
      const ageMatch = filters.年龄.toString().match(/(\d+)/);
      if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        if (filters.年龄.includes("以上") || filters.年龄.includes("大于")) {
          where.age.gte = age;
        } else if (filters.年龄.includes("以下") || filters.年龄.includes("小于")) {
          where.age.lte = age;
        } else {
          where.age.gte = Math.max(0, age - 5);
          where.age.lte = age + 5;
        }
      }
    }
  }

  // 地区筛选
  if (filters.region || filters.地区 || filters.地址) {
    where.address = {
      contains: filters.region || filters.地区 || filters.地址
    };
  }

  // 姓名筛选
  if (filters.name || filters.姓名 || filters.patientName) {
    where.name = {
      contains: filters.name || filters.姓名 || filters.patientName
    };
  }

  // 疾病筛选（通过诊断关联）
  if (filters.disease || filters.疾病) {
    where.diagnoses = {
      some: {
        diagnosisName: {
          contains: filters.disease || filters.疾病
        }
      }
    };
  }

  return where;
}

export default databaseQueryTool;
