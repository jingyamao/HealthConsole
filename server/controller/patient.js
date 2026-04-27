import * as patientModel from '../model/patient.js';

/**
 * 获取患者列表
 */
export async function list(ctx) {
  try {
    const { page = 1, pageSize = 20, keyword = '', filter = '' } = ctx.query;
    const result = await patientModel.getPatientList({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      filter
    });

    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取患者列表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 获取患者详情
 */
export async function detail(ctx) {
  try {
    const { id } = ctx.params;
    const result = await patientModel.getPatientById(id);

    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = result.error.code === 'NOT_FOUND' ? 404 : 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取患者详情错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 创建患者
 */
export async function create(ctx) {
  try {
    const data = ctx.request.body;
    if (!data.name) {
      ctx.status = 400;
      ctx.body = { success: false, error: { code: 'MISSING_NAME', message: '患者姓名不能为空' } };
      return;
    }

    const result = await patientModel.createPatient(data);

    if (result.success) {
      ctx.status = 201;
      ctx.body = result;
    } else {
      ctx.status = result.error.code === 'DUPLICATE' ? 409 : 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 创建患者错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 更新患者
 */
export async function update(ctx) {
  try {
    const { id } = ctx.params;
    const data = ctx.request.body;
    const result = await patientModel.updatePatient(id, data);

    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 更新患者错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 删除患者
 */
export async function remove(ctx) {
  try {
    const { id } = ctx.params;
    const result = await patientModel.deletePatient(id);

    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 删除患者错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 获取患者统计数据
 */
export async function summary(ctx) {
  try {
    const result = await patientModel.getPatientSummary();

    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取患者统计错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
