import * as reportModel from '../model/report.js';

/**
 * 获取患者统计报表
 */
export async function patientReport(ctx) {
  try {
    const result = await reportModel.getPatientReport();
    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取患者报表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 获取诊疗统计报表
 */
export async function diagnosisReport(ctx) {
  try {
    const result = await reportModel.getDiagnosisReport();
    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取诊疗报表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 获取费用统计报表
 */
export async function financialReport(ctx) {
  try {
    const result = await reportModel.getFinancialReport();
    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取费用报表错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
