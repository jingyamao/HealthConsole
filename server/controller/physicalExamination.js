import * as physicalExaminationModel from '../model/physicalExamination.js';

export async function list(ctx) {
  try {
    const { patientId } = ctx.params;
    const result = await physicalExaminationModel.getByPatientId(patientId);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取体格检查列表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function detail(ctx) {
  try {
    const { id } = ctx.params;
    const result = await physicalExaminationModel.getById(id);
    ctx.status = result.success ? 200 : (result.error.code === 'NOT_FOUND' ? 404 : 500);
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取体格检查详情错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function create(ctx) {
  try {
    const { patientId } = ctx.params;
    const data = ctx.request.body;
    const result = await physicalExaminationModel.create(patientId, data);
    ctx.status = result.success ? 201 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 创建体格检查错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function update(ctx) {
  try {
    const { id } = ctx.params;
    const data = ctx.request.body;
    const result = await physicalExaminationModel.update(id, data);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 更新体格检查错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function remove(ctx) {
  try {
    const { id } = ctx.params;
    const result = await physicalExaminationModel.remove(id);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 删除体格检查错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
