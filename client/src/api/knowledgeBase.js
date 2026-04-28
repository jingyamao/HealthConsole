import { get, post, put, del } from './index';

export function getKnowledgeBaseList(params) {
  return get('/knowledge-base', params);
}

export function getKnowledgeBaseById(id) {
  return get(`/knowledge-base/${id}`);
}

export function createKnowledgeBase(data) {
  return post('/knowledge-base', data);
}

export function updateKnowledgeBase(id, data) {
  return put(`/knowledge-base/${id}`, data);
}

export function deleteKnowledgeBase(id) {
  return del(`/knowledge-base/${id}`);
}

export function getKnowledgeBaseStats() {
  return get('/knowledge-base/stats');
}
