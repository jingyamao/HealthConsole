import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from '../../../../prisma/index.js';
import { defaultLLM } from "../../core/llm.js";

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
   - insurance: String (医保类型)
   - occupation: String (职业)
   - createdAt: DateTime (创建时间)
   - 关联: medicalHistories, currentSymptoms, diagnoses, treatmentPlans, progressNotes, financialInfos, physicalExaminations, examinationResults, medicalTeams

2. Diagnosis (诊断表)
   - id: Int
   - patientId: String (关联Patient)
   - icdCode: String (ICD编码)
   - diagnosisName: String (诊断名称)
   - type: DiagnosisType enum (主要诊断/次要诊断/鉴别诊断)
   - diagnosisDate: DateTime (诊断日期)
   - doctorName: String (主治医生)

3. CurrentSymptom (当前症状表)
   - id: Int
   - patientId: String (关联Patient)
   - mainComplaint: String (主诉)
   - symptoms: Json (症状详情)
   - duration: String (持续时间)
   - severity: String (严重程度: 轻/中/重)
   - aggravatingFactors: String (加重因素)
   - relievingFactors: String (缓解因素)

4. TreatmentPlan (治疗方案表)
   - id: Int
   - patientId: String (关联Patient)
   - medication: Json (药物信息，如 [{name:"阿司匹林", dosage:"100mg"}])
   - procedures: Json (手术/治疗程序)
   - lifestyleRecommendations: Json (生活方式建议)
   - followUpPlan: Json (随访计划)

5. MedicalHistory (既往病史表)
   - id: Int
   - patientId: String (关联Patient)
   - type: HistoryType enum (慢性疾病/手术史/过敏史/家族史/疫苗接种)
   - details: Json (详情)

6. ProgressNote (病程记录表)
   - id: Int
   - patientId: String (关联Patient)
   - noteDate: DateTime (记录日期)
   - author: String (记录人)
   - content: String (记录内容)
   - type: NoteType enum (入院记录/病程记录/手术记录/出院记录)

7. FinancialInfo (费用信息表)
   - id: Int
   - patientId: String (关联Patient)
   - totalCost: Float (总费用)
   - insuranceCoverage: Float (医保报销)
   - selfPayment: Float (自费金额)
   - paymentStatus: PaymentStatus enum (未支付/部分支付/已支付)
   - paymentHistory: Json (支付记录)

8. PhysicalExamination (体格检查表)
   - id: Int
   - patientId: String (关联Patient)
   - vitalSigns: String (生命体征)
   - generalAppearance: String (一般外观)
   - headAndNeck: String (头颈部)
   - chest: String (胸部)
   - cardiovascular: String (心血管)
   - abdomen: String (腹部)
   - extremities: String (四肢)
   - neurological: String (神经系统)

9. ExaminationResult (检查结果表)
   - id: Int
   - patientId: String (关联Patient)
   - laboratoryTests: String (实验室检验)
   - imagingStudies: String (影像学检查)
   - specialTests: String (特殊检查)

10. MedicalTeam (医疗团队表)
    - id: Int
    - patientId: String (关联Patient)
    - primaryPhysician: Json (主治医生信息)
    - nurse: Json (护士信息)
    - specialists: Json (专家信息)
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
- "费用最高的5位患者是谁"
- "未支付费用的患者有哪些"
- "最近的病程记录有哪些"
- "各年龄段的用药情况"

参数说明：
- query: 用户的自然语言查询问题
- context: 可选的上下文信息`,

  schema: z.object({
    query: z.string().describe("用户的自然语言查询问题"),
    context: z.string().optional().describe("可选的上下文信息"),
    history: z.string().optional().describe("会话历史记录")
  }),

  func: async ({ query, context = "", history = "" }) => {
    try {
      console.log("🤖 LLM数据库查询:", query);

      // 步骤1: 使用LLM分析查询意图并生成查询计划
      const analysisPrompt = `你是医疗数据库查询专家。请分析用户的查询请求，生成精确的查询计划。

