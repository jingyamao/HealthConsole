import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.currentSymptom.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取症状记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.currentSymptom.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '症状记录不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取症状记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.currentSymptom.create({
      data: {
        patientId,
        mainComplaint: data.mainComplaint || '',
        symptoms: data.symptoms || [],
        duration: data.duration || null,
        severity: data.severity || null,
        aggravatingFactors: data.aggravatingFactors || null,
        relievingFactors: data.relievingFactors || null
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建症状记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.currentSymptom.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.mainComplaint !== undefined && { mainComplaint: data.mainComplaint }),
        ...(data.symptoms !== undefined && { symptoms: data.symptoms }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.severity !== undefined && { severity: data.severity }),
        ...(data.aggravatingFactors !== undefined && { aggravatingFactors: data.aggravatingFactors }),
        ...(data.relievingFactors !== undefined && { relievingFactors: data.relievingFactors })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新症状记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.currentSymptom.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '症状记录删除成功' } };
  } catch (error) {
    console.error('❌ 删除症状记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
