import { get } from './index';

// 获取首页仪表盘汇总数据
export function getDashboardOverview() {
  return get('/dashboard/overview');
}

// 获取仪表盘详细数据（趋势、科室、热力图、预警）
export function getDashboardDetail() {
  return get('/dashboard/detail');
}
