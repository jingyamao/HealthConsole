import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.diagnosis.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取诊断记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.diagnosis.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '诊断记录不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取诊断记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.diagnosis.create({
      data: {
        patientId,
        icdCode: data.icdCode || null,
        diagnosisName: data.diagnosisName,
        type: data.type || '主要诊断',
        diagnosisDate: data.diagnosisDate ? new Date(data.diagnosisDate) : null,
        doctorName: data.doctorName || null
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建诊断记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.diagnosis.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.icdCode !== undefined && { icdCode: data.icdCode }),
        ...(data.diagnosisName && { diagnosisName: data.diagnosisName }),
        ...(data.type && { type: data.type }),
        ...(data.diagnosisDate !== undefined && { diagnosisDate: data.diagnosisDate ? new Date(data.diagnosisDate) : null }),
        ...(data.doctorName !== undefined && { doctorName: data.doctorName })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新诊断记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.diagnosis.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '诊断记录删除成功' } };
  } catch (error) {
    console.error('❌ 删除诊断记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
