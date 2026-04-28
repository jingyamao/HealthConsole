import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.treatmentPlan.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取治疗方案失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.treatmentPlan.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '治疗方案不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取治疗方案失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.treatmentPlan.create({
      data: {
        patientId,
        medication: data.medication || null,
        procedures: data.procedures || null,
        lifestyleRecommendations: data.lifestyleRecommendations || null,
        followUpPlan: data.followUpPlan || null
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建治疗方案失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.treatmentPlan.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.medication !== undefined && { medication: data.medication }),
        ...(data.procedures !== undefined && { procedures: data.procedures }),
        ...(data.lifestyleRecommendations !== undefined && { lifestyleRecommendations: data.lifestyleRecommendations }),
        ...(data.followUpPlan !== undefined && { followUpPlan: data.followUpPlan })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新治疗方案失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.treatmentPlan.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '治疗方案删除成功' } };
  } catch (error) {
    console.error('❌ 删除治疗方案失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
