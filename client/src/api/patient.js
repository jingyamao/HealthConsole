import { get, post, put, del } from './index';

// 获取患者列表
export function getPatientList(params) {
  return get('/patients', params);
}

// 获取患者详情
export function getPatientById(id) {
  return get(`/patients/${id}`);
}

// 创建患者
export function createPatient(data) {
  return post('/patients', data);
}

// 更新患者
export function updatePatient(id, data) {
  return put(`/patients/${id}`, data);
}

// 删除患者
export function deletePatient(id) {
  return del(`/patients/${id}`);
}

// 获取患者统计数据
export function getPatientSummary() {
  return get('/patients/summary');
}

// ===== 子记录通用 CRUD =====
const subRecordApi = (resource) => ({
  list: (patientId) => get(`/patients/${patientId}/${resource}`),
  get: (patientId, id) => get(`/patients/${patientId}/${resource}/${id}`),
  create: (patientId, data) => post(`/patients/${patientId}/${resource}`, data),
  update: (patientId, id, data) => put(`/patients/${patientId}/${resource}/${id}`, data),
  remove: (patientId, id) => del(`/patients/${patientId}/${resource}/${id}`),
});

// 病史记录
export const medicalHistoryApi = subRecordApi('medical-history');

// 当前症状
export const currentSymptomApi = subRecordApi('symptoms');

// 体格检查
export const physicalExamApi = subRecordApi('physical-exam');

// 检查结果
export const examinationResultApi = subRecordApi('examination-results');

// 诊断记录
export const diagnosisApi = subRecordApi('diagnoses');

// 治疗方案
export const treatmentPlanApi = subRecordApi('treatment-plans');

// 病程记录
export const progressNoteApi = subRecordApi('progress-notes');

// 财务信息
export const financialInfoApi = subRecordApi('financial-info');

// 医疗团队
export const medicalTeamApi = subRecordApi('medical-team');

// ===== AI 分析 =====
export function getAiStatus(patientId) {
  return get(`/analysis/${patientId}/status`);
}

export function analyzePatient(patientId) {
  return post(`/analysis/${patientId}/analyze`);
}

export function suggestPatient(patientId) {
  return post(`/analysis/${patientId}/suggest`);
}

export function getAiStats() {
  return get('/analysis/stats');
}
