import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.medicalTeam.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取医疗团队失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.medicalTeam.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '医疗团队记录不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取医疗团队失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.medicalTeam.create({
      data: {
        patientId,
        primaryPhysician: data.primaryPhysician || null,
        nurse: data.nurse || null,
        specialists: data.specialists || null
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建医疗团队失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.medicalTeam.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.primaryPhysician !== undefined && { primaryPhysician: data.primaryPhysician }),
        ...(data.nurse !== undefined && { nurse: data.nurse }),
        ...(data.specialists !== undefined && { specialists: data.specialists })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新医疗团队失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.medicalTeam.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '医疗团队记录删除成功' } };
  } catch (error) {
    console.error('❌ 删除医疗团队失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
