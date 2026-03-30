import { PrismaClient } from "../../../../generated/prisma/index.js";
import mimoService from "../../core/mimoLLM.js";
import VectorService from "../../core/vectorStore.js";

const prisma = new PrismaClient();
const vectorService = new VectorService();

/**
 * 患者数据生成器 - 使用小米 MIMO 大模型生成逼真的患者医疗数据
 */
class PatientDataGenerator {
  constructor() {
    this.defaultCount = 5; // 默认生成 5 个患者
  }

  /**
   * 生成单个患者数据的提示词模板
   * @param {number} patientIndex - 患者序号
   * @returns {string} 提示词
   */
  getSinglePatientPrompt(patientIndex) {
    return `你是一名专业的医疗数据专家，请生成 1 个真实、详细的患者医疗记录（这是第${patientIndex}个患者）。

## 数据要求：

### 1. 患者基本信息（patients 表）
- **姓名**: 真实的中国人名
- **性别**: "男" 或 "女"
- **年龄**: 10-90 岁之间，合理分布
- **出生日期**: 与年龄匹配的日期（格式：YYYY-MM-DD）
- **身份证号**: 符合中国身份证格式（18 位），**必须唯一**（示例：110101198001011234，每次生成时使用不同的号码）
- **手机号**: 11 位中国手机号，**必须唯一，绝对不能重复**（示例：13800138001、13900139002、13700137003 等，每次使用不同的号码）
- **紧急联系人**: JSON 格式，包含姓名、关系（配偶/父母/子女/其他）、电话
- **住址**: 详细的省市区街道地址
- **保险**: 医保类型（职工医保/居民医保/新农合/商业保险）+ 保险号
- **血型**: A 型阳性/A 型阴性/B 型阳性/B 型阴性/O 型阳性/O 型阴性/AB 型阳性/AB 型阴性
- **婚姻状况**: 未婚/已婚/离异/丧偶（与年龄匹配）
- **职业**: 公务员/教师/医生/工程师/工人/农民/自由职业/退休/学生等
- **教育程度**: 小学/初中/高中/大专/本科/硕士/博士
- **AI 同意**: true 或 false

### 2. 既往病史（medical_history 表）
每个患者 1-3 条记录，类型包括：
- 慢性疾病：高血压、糖尿病、冠心病等
- 手术史：具体手术名称和日期
- 过敏史：药物或食物过敏
- 家族史：家族遗传疾病
- 疫苗接种：疫苗接种记录

### 3. 当前症状（current_symptoms 表）
每个患者 1-2 条记录：
- **主诉**: 头痛/胸痛/发热/咳嗽/腹痛/头晕/乏力/心悸等
- **症状详情**: JSON 数组，包含症状名称、描述、持续时间、严重程度（1-10）
- **持续时间**: 如"3 天"、"1 周"等
- **严重程度**: 轻度/中度/重度
- **加重因素**: 劳累/情绪激动/天气变化/进食后等
- **缓解因素**: 休息/服药/热敷/按摩等

### 4. 体格检查（physical_examination 表）
每个患者 1-2 条记录：
- **生命体征**: 血压、心率、呼吸、体温（格式规范）
- **一般状况**: 神志清楚/发育正常/营养状况等
- **头颈部**: 检查描述
- **胸部**: 检查描述
- **心血管**: 检查描述
- **腹部**: 检查描述
- **四肢**: 检查描述
- **神经系统**: 检查描述

### 5. 检查结果（examination_results 表）
每个患者 1 条记录：
- **实验室检查**: 血常规、生化等检查结果
- **影像学检查**: X 光、CT、MRI 等检查结果
- **特殊检查**: 心电图、内镜等检查结果

### 6. 诊断记录（diagnoses 表）
每个患者 1-3 条记录：
- **ICD 编码**: 标准 ICD-10 编码格式
- **诊断名称**: 高血压/糖尿病/冠心病/哮喘/关节炎/肝炎/胃炎/肺炎等
- **类型**: 只能是"主要诊断"、"次要诊断"或"鉴别诊断"（三选一）
- **诊断日期**: 过去的日期
- **医生姓名**: 中国医生名字

### 7. 治疗方案（treatment_plans 表）
每个患者 1-2 条记录：
- **药物治疗**: JSON 数组，包含药名、剂量、频率、途径
- **手术治疗**: JSON 数组，包含手术名称、日期、结果
- **生活方式建议**: JSON 数组，包含类型（饮食/运动/作息）和建议内容
- **随访计划**: JSON 对象，包含下次预约时间、目的、医生

### 8. 病程记录（progress_notes 表）
每个患者 2-4 条记录：
- **记录日期**: 过去的日期
- **记录时间**: HH:MM:SS 格式
- **作者**: 医生或护士姓名
- **内容**: 详细的病程描述
- **类型**: 入院记录/病程记录/手术记录/出院记录

### 9. 费用信息（financial_info 表）
每个患者 1 条记录：
- **总费用**: 浮点数（如 15000.00）
- **医保报销**: 浮点数
- **自付金额**: 浮点数
- **支付状态**: 未支付/部分支付/已支付
- **支付历史**: JSON 数组，包含支付日期、金额、方式

### 10. 医疗团队（medical_team 表）
每个患者 1 条记录：
- **主治医生**: JSON 对象，包含姓名、职称、科室
- **护士**: JSON 对象，包含姓名、职称
- **专家**: JSON 数组，包含姓名、科室、职称

## 输出格式要求：

请严格按照以下 JSON 格式输出 1 个患者的数据，确保可以被 JSON.parse() 直接解析：

{
  "patient": {
      "basic_info": {
        "name": "张三",
        "gender": "男",
        "age": 45,
        "date_of_birth": "1979-05-15",
        "id_card": "110101197905151234",
        "phone": "13800138001",
        "emergency_contact": {
          "name": "李四",
          "relationship": "配偶",
          "phone": "13900139001"
        },
        "address": "北京市朝阳区建国路 100 号",
        "insurance": "职工医保:110000197905150001",
        "blood_type": "A 型阳性",
        "marital_status": "已婚",
        "occupation": "工程师",
        "education": "本科",
        "ai_consent": true
      },
      "medical_histories": [
        {
          "type": "慢性疾病",
          "details": {
            "name": "高血压",
            "diagnosed_date": "2020-03-15",
            "severity": "中度",
            "current_control": "药物控制",
            "last_review": "2024-11-01"
          }
        }
      ],
      "current_symptoms": [
        {
          "main_complaint": "头痛",
          "symptoms": [
            {
              "name": "头痛",
              "description": "持续性胀痛",
              "duration": "3 天",
              "severity": 6
            }
          ],
          "duration": "3 天",
          "severity": "中度",
          "aggravating_factors": "劳累",
          "relieving_factors": "休息"
        }
      ],
      "physical_examinations": [
        {
          "vital_signs": "血压 150/95mmHg,心率 82 次/分，呼吸 18 次/分，体温 36.5℃",
          "general_appearance": "神志清楚，发育正常",
          "head_and_neck": "无异常",
          "chest": "双肺呼吸音清",
          "cardiovascular": "心律齐，各瓣膜听诊区未闻及杂音",
          "abdomen": "腹软，无压痛",
          "extremities": "四肢活动自如",
          "neurological": "神经系统检查未见异常"
        }
      ],
      "examination_results": {
        "laboratory_tests": "血常规正常，血糖 5.2mmol/L，血脂正常",
        "imaging_studies": "心电图正常，胸片未见异常",
        "special_tests": "肝功能、肾功能正常"
      },
      "diagnoses": [
        {
          "icd_code": "I10.x00",
          "diagnosis_name": "高血压",
          "type": "主要诊断",
          "diagnosis_date": "2024-01-15",
          "doctor_name": "王医生"
        }
      ],
      "treatment_plans": [
        {
          "medication": [
            {
              "name": "硝苯地平控释片",
              "dose": "30mg",
              "frequency": "每日 1 次",
              "route": "口服"
            }
          ],
          "procedures": [],
          "lifestyle_recommendations": [
            {
              "type": "饮食",
              "recommendation": "低盐低脂饮食，每日盐摄入量<6g"
            }
          ],
          "follow_up_plan": {
            "next_appointment": "2025-02-15",
            "purpose": "复查血压",
            "doctor": "王医生"
          }
        }
      ],
      "progress_notes": [
        {
          "note_date": "2024-01-15",
          "note_time": "09:30:00",
          "author": "王医生",
          "content": "患者今日入院，神志清楚，生命体征平稳。主诉头痛 3 天，血压偏高。拟进一步完善检查，给予降压治疗。",
          "type": "入院记录"
        },
        {
          "note_date": "2024-01-17",
          "note_time": "14:20:00",
          "author": "李护士",
          "content": "患者血压控制良好，头痛症状缓解。继续当前治疗方案，观察病情变化。",
          "type": "病程记录"
        }
      ],
      "financial_info": {
        "total_cost": 15000.00,
        "insurance_coverage": 10000.00,
        "self_payment": 5000.00,
        "payment_status": "已支付",
        "payment_history": [
          {
            "date": "2024-01-15",
            "amount": 5000.00,
            "method": "医保卡"
          },
          {
            "date": "2024-01-18",
            "amount": 10000.00,
            "method": "微信支付"
          }
        ]
      },
      "medical_team": {
        "primary_physician": {
          "name": "王医生",
          "title": "主任医师",
          "department": "心血管内科"
        },
        "nurse": {
          "name": "李护士",
          "title": "护师"
        },
        "specialists": [
          {
            "name": "张专家",
            "department": "神经内科",
            "title": "副主任医师"
          }
        ]
      }
    }
  }
}

## 重要提示：
1. 只生成 1 个患者，确保数据详细、真实
2. 年龄、职业、疾病等要合理
3. 医疗数据要专业、真实、符合医学常识
4. 所有日期格式为 YYYY-MM-DD
5. **手机号和身份证号必须唯一，绝对不能与已有患者重复**
   - 身份证号：使用不同的地区码和顺序码（如：110101198001011234、310101198502023456）
   - 手机号：使用不同的号码段（如：13800138001、13900139002、13700137003、15800158004）
6. JSON 格式必须严格正确，可以被解析
7. 不要添加任何额外说明，只输出 JSON 数据

现在开始生成这 1 个患者数据：`;
  }

