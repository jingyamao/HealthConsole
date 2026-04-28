import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.financialInfo.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取财务信息失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.financialInfo.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '财务信息不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取财务信息失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.financialInfo.create({
      data: {
        patientId,
        totalCost: data.totalCost || 0,
        insuranceCoverage: data.insuranceCoverage || 0,
        selfPayment: data.selfPayment || 0,
        paymentStatus: data.paymentStatus || '未支付',
        paymentHistory: data.paymentHistory || null
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建财务信息失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.financialInfo.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.totalCost !== undefined && { totalCost: data.totalCost }),
        ...(data.insuranceCoverage !== undefined && { insuranceCoverage: data.insuranceCoverage }),
        ...(data.selfPayment !== undefined && { selfPayment: data.selfPayment }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.paymentHistory !== undefined && { paymentHistory: data.paymentHistory })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新财务信息失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.financialInfo.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '财务信息删除成功' } };
  } catch (error) {
    console.error('❌ 删除财务信息失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
