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
