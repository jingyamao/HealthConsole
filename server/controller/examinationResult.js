import * as examinationResultModel from '../model/examinationResult.js';

export async function list(ctx) {
  try {
    const { patientId } = ctx.params;
    const result = await examinationResultModel.getByPatientId(patientId);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取检查结果列表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function detail(ctx) {
  try {
    const { id } = ctx.params;
    const result = await examinationResultModel.getById(id);
    ctx.status = result.success ? 200 : (result.error.code === 'NOT_FOUND' ? 404 : 500);
    ctx.body = result;
  } catch (error) {
    console.error('❌ 获取检查结果详情错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function create(ctx) {
  try {
    const { patientId } = ctx.params;
    const data = ctx.request.body;
    const result = await examinationResultModel.create(patientId, data);
    ctx.status = result.success ? 201 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 创建检查结果错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function update(ctx) {
  try {
    const { id } = ctx.params;
    const data = ctx.request.body;
    const result = await examinationResultModel.update(id, data);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 更新检查结果错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

export async function remove(ctx) {
  try {
    const { id } = ctx.params;
    const result = await examinationResultModel.remove(id);
    ctx.status = result.success ? 200 : 500;
    ctx.body = result;
  } catch (error) {
    console.error('❌ 删除检查结果错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
