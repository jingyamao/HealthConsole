import * as progressNoteModel from '../model/progressNote.js';

export async function list(ctx) {
  try {
    const { patientId } = ctx.params;
    const result = await progressNoteModel.getByPatientId(patientId);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取病程记录列表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function detail(ctx) {
  try {
    const { id } = ctx.params;
    const result = await progressNoteModel.getById(id);
    ctx.status = result.success ? 200 : (result.error.code === 'NOT_FOUND' ? 404 : 500);
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取病程记录详情错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function create(ctx) {
  try {
    const { patientId } = ctx.params;
    const data = ctx.request.body;
    if (!data.author || !data.content) {
      ctx.status = 400;
      ctx.body = { success: false, error: { code: 'MISSING_FIELD', message: '作者和内容不能为空' } };
      return;
    }
    const result = await progressNoteModel.create(patientId, data);
    ctx.status = result.success ? 201 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 创建病程记录错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function update(ctx) {
  try {
    const { id } = ctx.params;
    const data = ctx.request.body;
    const result = await progressNoteModel.update(id, data);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 更新病程记录错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function remove(ctx) {
  try {
    const { id } = ctx.params;
    const result = await progressNoteModel.remove(id);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 删除病程记录错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
