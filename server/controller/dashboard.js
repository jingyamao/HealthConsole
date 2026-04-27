import * as dashboardModel from '../model/dashboard.js';

/**
 * 获取首页仪表盘汇总数据
 */
export async function overview(ctx) {
  try {
    const result = await dashboardModel.getDashboardOverview();
    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取仪表盘数据错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}

/**
 * 获取仪表盘详细数据
 */
export async function detail(ctx) {
  try {
    const result = await dashboardModel.getDashboardDetail();
    if (result.success) {
      ctx.body = result;
    } else {
      ctx.status = 500;
      ctx.body = result;
    }
  } catch (error) {
    console.error('❌ 获取仪表盘详细数据错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
}
