import { get } from './index';

// 获取患者统计报表
export function getPatientReport() {
  return get('/reports/patients');
}

// 获取诊疗统计报表
export function getDiagnosisReport() {
  return get('/reports/diagnosis');
}

// 获取费用统计报表
export function getFinancialReport() {
  return get('/reports/financial');
}
