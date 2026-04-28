import prisma from '../prisma/index.js';

export async function getByPatientId(patientId) {
  try {
    const records = await prisma.progressNote.findMany({
      where: { patientId },
      orderBy: { noteDate: 'desc' }
    });
    return { success: true, data: records };
  } catch (error) {
    console.error('❌ 获取病程记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function getById(id) {
  try {
    const record = await prisma.progressNote.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: '病程记录不存在' } };
    }
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 获取病程记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function create(patientId, data) {
  try {
    const record = await prisma.progressNote.create({
      data: {
        patientId,
        noteDate: new Date(data.noteDate || Date.now()),
        noteTime: data.noteTime || null,
        author: data.author,
        content: data.content,
        type: data.type || '病程记录'
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 创建病程记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function update(id, data) {
  try {
    const record = await prisma.progressNote.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.noteDate !== undefined && { noteDate: new Date(data.noteDate) }),
        ...(data.noteTime !== undefined && { noteTime: data.noteTime }),
        ...(data.author && { author: data.author }),
        ...(data.content && { content: data.content }),
        ...(data.type && { type: data.type })
      }
    });
    return { success: true, data: record };
  } catch (error) {
    console.error('❌ 更新病程记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}

export async function remove(id) {
  try {
    await prisma.progressNote.delete({ where: { id: parseInt(id) } });
    return { success: true, data: { message: '病程记录删除成功' } };
  } catch (error) {
    console.error('❌ 删除病程记录失败:', error);
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
}
