import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.examinationResult.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取检查结果失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.examinationResult.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '检查结果不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取检查结果失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.examinationResult.create({
      data: {
        patientId,
        laboratoryTests: data.laboratoryTests || null,
        imagingStudies: data.imagingStudies || null,
        specialTests: data.specialTests || null
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建检查结果失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.examinationResult.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.laboratoryTests !== undefined && { laboratoryTests: data.laboratoryTests }),
        ...(data.imagingStudies !== undefined && { imagingStudies: data.imagingStudies }),
        ...(data.specialTests !== undefined && { specialTests: data.specialTests })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新检查结果失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.examinationResult.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '检查结果删除成功' } };
  } catch (error) {
    console.error('❌ 删除检查结果失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
