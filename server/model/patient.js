import prisma from '../prisma/index.js';

/**
 * 获取患者列表（分页+搜索+筛选）
 */
export async function getPatientList({ page = 1, pageSize = 20, keyword = '', filter = '' }) {
  try {
    const where = {};

    // 关键词搜索（姓名、电话、身份证）
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
        { idCard: { contains: keyword } }
      ];
    }

    // 筛选条件
    if (filter === '高风险') {
      where.diagnoses = { some: { type: '主要诊断' } };
    } else if (filter === '已分析') {
      where.aiConsent = true;
    } else if (filter === '待分析') {
      where.aiConsent = false;
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          diagnoses: {
            select: { diagnosisName: true, type: true },
            take: 3
          },
          financialInfos: {
            select: { totalCost: true, paymentStatus: true },
            take: 1
          }
        }
      }),
      prisma.patient.count({ where })
    ]);

    return {
      success: true,
      data: {
        patients,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    };
  } catch (error) {
    console.error('❌ 获取患者列表失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 根据ID获取患者详情
 */
export async function getPatientById(id) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        medicalHistories: true,
        currentSymptoms: true,
        physicalExaminations: true,
        examinationResults: true,
        diagnoses: true,
        treatmentPlans: true,
        progressNotes: { orderBy: { noteDate: 'desc' }, take: 10 },
        financialInfos: true,
        medicalTeams: true
      }
    });

    if (!patient) {
      return { success: false, error: { code: 'NOT_FOUND', message: '患者不存在' } };
    }

    return { success: true, data: patient };
  } catch (error) {
    console.error('❌ 获取患者详情失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 创建患者
 */
export async function createPatient(data) {
  try {
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        gender: data.gender || '男',
        age: data.age ? parseInt(data.age) : null,
        phone: data.phone || null,
        idCard: data.idCard || null,
        address: data.address || null,
        insurance: data.insurance || null,
        bloodType: data.bloodType || null,
        maritalStatus: data.maritalStatus || null,
        occupation: data.occupation || null,
        education: data.education || null,
        aiConsent: data.aiConsent || false,
        // 诊疗信息
        ...(data.complaint && {
          currentSymptoms: {
            create: { mainComplaint: data.complaint, symptoms: [] }
          }
        }),
        ...(data.diagnosis && {
          diagnoses: {
            create: { diagnosisName: data.diagnosis, type: '主要诊断' }
          }
        }),
        ...(data.plan && {
          treatmentPlans: {
            create: { medication: { text: data.plan } }
          }
        }),
        ...(data.aiNotes && {
          aiNotes: { text: data.aiNotes }
        })
      }
    });

    return { success: true, data: patient };
  } catch (error) {
    console.error('❌ 创建患者失败:', error);
    if (error.code === 'P2002') {
      return { success: false, error: { code: 'DUPLICATE', message: '患者信息已存在（电话或身份证重复）' } };
    }
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 更新患者信息
 */
export async function updatePatient(id, data) {
  try {
    // 更新基础信息
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.gender && { gender: data.gender }),
        ...(data.age !== undefined && { age: data.age ? parseInt(data.age) : null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.idCard !== undefined && { idCard: data.idCard || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.insurance !== undefined && { insurance: data.insurance || null }),
        ...(data.bloodType !== undefined && { bloodType: data.bloodType || null }),
        ...(data.occupation !== undefined && { occupation: data.occupation || null }),
        ...(data.aiConsent !== undefined && { aiConsent: data.aiConsent }),
        ...(data.aiNotes !== undefined && { aiNotes: data.aiNotes ? { text: data.aiNotes } : null })
      }
    });

    // 更新主诉 → currentSymptoms
    if (data.complaint !== undefined) {
      const existing = await prisma.currentSymptom.findFirst({ where: { patientId: id } });
      if (existing) {
        await prisma.currentSymptom.update({
          where: { id: existing.id },
          data: { mainComplaint: data.complaint || '' }
        });
      } else if (data.complaint) {
        await prisma.currentSymptom.create({
          data: { patientId: id, mainComplaint: data.complaint, symptoms: [] }
        });
      }
    }

    // 更新诊断 → diagnoses
    if (data.diagnosis !== undefined) {
      const existing = await prisma.diagnosis.findFirst({
        where: { patientId: id, type: '主要诊断' }
      });
      if (existing) {
        await prisma.diagnosis.update({
          where: { id: existing.id },
          data: { diagnosisName: data.diagnosis || '' }
        });
      } else if (data.diagnosis) {
        await prisma.diagnosis.create({
          data: { patientId: id, diagnosisName: data.diagnosis, type: '主要诊断' }
        });
      }
    }

    // 更新治疗方案 → treatmentPlans
    if (data.plan !== undefined) {
      const existing = await prisma.treatmentPlan.findFirst({ where: { patientId: id } });
      if (existing) {
        await prisma.treatmentPlan.update({
          where: { id: existing.id },
          data: { medication: data.plan ? { text: data.plan } : null }
        });
      } else if (data.plan) {
        await prisma.treatmentPlan.create({
          data: { patientId: id, medication: { text: data.plan } }
        });
      }
    }

    // 重新查询完整患者数据（含关联记录）
    const fullPatient = await prisma.patient.findUnique({
      where: { id },
      include: {
        currentSymptoms: true,
        diagnoses: true,
        treatmentPlans: true,
        medicalHistories: true,
        physicalExaminations: true,
        examinationResults: true,
        progressNotes: { orderBy: { noteDate: 'desc' }, take: 10 },
        financialInfos: true,
        medicalTeams: true
      }
    });

    return { success: true, data: fullPatient };
  } catch (error) {
    console.error('❌ 更新患者失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 删除患者
 */
export async function deletePatient(id) {
  try {
    await prisma.patient.delete({ where: { id } });
    return { success: true, data: { message: '患者删除成功' } };
  } catch (error) {
    console.error('❌ 删除患者失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

/**
 * 获取患者统计数据
 */
export async function getPatientSummary() {
  try {
    const [totalPatients, aiConsented, highRiskCount, diagnosisCount, financialData] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { aiConsent: true } }),
      prisma.patient.count({
        where: { aiNotes: { path: ['analysis', 'riskLevel'], equals: 'high' } }
      }),
      prisma.diagnosis.groupBy({
        by: ['diagnosisName'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      prisma.financialInfo.aggregate({
        _sum: { totalCost: true },
        _count: { id: true }
      })
    ]);

    const totalCost = financialData._sum.totalCost || 0;

    // 诊断分布统计
    const diagnosisDistribution = diagnosisCount.map(d => ({
      name: d.diagnosisName,
      count: d._count.id
    }));

    return {
      success: true,
      data: {
        totalPatients,
        aiCoverage: totalPatients > 0 ? Math.round((aiConsented / totalPatients) * 100) : 0,
        highRisk: highRiskCount,
        totalCost: Math.round(totalCost),
        diagnosisDistribution
      }
    };
  } catch (error) {
    console.error('❌ 获取患者统计失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