  /**
   * 解析 LLM 返回的 JSON 数据
   * @param {string} content - LLM 返回的内容
   * @returns {Object|null} 解析后的 JSON 对象
   */
  parseJSONResponse(content) {
    try {
      // 尝试直接解析
      return JSON.parse(content);
    } catch (e) {
      // 尝试提取 JSON 代码块
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error("解析 JSON 代码块失败:", e2);
        }
      }
      
      // 尝试查找第一个 { 和最后一个 }
      const startIdx = content.indexOf('{');
      const endIdx = content.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          return JSON.parse(content.substring(startIdx, endIdx + 1));
        } catch (e3) {
          console.error("提取 JSON 失败:", e3);
        }
      }
      
      console.error("无法解析 JSON 内容");
      return null;
    }
  }

  /**
   * 生成单个患者数据
   * @param {number} patientIndex - 患者序号
   * @returns {Promise<Object|null>} 单个患者数据
   */
  async generateSinglePatient(patientIndex) {
    try {
      const response = await mimoService.chat([
        {
          role: "user",
          content: this.getSinglePatientPrompt(patientIndex)
        }
      ], {
        maxTokens: 8192, // 单个患者需要的 token 数
        temperature: 0.8
      });

      if (!response.success) {
        throw new Error(`MIMO API 调用失败：${response.error.message}`);
      }

      // 解析返回的 JSON
      const data = this.parseJSONResponse(response.data.content);
      if (!data || !data.patient) {
        throw new Error("返回的数据格式不正确");
      }

      return data.patient;
    } catch (error) {
      console.error(`❌ 生成第${patientIndex}个患者失败:`, error.message);
      return null;
    }
  }

  /**
   * 获取数据库中最新的患者 ID 序号
   * @returns {Promise<number>} 最新序号，如果没有患者则返回 0
   */
  async getLatestPatientIndex() {
    try {
      // 查询最后一个患者
      const latestPatient = await prisma.patient.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true
        }
      });

      if (!latestPatient) {
        return 0;
      }

      // 从 ID 中提取序号，如 P2024000123 -> 123
      const idMatch = latestPatient.id.match(/P2024(\d+)/);
      if (idMatch) {
        return parseInt(idMatch[1], 10);
      }

      return 0;
    } catch (error) {
      console.error('查询最新患者 ID 失败:', error);
      return 0;
    }
  }

  /**
   * 生成患者数据并存储到数据库
   * @param {number} count - 生成患者数量，默认 5
   * @returns {Promise<Object>} 生成结果
   */
  async generateAndStore(count = 5) {
    console.log(`🚀 开始生成${count}个患者医疗数据...`);
    console.log(`📋 生成模式：生成一个，存储一个（实时入库）\n`);
    
    // 查询数据库中最新的患者 ID
    console.log('🔍 正在查询数据库中最新的患者 ID...');
    const startIndex = await this.getLatestPatientIndex();
    console.log(`📊 当前最新患者 ID 序号：${startIndex}`);
    console.log(`📝 将从序号 ${startIndex + 1} 开始生成\n`);
    
    const stats = {
      generatedSuccess: 0,
      generatedFailed: 0,
      storedSuccess: 0,
      storedFailed: 0
    };

    // 循环调用大模型，每次生成 1 个患者并立即存储
    for (let i = 0; i < count; i++) {
      const patientIndex = startIndex + i + 1;
      console.log(`\n[${i + 1}/${count}] 正在生成第${patientIndex}个患者...`);
      
      // 1. 生成患者数据（传入实际的序号）
      const patient = await this.generateSinglePatient(patientIndex);
      
      if (!patient) {
        stats.generatedFailed++;
        console.log(`   ❌ 第${patientIndex}个患者数据生成失败，跳过`);
        continue;
      }
      
      stats.generatedSuccess++;
      console.log(`   ✅ 第${patientIndex}个患者数据生成成功`);
      
      // 2. 立即存储到数据库（传入实际的序号）
      console.log(`   💾 正在存储第${patientIndex}个患者数据到数据库...`);
      const storeResult = await this.storeSinglePatientToDB(patientIndex, patient);
      
      if (storeResult.success) {
        stats.storedSuccess++;
        console.log(`   ✅ 第${patientIndex}个患者数据入库成功`);
        console.log(`   🔍 第${patientIndex}个患者向量化完成`);
      } else {
        stats.storedFailed++;
        console.log(`   ❌ 第${patientIndex}个患者数据入库失败：${storeResult.error}`);
      }

      // 添加延迟，避免 API 调用过快
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n📊 生成统计:`);
    console.log(`   - 成功生成：${stats.generatedSuccess} 个`);
    console.log(`   - 生成失败：${stats.generatedFailed} 个`);
    console.log(`\n📊 存储统计:`);
    console.log(`   - 成功入库：${stats.storedSuccess} 人`);
    console.log(`   - 入库失败：${stats.storedFailed} 人`);
    
    return {
      success: stats.storedSuccess > 0,
      count: stats.storedSuccess,
      generationStats: {
        success: stats.generatedSuccess,
        failed: stats.generatedFailed
      },
      storageStats: {
        success: stats.storedSuccess,
        failed: stats.storedFailed
      }
    };
  }

  /**
   * 存储单个患者到数据库
   * @param {number} patientIndex - 患者序号
   * @param {Object} patient - 患者数据
   * @returns {Promise<Object>} 存储结果
   */
  async storeSinglePatientToDB(patientIndex, patient) {
    try {
      // 生成患者 ID
      const patientId = `P2024${String(patientIndex).padStart(6, '0')}`;
      
      // 1. 插入患者基本信息
      const createdPatient = await prisma.patient.create({
        data: {
          id: patientId,
          name: patient.basic_info.name,
          gender: patient.basic_info.gender,
          age: patient.basic_info.age,
          dateOfBirth: new Date(patient.basic_info.date_of_birth),
          idCard: patient.basic_info.id_card,
          phone: patient.basic_info.phone,
          emergencyContact: patient.basic_info.emergency_contact,
          address: patient.basic_info.address,
          insurance: patient.basic_info.insurance,
          bloodType: patient.basic_info.blood_type,
          maritalStatus: patient.basic_info.marital_status,
          occupation: patient.basic_info.occupation,
          education: patient.basic_info.education,
          aiConsent: patient.basic_info.ai_consent,
          vectorVersion: "v1.0",
          aiNotes: JSON.stringify({ generated_by: "MIMO_LLM", generated_at: new Date().toISOString() })
        }
      });

      // 2. 插入既往病史
      if (patient.medical_histories && patient.medical_histories.length > 0) {
        await prisma.medicalHistory.createMany({
          data: patient.medical_histories.map(h => ({
            patientId: createdPatient.id,
            type: h.type,
            details: h.details,
            createdAt: new Date()
          }))
        });
      }

      // 3. 插入当前症状
      if (patient.current_symptoms && patient.current_symptoms.length > 0) {
        await prisma.currentSymptom.createMany({
          data: patient.current_symptoms.map(s => ({
            patientId: createdPatient.id,
            mainComplaint: s.main_complaint,
            symptoms: s.symptoms,
            duration: s.duration,
            severity: s.severity,
            aggravatingFactors: s.aggravating_factors,
            relievingFactors: s.relieving_factors,
            createdAt: new Date()
          }))
        });
      }

      // 4. 插入体格检查
      if (patient.physical_examinations && patient.physical_examinations.length > 0) {
        await prisma.physicalExamination.createMany({
          data: patient.physical_examinations.map(p => ({
            patientId: createdPatient.id,
            vitalSigns: p.vital_signs,
            generalAppearance: p.general_appearance,
            headAndNeck: p.head_and_neck,
            chest: p.chest,
            cardiovascular: p.cardiovascular,
            abdomen: p.abdomen,
            extremities: p.extremities,
            neurological: p.neurological,
            createdAt: new Date()
          }))
        });
      }

      // 5. 插入检查结果
      if (patient.examination_results) {
        await prisma.examinationResult.create({
          data: {
            patientId: createdPatient.id,
            laboratoryTests: patient.examination_results.laboratory_tests,
            imagingStudies: patient.examination_results.imaging_studies,
            specialTests: patient.examination_results.special_tests,
            createdAt: new Date()
          }
        });
      }

      // 6. 插入诊断记录
      if (patient.diagnoses && patient.diagnoses.length > 0) {
        await prisma.diagnosis.createMany({
          data: patient.diagnoses.map(d => ({
            patientId: createdPatient.id,
            icdCode: d.icd_code,
            diagnosisName: d.diagnosis_name,
            type: d.type,
            diagnosisDate: new Date(d.diagnosis_date),
            doctorName: d.doctor_name,
            createdAt: new Date()
          }))
        });
      }

      // 7. 插入治疗方案
      if (patient.treatment_plans && patient.treatment_plans.length > 0) {
        await prisma.treatmentPlan.createMany({
          data: patient.treatment_plans.map(t => ({
            patientId: createdPatient.id,
            medication: t.medication,
            procedures: t.procedures,
            lifestyleRecommendations: t.lifestyle_recommendations,
            followUpPlan: t.follow_up_plan,
            createdAt: new Date()
          }))
        });
      }

      // 8. 插入病程记录
      if (patient.progress_notes && patient.progress_notes.length > 0) {
        await prisma.progressNote.createMany({
          data: patient.progress_notes.map(n => ({
            patientId: createdPatient.id,
            noteDate: new Date(n.note_date),
            noteTime: n.note_time,
            author: n.author,
            content: n.content,
            type: n.type,
            createdAt: new Date()
          }))
        });
      }

      // 9. 插入费用信息
      if (patient.financial_info) {
        await prisma.financialInfo.create({
          data: {
            patientId: createdPatient.id,
            totalCost: patient.financial_info.total_cost,
            insuranceCoverage: patient.financial_info.insurance_coverage,
            selfPayment: patient.financial_info.self_payment,
            paymentStatus: patient.financial_info.payment_status,
            paymentHistory: patient.financial_info.payment_history,
            createdAt: new Date()
          }
        });
      }

      // 10. 插入医疗团队
      if (patient.medical_team) {
        await prisma.medicalTeam.create({
          data: {
            patientId: createdPatient.id,
            primaryPhysician: patient.medical_team.primary_physician,
            nurse: patient.medical_team.nurse,
            specialists: patient.medical_team.specialists,
            createdAt: new Date()
          }
        });
      }

      // 11. 生成患者向量数据
      await this.generatePatientVector(createdPatient, patient);

      return {
        success: true,
        patientId: createdPatient.id,
        patientName: patient.basic_info.name
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 将患者数据存储到数据库
   * @param {Array} patients - 患者数据数组
   * @returns {Promise<Object>} 存储结果
   */
  async storePatientsToDB(patients) {
    const stats = {
      insertedCount: 0,
      failedCount: 0,
      errors: []
    };

    console.log("💾 开始存储患者数据到数据库...");

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const patientIndex = i + 1;
      
      try {
        // 生成患者 ID
        const patientId = `P2024${String(patientIndex).padStart(6, '0')}`;
        
        // 1. 插入患者基本信息
        const createdPatient = await prisma.patient.create({
          data: {
            id: patientId,
            name: patient.basic_info.name,
            gender: patient.basic_info.gender,
            age: patient.basic_info.age,
            dateOfBirth: new Date(patient.basic_info.date_of_birth),
            idCard: patient.basic_info.id_card,
            phone: patient.basic_info.phone,
            emergencyContact: patient.basic_info.emergency_contact,
            address: patient.basic_info.address,
            insurance: patient.basic_info.insurance,
            bloodType: patient.basic_info.blood_type,
            maritalStatus: patient.basic_info.marital_status,
            occupation: patient.basic_info.occupation,
            education: patient.basic_info.education,
            aiConsent: patient.basic_info.ai_consent,
            vectorVersion: "v1.0",
            aiNotes: JSON.stringify({ generated_by: "MIMO_LLM", generated_at: new Date().toISOString() })
          }
        });

        // 2. 插入既往病史
        if (patient.medical_histories && patient.medical_histories.length > 0) {
          await prisma.medicalHistory.createMany({
            data: patient.medical_histories.map(h => ({
              patientId: createdPatient.id,
              type: h.type,
              details: h.details,
              createdAt: new Date()
            }))
          });
        }

        // 3. 插入当前症状
        if (patient.current_symptoms && patient.current_symptoms.length > 0) {
          await prisma.currentSymptom.createMany({
            data: patient.current_symptoms.map(s => ({
              patientId: createdPatient.id,
              mainComplaint: s.main_complaint,
              symptoms: s.symptoms,
              duration: s.duration,
              severity: s.severity,
              aggravatingFactors: s.aggravating_factors,
              relievingFactors: s.relieving_factors,
              createdAt: new Date()
            }))
          });
        }

        // 4. 插入体格检查
        if (patient.physical_examinations && patient.physical_examinations.length > 0) {
          await prisma.physicalExamination.createMany({
            data: patient.physical_examinations.map(p => ({
              patientId: createdPatient.id,
              vitalSigns: p.vital_signs,
              generalAppearance: p.general_appearance,
              headAndNeck: p.head_and_neck,
              chest: p.chest,
              cardiovascular: p.cardiovascular,
              abdomen: p.abdomen,
              extremities: p.extremities,
              neurological: p.neurological,
              createdAt: new Date()
            }))
          });
        }

        // 5. 插入检查结果
        if (patient.examination_results) {
          await prisma.examinationResult.create({
            data: {
              patientId: createdPatient.id,
              laboratoryTests: patient.examination_results.laboratory_tests,
              imagingStudies: patient.examination_results.imaging_studies,
              specialTests: patient.examination_results.special_tests,
              createdAt: new Date()
            }
          });
        }

        // 6. 插入诊断记录
        if (patient.diagnoses && patient.diagnoses.length > 0) {
          await prisma.diagnosis.createMany({
            data: patient.diagnoses.map(d => ({
              patientId: createdPatient.id,
              icdCode: d.icd_code,
              diagnosisName: d.diagnosis_name,
              type: d.type,
              diagnosisDate: new Date(d.diagnosis_date),
              doctorName: d.doctor_name,
              createdAt: new Date()
            }))
          });
        }

        // 7. 插入治疗方案
        if (patient.treatment_plans && patient.treatment_plans.length > 0) {
          await prisma.treatmentPlan.createMany({
            data: patient.treatment_plans.map(t => ({
              patientId: createdPatient.id,
              medication: t.medication,
              procedures: t.procedures,
              lifestyleRecommendations: t.lifestyle_recommendations,
              followUpPlan: t.follow_up_plan,
              createdAt: new Date()
            }))
          });
        }

        // 8. 插入病程记录
        if (patient.progress_notes && patient.progress_notes.length > 0) {
          await prisma.progressNote.createMany({
            data: patient.progress_notes.map(n => ({
              patientId: createdPatient.id,
              noteDate: new Date(n.note_date),
              noteTime: n.note_time,
              author: n.author,
              content: n.content,
              type: n.type,
              createdAt: new Date()
            }))
          });
        }

        // 9. 插入费用信息
        if (patient.financial_info) {
          await prisma.financialInfo.create({
            data: {
              patientId: createdPatient.id,
              totalCost: patient.financial_info.total_cost,
              insuranceCoverage: patient.financial_info.insurance_coverage,
              selfPayment: patient.financial_info.self_payment,
              paymentStatus: patient.financial_info.payment_status,
              paymentHistory: patient.financial_info.payment_history,
              createdAt: new Date()
            }
          });
        }

        // 10. 插入医疗团队
        if (patient.medical_team) {
          await prisma.medicalTeam.create({
            data: {
              patientId: createdPatient.id,
              primaryPhysician: patient.medical_team.primary_physician,
              nurse: patient.medical_team.nurse,
              specialists: patient.medical_team.specialists,
              createdAt: new Date()
            }
          });
        }

        // 11. 生成患者向量数据
        await this.generatePatientVector(createdPatient, patient);

        stats.insertedCount++;
        console.log(`✅ [${patientIndex}/${patients.length}] 患者 ${patient.basic_info.name} 数据入库成功`);

      } catch (error) {
        stats.failedCount++;
        stats.errors.push({
          patientIndex: patientIndex,
          patientName: patient.basic_info?.name,
          error: error.message
        });
        console.error(`❌ [${patientIndex}/${patients.length}] 患者 ${patient.basic_info?.name} 数据入库失败:`, error.message);
      }
    }

    console.log("\n📊 存储统计:");
    console.log(`   - 成功：${stats.insertedCount} 人`);
    console.log(`   - 失败：${stats.failedCount} 人`);
    
    return stats;
  }

  /**
   * 生成患者向量数据
   * @param {Object} patient - 数据库中的患者记录
   * @param {Object} rawData - 原始患者数据
   */
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

  /**
   * 清空现有患者数据
   */
  async clearExistingData() {
    console.log("🗑️  正在清空现有患者数据...");
    
    try {
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
      
      console.log("✅ 数据清理完成");
    } catch (error) {
      console.error("❌ 数据清理失败:", error);
      throw error;
    }
  }
}

// 创建单例实例
const patientDataGenerator = new PatientDataGenerator();

export default patientDataGenerator;
export { PatientDataGenerator };
