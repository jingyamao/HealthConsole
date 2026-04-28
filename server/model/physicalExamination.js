import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.physicalExamination.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取体格检查失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.physicalExamination.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '体格检查记录不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取体格检查失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.physicalExamination.create({
      data: {
        patientId,
        vitalSigns: data.vitalSigns || null,
        generalAppearance: data.generalAppearance || null,
        headAndNeck: data.headAndNeck || null,
        chest: data.chest || null,
        cardiovascular: data.cardiovascular || null,
        abdomen: data.abdomen || null,
        extremities: data.extremities || null,
        neurological: data.neurological || null
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建体格检查失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.physicalExamination.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.vitalSigns !== undefined && { vitalSigns: data.vitalSigns }),
        ...(data.generalAppearance !== undefined && { generalAppearance: data.generalAppearance }),
        ...(data.headAndNeck !== undefined && { headAndNeck: data.headAndNeck }),
        ...(data.chest !== undefined && { chest: data.chest }),
        ...(data.cardiovascular !== undefined && { cardiovascular: data.cardiovascular }),
        ...(data.abdomen !== undefined && { abdomen: data.abdomen }),
        ...(data.extremities !== undefined && { extremities: data.extremities }),
        ...(data.neurological !== undefined && { neurological: data.neurological })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新体格检查失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.physicalExamination.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '体格检查记录删除成功' } };
  } catch (error) {
    console.error('❌ 删除体格检查失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