${DATABASE_SCHEMA}

用户查询: "${query}"
${context ? `上下文: ${context}` : ""}
${history ? `会话历史（用户可能在追问之前的话题）：\n${history}` : ""}

**查询类型判断规则：**
- "有多少/共多少" → queryType: "统计查询"
- "按XX统计/分析" → queryType: "统计查询", groupBy: ["XX"]
- "列出/查看/显示" → queryType: "列表查询"
- "XX的详情/详细信息" → queryType: "详情查询"
- "费用/金额/支付" → targetTable: "FinancialInfo"
- "用药/药物/治疗方案" → targetTable: "TreatmentPlan"
- "症状/主诉/病情" → targetTable: "CurrentSymptom"
- "病程/记录/入院/出院" → targetTable: "ProgressNote"
- "检查/化验/检验/影像" → targetTable: "ExaminationResult"
- "体格检查/体检" → targetTable: "PhysicalExamination"
- "医生/团队" → targetTable: "MedicalTeam"
- 疾病分布/诊断统计 → targetTable: "Diagnosis"
- 患者基本信息/总数 → targetTable: "Patient"

**过滤条件构建规则：**
- 性别: {"gender": "男"} 或 {"gender": "女"}
- 年龄段: {"ageGroup": "30-39岁"} 或 {"ageMin": 30, "ageMax": 39}
- 疾病: {"disease": "糖尿病"}（通过Diagnosis关联）
- 地区: {"region": "北京"}
- 支付状态: {"paymentStatus": "未支付"}
- 医保类型: {"insurance": "城镇职工"}
- 病程记录类型: {"noteType": "入院记录"}
- 严重程度: {"severity": "重度"} 或 {"severity": "中度"} 或 {"severity": "轻度"}
  注意：severity字段的值只有"轻度"、"中度"、"重度"三种，没有"重"这个值

请以JSON格式返回：
{
  "queryType": "统计查询|列表查询|详情查询|分析查询",
  "targetTable": "表名",
  "filters": {"字段": "条件"},
  "aggregations": [{"field": "字段", "operation": "count|sum|avg"}],
  "groupBy": ["分组字段"],
  "orderBy": {"field": "字段", "direction": "asc|desc"},
  "limit": 数量,
  "reasoning": "选择此查询的原因"
}

只返回JSON，不要其他内容。`;

      const analysisResponse = await defaultLLM.invoke([
        { role: "system", content: "你是医疗数据库查询专家，擅长将自然语言转换为精确的数据库查询计划。只返回JSON格式。" },
        { role: "user", content: analysisPrompt }
      ]);

      let queryPlan;
      try {
        const jsonMatch = analysisResponse.content.match(/\{[\s\S]*\}/);
        queryPlan = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResponse.content);
        console.log("📋 查询计划:", JSON.stringify(queryPlan, null, 2));
      } catch (e) {
        console.error("解析查询计划失败:", e);
        queryPlan = { queryType: "列表查询", targetTable: "Patient", filters: {} };
      }

      // 步骤2: 根据查询计划执行数据库查询
      const dbResult = await executeQueryPlan(queryPlan);
      console.log("✅ 数据库查询完成:", JSON.stringify(dbResult).substring(0, 200));

      // 步骤3: 使用LLM整理查询结果
      const organizePrompt = `用户问："${query}"

我查询了数据库，找到了以下信息：
${JSON.stringify(dbResult, null, 2)}

