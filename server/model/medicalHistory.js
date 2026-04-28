import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.medicalHistory.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取病史记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.medicalHistory.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '病史记录不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取病史记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.medicalHistory.create({
      data: {
        patientId,
        type: data.type || '慢性疾病',
        details: data.details || {}
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建病史记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.medicalHistory.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.details && { details: data.details })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新病史记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.medicalHistory.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '病史记录删除成功' } };
  } catch (error) {
    console.error('❌ 删除病史记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