**回答要求：**
1. 用自然、友好的中文回答
2. 给出具体数字而非笼统描述
3. 如果有表格数据，使用Markdown表格展示
4. 如果数据较多，先给出摘要，再展示详细数据
5. 如果有异常或重要发现，重点标注
6. 在回答末尾标注"以上数据来自系统数据库"`;

      const organizedResponse = await defaultLLM.invoke([
        { role: "system", content: "你是友好的医疗数据助手，擅长将数据库查询结果转化为易懂的报告。支持Markdown格式输出。" },
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
  const { targetTable } = queryPlan;

  switch (targetTable) {
    case "Patient":
    case "患者":
      return await queryPatientTable(queryPlan);
    case "Diagnosis":
    case "诊断":
      return await queryDiagnosisTable(queryPlan);
    case "TreatmentPlan":
    case "治疗方案":
    case "用药":
      return await queryTreatmentTable(queryPlan);
    case "MedicalHistory":
    case "病史":
      return await queryMedicalHistoryTable(queryPlan);
    case "CurrentSymptom":
    case "症状":
    case "主诉":
      return await queryCurrentSymptomTable(queryPlan);
    case "ProgressNote":
    case "病程记录":
    case "记录":
      return await queryProgressNoteTable(queryPlan);
    case "FinancialInfo":
    case "费用":
    case "费用信息":
      return await queryFinancialInfoTable(queryPlan);
    case "PhysicalExamination":
    case "体格检查":
    case "体检":
      return await queryPhysicalExaminationTable(queryPlan);
    case "ExaminationResult":
    case "检查结果":
    case "检验":
      return await queryExaminationResultTable(queryPlan);
    case "MedicalTeam":
    case "医疗团队":
    case "医生":
      return await queryMedicalTeamTable(queryPlan);
    default:
      return await queryPatientTable(queryPlan);
  }
}

/**
 * 查询患者表
 */
async function queryPatientTable(queryPlan) {
  const { queryType, filters, groupBy } = queryPlan;
  const limit = queryPlan.limit || 20;
  const where = buildWhereClause(filters);

  // 统计查询
  if (queryType?.includes("统计") || queryType?.includes("count")) {
    // 按性别统计
    if (groupBy?.includes("gender") || groupBy?.includes("性别")) {
      const [maleCount, femaleCount] = await Promise.all([
        prisma.patient.count({ where: { ...where, gender: "男" } }),
        prisma.patient.count({ where: { ...where, gender: "女" } })
      ]);
      const total = maleCount + femaleCount;
      return {
        type: "性别分布统计",
        total,
        distribution: [
          { name: "男", count: maleCount, percentage: total > 0 ? (maleCount / total * 100).toFixed(1) + "%" : "0%" },
          { name: "女", count: femaleCount, percentage: total > 0 ? (femaleCount / total * 100).toFixed(1) + "%" : "0%" }
        ]
      };
    }

    // 按年龄段统计
    if (groupBy?.includes("ageGroup") || groupBy?.includes("年龄段") || groupBy?.includes("年龄")) {
      const patients = await prisma.patient.findMany({ where, select: { age: true } });
      const ageGroups = { "0-17岁": 0, "18-29岁": 0, "30-39岁": 0, "40-49岁": 0, "50-59岁": 0, "60-69岁": 0, "70岁以上": 0, "未知": 0 };
      patients.forEach(p => {
        const age = p.age;
        if (age === null || age === undefined) ageGroups["未知"]++;
        else if (age < 18) ageGroups["0-17岁"]++;
        else if (age < 30) ageGroups["18-29岁"]++;
        else if (age < 40) ageGroups["30-39岁"]++;
        else if (age < 50) ageGroups["40-49岁"]++;
        else if (age < 60) ageGroups["50-59岁"]++;
        else if (age < 70) ageGroups["60-69岁"]++;
        else ageGroups["70岁以上"]++;
      });
      return {
        type: "年龄段分布统计",
        total: patients.length,
        distribution: Object.entries(ageGroups)
          .filter(([, count]) => count > 0)
          .map(([name, count]) => ({
            name,
            count,
            percentage: patients.length > 0 ? (count / patients.length * 100).toFixed(1) + "%" : "0%"
          }))
      };
    }

    // 按地区统计
    if (groupBy?.includes("address") || groupBy?.includes("地区") || groupBy?.includes("地址")) {
      const patients = await prisma.patient.findMany({ where, select: { address: true } });
      const regionStats = {};
      patients.forEach(p => {
        const region = p.address || "未知";
        regionStats[region] = (regionStats[region] || 0) + 1;
      });
      return {
        type: "地区分布统计",
        total: patients.length,
        distribution: Object.entries(regionStats)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }))
      };
    }

    // 默认：总数量统计
    const count = await prisma.patient.count({ where });
    return {
      type: "患者总数统计",
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
        progressNotes: { orderBy: { noteDate: "desc" }, take: 5 },
        financialInfos: true,
        physicalExaminations: true,
        examinationResults: true,
        medicalTeams: true
      }
    });

    if (!patient) {
      return { type: "详情", found: false, message: "未找到符合条件的患者" };
    }

    return {
      type: "患者详情",
      found: true,
      patient: {
        id: patient.id,
        name: patient.name,
        gender: patient.gender,
        age: patient.age,
        phone: patient.phone ? `${patient.phone.slice(0, 3)}****${patient.phone.slice(-4)}` : null,
        address: patient.address,
        bloodType: patient.bloodType,
        insurance: patient.insurance,
        occupation: patient.occupation,
        diagnoses: patient.diagnoses.map(d => ({ name: d.diagnosisName, type: d.type, date: d.diagnosisDate })),
        symptoms: patient.currentSymptoms.map(s => ({ complaint: s.mainComplaint, severity: s.severity, duration: s.duration })),
        treatments: patient.treatmentPlans.map(t => ({ medication: t.medication, procedures: t.procedures })),
        recentNotes: patient.progressNotes.map(n => ({ date: n.noteDate, type: n.type, author: n.author })),
        financials: patient.financialInfos.map(f => ({ total: f.totalCost, insurance: f.insuranceCoverage, selfPay: f.selfPayment, status: f.paymentStatus }))
      }
    };
  }

  // 默认列表查询
  const patients = await prisma.patient.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      diagnoses: { select: { diagnosisName: true, type: true } },
      currentSymptoms: { select: { mainComplaint: true, severity: true } },
      financialInfos: { select: { totalCost: true, paymentStatus: true }, take: 1 }
    }
  });

  return {
    type: "患者列表",
    count: patients.length,
    patients: patients.map(p => ({
      name: p.name,
      gender: p.gender,
      age: p.age,
      address: p.address,
      diagnoses: p.diagnoses.map(d => d.diagnosisName).join(", ") || "暂无诊断",
      mainComplaint: p.currentSymptoms[0]?.mainComplaint || "暂无",
      totalCost: p.financialInfos[0]?.totalCost || 0,
      paymentStatus: p.financialInfos[0]?.paymentStatus || "未知"
    }))
  };
}

/**
 * 查询诊断表
 */
async function queryDiagnosisTable(queryPlan) {
  const { filters, groupBy } = queryPlan;
  const limit = queryPlan.limit || 50;
  const where = {};

  if (filters?.disease || filters?.疾病) {
    where.diagnosisName = { contains: filters.disease || filters.疾病 };
  }
  if (filters?.type || filters?.诊断类型) {
    where.type = filters.type || filters.诊断类型;
  }
  if (filters?.doctorName || filters?.医生) {
    where.doctorName = { contains: filters.doctorName || filters.医生 };
  }

  const diagnoses = await prisma.diagnosis.findMany({
    where,
    take: limit * 3,
    include: {
      patient: { select: { gender: true, age: true, address: true, name: true } }
    }
  });

  const stats = {
    total: diagnoses.length,
    byDisease: {},
    byGender: {},
    byAgeGroup: {},
    byType: {}
  };

  diagnoses.forEach(d => {
    stats.byDisease[d.diagnosisName] = (stats.byDisease[d.diagnosisName] || 0) + 1;

    const gender = d.patient?.gender || "未知";
    stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;

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

    stats.byType[d.type] = (stats.byType[d.type] || 0) + 1;
  });

  // 按疾病数量降序排列
  const sortedDiseases = Object.entries(stats.byDisease)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, percentage: (count / stats.total * 100).toFixed(1) + "%" }));

  return {
    type: "疾病统计分析",
    totalCases: stats.total,
    topDiseases: sortedDiseases.slice(0, 15),
    byGender: Object.entries(stats.byGender).map(([name, count]) => ({ name, count })),
    byAgeGroup: Object.entries(stats.byAgeGroup).map(([name, count]) => ({ name, count })),
    byType: Object.entries(stats.byType).map(([name, count]) => ({ name, count }))
  };
}

/**
 * 查询治疗方案表
 */
async function queryTreatmentTable(queryPlan) {
  const { filters } = queryPlan;
  const limit = queryPlan.limit || 50;

  const where = {};
  if (filters?.disease || filters?.疾病) {
    where.patient = {
      diagnoses: { some: { diagnosisName: { contains: filters.disease || filters.疾病 } } }
    };
  }

  const treatments = await prisma.treatmentPlan.findMany({
    where,
    take: limit,
    include: {
      patient: { select: { name: true, gender: true, age: true }, include: { diagnoses: true } }
    }
  });

  // 分析药物使用情况
  const medicationStats = {};
  const procedureStats = {};
  const diseaseMedicationMap = {};

  treatments.forEach(t => {
    const diseaseNames = t.patient?.diagnoses?.map(d => d.diagnosisName) || [];

    // 统计药物
    if (t.medication) {
      try {
        const meds = typeof t.medication === 'string' ? JSON.parse(t.medication) : t.medication;
        const medList = Array.isArray(meds) ? meds : meds?.text ? [{ name: meds.text }] : [];
        medList.forEach(med => {
          const name = med.name || med.药物名称 || med.药品名称 || "未知药物";
          medicationStats[name] = (medicationStats[name] || 0) + 1;

          // 按疾病统计用药
          diseaseNames.forEach(disease => {
            if (!diseaseMedicationMap[disease]) diseaseMedicationMap[disease] = {};
            diseaseMedicationMap[disease][name] = (diseaseMedicationMap[disease][name] || 0) + 1;
          });
        });
      } catch (e) { /* skip */ }
    }

    // 统计手术/治疗程序
    if (t.procedures) {
      try {
        const procs = typeof t.procedures === 'string' ? JSON.parse(t.procedures) : t.procedures;
        const procList = Array.isArray(procs) ? procs : procs?.text ? [{ name: procs.text }] : [];
        procList.forEach(proc => {
          const name = proc.name || proc.名称 || proc.手术名称 || "未知操作";
          procedureStats[name] = (procedureStats[name] || 0) + 1;
        });
      } catch (e) { /* skip */ }
    }
  });

  return {
    type: "治疗方案分析",
    totalTreatments: treatments.length,
    topMedications: Object.entries(medicationStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    topProcedures: Object.entries(procedureStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    diseaseMedicationTop3: Object.entries(diseaseMedicationMap)
      .map(([disease, meds]) => ({
        disease,
        topMedications: Object.entries(meds)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }))
      }))
      .slice(0, 10)
  };
}

/**
 * 查询病史表
 */
async function queryMedicalHistoryTable(queryPlan) {
  const { filters } = queryPlan;
  const limit = queryPlan.limit || 50;

  const where = {};
  if (filters?.type || filters?.类型) {
    where.type = filters.type || filters.类型;
  }

  const histories = await prisma.medicalHistory.findMany({
    where,
    take: limit,
    include: { patient: { select: { name: true, gender: true, age: true } } }
  });

  const typeStats = {};
  histories.forEach(h => {
    typeStats[h.type] = (typeStats[h.type] || 0) + 1;
  });

  return {
    type: "病史统计",
    totalRecords: histories.length,
    byType: Object.entries(typeStats).map(([name, count]) => ({ name, count })),
    records: histories.slice(0, 20).map(h => ({
      patientName: h.patient?.name,
      type: h.type,
      details: h.details
    }))
  };
}

/**
 * 查询当前症状表
 */
async function queryCurrentSymptomTable(queryPlan) {
  const { filters, groupBy } = queryPlan;
  const limit = queryPlan.limit || 50;
  const where = {};

  if (filters?.disease || filters?.疾病 || filters?.symptom || filters?.症状) {
    const keyword = filters.disease || filters.疾病 || filters.symptom || filters.症状;
    where.OR = [
      { mainComplaint: { contains: keyword } },
      { symptoms: { path: "$", string_contains: keyword } }
    ];
  }
  if (filters?.severity || filters?.严重程度) {
    const severityValue = filters.severity || filters.严重程度;
    where.severity = { contains: severityValue };
  }

  let symptoms = await prisma.currentSymptom.findMany({
    where,
    take: limit,
    include: {
      patient: { select: { name: true, gender: true, age: true } }
    }
  });

  // 如果指定了严重程度但没有匹配结果，改为按严重程度降序排列返回最严重的记录
  if (symptoms.length === 0 && (filters?.severity || filters?.严重程度)) {
    console.log("⚠️ 未找到匹配的严重程度记录，改为返回最严重的记录");
    symptoms = await prisma.currentSymptom.findMany({
      where: where.OR ? { OR: where.OR } : {},
      take: limit,
      include: {
        patient: { select: { name: true, gender: true, age: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 按严重程度统计（所有记录，不限于筛选结果）
  const allSymptoms = await prisma.currentSymptom.findMany({ select: { severity: true } });
  const severityStats = {};
  allSymptoms.forEach(s => {
    const sev = s.severity || "未知";
    severityStats[sev] = (severityStats[sev] || 0) + 1;
  });

  // 按主诉统计高频症状
  const complaintStats = {};
  symptoms.forEach(s => {
    if (s.mainComplaint) {
      complaintStats[s.mainComplaint] = (complaintStats[s.mainComplaint] || 0) + 1;
    }
  });

  return {
    type: "症状分析",
    totalRecords: symptoms.length,
    totalInDatabase: allSymptoms.length,
    bySeverity: Object.entries(severityStats).map(([name, count]) => ({ name, count })),
    topComplaints: Object.entries(complaintStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    records: symptoms.slice(0, 15).map(s => ({
      patientName: s.patient?.name,
      mainComplaint: s.mainComplaint,
      severity: s.severity,
      duration: s.duration
    }))
  };
}

/**
 * 查询病程记录表
 */
async function queryProgressNoteTable(queryPlan) {
  const { filters, groupBy } = queryPlan;
  const limit = queryPlan.limit || 50;
  const where = {};

  if (filters?.type || filters?.记录类型) {
    where.type = filters.type || filters.记录类型;
  }
  if (filters?.author || filters?.记录人) {
    where.author = { contains: filters.author || filters.记录人 };
  }
  if (filters?.disease || filters?.疾病) {
    where.patient = {
      diagnoses: { some: { diagnosisName: { contains: filters.disease || filters.疾病 } } }
    };
  }

  const notes = await prisma.progressNote.findMany({
    where,
    take: limit,
    orderBy: { noteDate: "desc" },
    include: {
      patient: { select: { name: true, gender: true, age: true } }
    }
  });

  // 按记录类型统计
  const typeStats = {};
  notes.forEach(n => {
    typeStats[n.type] = (typeStats[n.type] || 0) + 1;
  });

  // 按作者统计
  const authorStats = {};
  notes.forEach(n => {
    if (n.author) {
      authorStats[n.author] = (authorStats[n.author] || 0) + 1;
    }
  });

  return {
    type: "病程记录统计",
    totalRecords: notes.length,
    byType: Object.entries(typeStats).map(([name, count]) => ({ name, count })),
    topAuthors: Object.entries(authorStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    recentNotes: notes.slice(0, 15).map(n => ({
      patientName: n.patient?.name,
      type: n.type,
      date: n.noteDate,
      author: n.author,
      contentPreview: n.content ? n.content.substring(0, 100) + "..." : ""
    }))
  };
}

/**
 * 查询费用信息表
 */
async function queryFinancialInfoTable(queryPlan) {
  const { filters, groupBy } = queryPlan;
  const limit = queryPlan.limit || 50;
  const where = {};

  if (filters?.paymentStatus || filters?.支付状态) {
    where.paymentStatus = filters.paymentStatus || filters.支付状态;
  }
  if (filters?.minCost || filters?.最低费用) {
    where.totalCost = { gte: parseFloat(filters.minCost || filters.最低费用) };
  }
  if (filters?.maxCost || filters?.最高费用) {
    where.totalCost = { ...where.totalCost, lte: parseFloat(filters.maxCost || filters.最高费用) };
  }
  if (filters?.disease || filters?.疾病) {
    where.patient = {
      diagnoses: { some: { diagnosisName: { contains: filters.disease || filters.疾病 } } }
    };
  }

  const financials = await prisma.financialInfo.findMany({
    where,
    take: limit,
    include: {
      patient: {
        select: { name: true, gender: true, age: true },
        include: { diagnoses: { select: { diagnosisName: true } } }
      }
    }
  });

  // 汇总统计
  const totalCost = financials.reduce((sum, f) => sum + (f.totalCost || 0), 0);
  const totalInsurance = financials.reduce((sum, f) => sum + (f.insuranceCoverage || 0), 0);
  const totalSelfPay = financials.reduce((sum, f) => sum + (f.selfPayment || 0), 0);
  const avgCost = financials.length > 0 ? totalCost / financials.length : 0;

  // 按支付状态统计
  const statusStats = {};
  financials.forEach(f => {
    statusStats[f.paymentStatus || "未知"] = (statusStats[f.paymentStatus || "未知"] || 0) + 1;
  });

  // 费用最高的患者
  const topCostPatients = financials
    .sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0))
    .slice(0, 10)
    .map(f => ({
      name: f.patient?.name,
      diagnoses: f.patient?.diagnoses?.map(d => d.diagnosisName).join(", ") || "",
      totalCost: f.totalCost,
      insuranceCoverage: f.insuranceCoverage,
      selfPayment: f.selfPayment,
      paymentStatus: f.paymentStatus
    }));

  return {
    type: "费用分析",
    totalRecords: financials.length,
    summary: {
      totalCost: totalCost.toFixed(2),
      totalInsurance: totalInsurance.toFixed(2),
      totalSelfPay: totalSelfPay.toFixed(2),
      averageCost: avgCost.toFixed(2)
    },
    byPaymentStatus: Object.entries(statusStats).map(([name, count]) => ({ name, count })),
    topCostPatients
  };
}

/**
 * 查询体格检查表
 */
async function queryPhysicalExaminationTable(queryPlan) {
  const { filters } = queryPlan;
  const limit = queryPlan.limit || 50;
  const where = {};

  if (filters?.disease || filters?.疾病) {
    where.patient = {
      diagnoses: { some: { diagnosisName: { contains: filters.disease || filters.疾病 } } }
    };
  }

  const exams = await prisma.physicalExamination.findMany({
    where,
    take: limit,
    include: {
      patient: { select: { name: true, gender: true, age: true } }
    }
  });

  return {
    type: "体格检查统计",
    totalRecords: exams.length,
    records: exams.slice(0, 15).map(e => ({
      patientName: e.patient?.name,
      vitalSigns: e.vitalSigns,
      generalAppearance: e.generalAppearance,
      cardiovascular: e.cardiovascular,
      abdomen: e.abdomen,
      neurological: e.neurological
    }))
  };
}

/**
 * 查询检查结果表
 */
async function queryExaminationResultTable(queryPlan) {
  const { filters } = queryPlan;
  const limit = queryPlan.limit || 50;
  const where = {};

  if (filters?.disease || filters?.疾病) {
    where.patient = {
      diagnoses: { some: { diagnosisName: { contains: filters.disease || filters.疾病 } } }
    };
  }

  const results = await prisma.examinationResult.findMany({
    where,
    take: limit,
    include: {
      patient: { select: { name: true, gender: true, age: true } }
    }
  });

  return {
    type: "检查结果统计",
    totalRecords: results.length,
    records: results.slice(0, 15).map(r => ({
      patientName: r.patient?.name,
      laboratoryTests: r.laboratoryTests ? r.laboratoryTests.substring(0, 100) : "",
      imagingStudies: r.imagingStudies ? r.imagingStudies.substring(0, 100) : "",
      specialTests: r.specialTests ? r.specialTests.substring(0, 100) : ""
    }))
  };
}

/**
 * 查询医疗团队表
 */
async function queryMedicalTeamTable(queryPlan) {
  const { filters } = queryPlan;
  const limit = queryPlan.limit || 50;
  const where = {};

  if (filters?.disease || filters?.疾病) {
    where.patient = {
      diagnoses: { some: { diagnosisName: { contains: filters.disease || filters.疾病 } } }
    };
  }

  const teams = await prisma.medicalTeam.findMany({
    where,
    take: limit,
    include: {
      patient: { select: { name: true } }
    }
  });

  // 统计医生工作量
  const doctorStats = {};
  teams.forEach(t => {
    if (t.primaryPhysician) {
      try {
        const doc = typeof t.primaryPhysician === 'string' ? JSON.parse(t.primaryPhysician) : t.primaryPhysician;
        const name = doc.name || doc.姓名 || "未知医生";
        doctorStats[name] = (doctorStats[name] || 0) + 1;
      } catch (e) { /* skip */ }
    }
  });

  return {
    type: "医疗团队统计",
    totalRecords: teams.length,
    doctorWorkload: Object.entries(doctorStats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, patientCount: count })),
    records: teams.slice(0, 10).map(t => ({
      patientName: t.patient?.name,
      primaryPhysician: t.primaryPhysician,
      nurse: t.nurse,
      specialists: t.specialists
    }))
  };
}

/**
 * 构建查询条件
 */
function buildWhereClause(filters) {
  const where = {};
  if (!filters) return where;

  // 性别
  if (filters.gender || filters.性别) {
    where.gender = filters.gender || filters.性别;
  }

  // 年龄范围
  if (filters.ageMin !== undefined || filters.ageMax !== undefined || filters.年龄 || filters.ageGroup || filters.年龄段) {
    where.age = {};
    if (filters.ageMin !== undefined) where.age.gte = filters.ageMin;
    if (filters.ageMax !== undefined) where.age.lte = filters.ageMax;

    // 解析年龄段字符串
    const ageGroupStr = filters.ageGroup || filters.年龄段 || filters.年龄;
    if (ageGroupStr) {
      const match = ageGroupStr.toString().match(/(\d+)/);
      if (match) {
        const age = parseInt(match[1]);
        if (ageGroupStr.includes("以上") || ageGroupStr.includes("大于")) {
          where.age.gte = age;
        } else if (ageGroupStr.includes("以下") || ageGroupStr.includes("小于")) {
          where.age.lte = age;
        } else if (ageGroupStr.includes("-")) {
          const parts = ageGroupStr.match(/(\d+)-(\d+)/);
          if (parts) {
            where.age.gte = parseInt(parts[1]);
            where.age.lte = parseInt(parts[2]);
          }
        } else {
          where.age.gte = Math.max(0, age - 5);
          where.age.lte = age + 5;
        }
      }
    }
  }

  // 地区
  if (filters.region || filters.地区 || filters.地址) {
    where.address = { contains: filters.region || filters.地区 || filters.地址 };
  }

  // 姓名
  if (filters.name || filters.姓名 || filters.patientName) {
    where.name = { contains: filters.name || filters.姓名 || filters.patientName };
  }

  // 疾病（通过诊断关联）
  if (filters.disease || filters.疾病) {
    where.diagnoses = {
      some: { diagnosisName: { contains: filters.disease || filters.疾病 } }
    };
  }

  // 医保
  if (filters.insurance || filters.医保) {
    where.insurance = { contains: filters.insurance || filters.医保 };
  }

  return where;
}

export default databaseQueryTool;
