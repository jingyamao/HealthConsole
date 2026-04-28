<template>
  <div class="page-shell kb-page">
    <!-- 顶部统计 -->
    <section class="glass-panel kb-hero">
      <div>
        <span class="section-badge">Knowledge Base</span>
        <h2>医学知识库管理</h2>
        <p>管理医学指南、文献和诊疗规范文档</p>
      </div>
      <div class="kb-stats-mini" v-if="stats">
        <div class="stat-chip"><span>总文档</span><strong>{{ stats.total }}</strong></div>
        <div class="stat-chip"><span>已启用</span><strong>{{ stats.active }}</strong></div>
        <div class="stat-chip"><span>分类数</span><strong>{{ stats.categories?.length || 0 }}</strong></div>
      </div>
    </section>

    <!-- 工具栏 -->
    <section class="glass-panel kb-toolbar">
      <div class="toolbar-left">
        <input v-model="keyword" placeholder="搜索文档标题/内容..." class="search-input" @keydown.enter="search" />
        <select v-model="category" class="filter-select" @change="search">
          <option value="">全部分类</option>
          <option v-for="cat in stats?.categories || []" :key="cat.name" :value="cat.name">{{ cat.name }} ({{ cat.count }})</option>
        </select>
        <button class="ghost-btn" @click="search">搜索</button>
      </div>
      <div class="toolbar-right">
        <button class="primary-btn" @click="openAdd">+ 新增文档</button>
      </div>
    </section>

    <!-- 文档列表 -->
    <section class="glass-panel kb-list-card">
      <div v-if="loading" class="loading-state">加载中...</div>
      <div v-else-if="documents.length === 0" class="empty-state">
        <p>暂无知识库文档</p>
      </div>
      <div class="kb-table-wrap" v-else>
        <table class="kb-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>标签</th>
              <th>来源</th>
              <th>状态</th>
              <th>发布日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in documents" :key="doc.id">
              <td class="col-title">
                <a class="doc-link" @click="viewDetail(doc)">{{ doc.title }}</a>
              </td>
              <td><span class="cat-tag">{{ doc.category || '未分类' }}</span></td>
              <td>
                <span class="tag-chip" v-for="t in (doc.tags || []).slice(0, 3)" :key="t">{{ t }}</span>
                <span v-if="doc.tags?.length > 3" class="tag-more">+{{ doc.tags.length - 3 }}</span>
              </td>
              <td class="col-source">{{ doc.source || '--' }}</td>
              <td>
                <span class="status-dot" :class="doc.isActive ? 'active' : 'inactive'"></span>
                {{ doc.isActive ? '启用' : '停用' }}
              </td>
              <td class="col-date">{{ formatDate(doc.publishDate || doc.createdAt) }}</td>
              <td class="col-actions">
                <button class="icon-btn edit" @click="openEdit(doc)">✎</button>
                <button class="icon-btn del" @click="deleteDoc(doc.id)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="page <= 1" @click="setPage(page - 1)">上一页</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="setPage(page + 1)">下一页</button>
      </div>
    </section>

    <!-- 文档详情弹窗 -->
    <Teleport to="body">
      <div v-if="detailVisible" class="modal-overlay" @click.self="detailVisible = false">
        <div class="modal-box detail-modal">
          <div class="modal-header">
            <h3>{{ detailDoc?.title }}</h3>
            <button class="modal-close" @click="detailVisible = false">&times;</button>
          </div>
          <div class="modal-body detail-body">
            <div class="detail-meta">
              <span v-if="detailDoc?.category" class="cat-tag">{{ detailDoc.category }}</span>
              <span v-if="detailDoc?.source">来源: {{ detailDoc.source }}</span>
              <span v-if="detailDoc?.version">版本: {{ detailDoc.version }}</span>
              <span>{{ formatDate(detailDoc?.publishDate) }}</span>
            </div>
            <div class="detail-tags" v-if="detailDoc?.tags?.length">
              <span class="tag-chip" v-for="t in detailDoc.tags" :key="t">{{ t }}</span>
            </div>
            <div class="detail-content" v-html="renderContent(detailDoc?.content)"></div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 新增/编辑表单弹窗 -->
    <SubRecordFormDialog
      v-model="formVisible"
      :mode="formMode"
      :title="formMode === 'new' ? '新增知识库文档' : '编辑知识库文档'"
      :schema="kbSchema"
      :record="formRecord"
      @save="onFormSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getKnowledgeBaseList, getKnowledgeBaseById, createKnowledgeBase,
  updateKnowledgeBase, deleteKnowledgeBase, getKnowledgeBaseStats
} from '@/api/knowledgeBase'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import SubRecordFormDialog from '@/components/SubRecordFormDialog.vue'

const documents = ref([])
const stats = ref(null)
const loading = ref(false)
const keyword = ref('')
const category = ref('')
const page = ref(1)
const totalPages = ref(1)
const pageSize = ref(20)

// 详情弹窗
const detailVisible = ref(false)
const detailDoc = ref(null)

// 表单弹窗
const formVisible = ref(false)
const formMode = ref('new')
const formRecord = ref(null)

const kbSchema = [
  { key: 'title', label: '标题', type: 'text', required: true, placeholder: '请输入文档标题' },
  { key: 'category', label: '分类', type: 'text', placeholder: '如：指南、论文、教材' },
  { key: 'source', label: '来源', type: 'text', placeholder: '如：中华医学会' },
  { key: 'version', label: '版本', type: 'text', placeholder: '如：2024版' },
  { key: 'tags', label: '标签', type: 'json', rows: 2, placeholder: 'JSON 数组，如 ["心血管","高血压"]' },
  { key: 'content', label: '内容 (Markdown)', type: 'textarea', rows: 10, placeholder: '支持 Markdown 格式' },
  { key: 'publishDate', label: '发布日期', type: 'date' },
  { key: 'isActive', label: '状态', type: 'select', options: [{ label: '启用', value: true }, { label: '停用', value: false }] }
]

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeBaseList({
      page: page.value, pageSize: pageSize.value,
      keyword: keyword.value, category: category.value
    })
    if (res?.success) {
      documents.value = res.data.documents || []
      totalPages.value = res.data.pagination?.totalPages || 1
    }
  } catch (e) {
    ElMessage.error('获取知识库列表失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getKnowledgeBaseStats()
    if (res?.success) stats.value = res.data
  } catch { /* ignore */ }
}

const search = () => { page.value = 1; fetchList() }
const setPage = (p) => { page.value = p; fetchList() }

const viewDetail = async (doc) => {
  try {
    const res = await getKnowledgeBaseById(doc.id)
    if (res?.success) {
      detailDoc.value = res.data
      detailVisible.value = true
    }
  } catch { ElMessage.error('获取文档详情失败') }
}

const openAdd = () => {
  formMode.value = 'new'; formRecord.value = null; formVisible.value = true
}

const openEdit = async (doc) => {
  try {
    const res = await getKnowledgeBaseById(doc.id)
    if (res?.success) {
      formMode.value = 'edit'
      formRecord.value = res.data
      formVisible.value = true
    }
  } catch { ElMessage.error('获取文档详情失败') }
}

const onFormSave = async (data) => {
  try {
    let res
    if (formMode.value === 'new') {
      res = await createKnowledgeBase(data)
    } else {
      res = await updateKnowledgeBase(formRecord.value.id, data)
    }
    if (res?.success) {
      ElMessage.success(formMode.value === 'new' ? '文档已添加' : '文档已更新')
      formVisible.value = false
      fetchList()
      fetchStats()
    } else {
      ElMessage.error(res?.error?.message || '操作失败')
    }
  } catch { ElMessage.error('操作失败') }
}

const deleteDoc = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文档吗？', '确认删除', {
      confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning'
    })
    const res = await deleteKnowledgeBase(id)
    if (res?.success) {
      ElMessage.success('文档已删除')
      fetchList()
      fetchStats()
    } else {
      ElMessage.error(res?.error?.message || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error('删除失败')
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const renderContent = (text) => {
  if (!text) return '<p>暂无内容</p>'
  try { return marked.parse(text) } catch { return text.replace(/\n/g, '<br>') }
}

onMounted(() => { fetchList(); fetchStats() })
</script>

<style lang="less" scoped>
.kb-page { display: flex; flex-direction: column; gap: 8px; }

.kb-hero {
  padding: 12px; display: flex; justify-content: space-between; align-items: start; gap: 14px;
  h2 { margin: 6px 0 2px; font-size: 20px; }
  p { margin: 0; color: var(--text-secondary); font-size: 12px; }
}

.kb-stats-mini { display: flex; gap: 8px; flex-shrink: 0; }
.stat-chip {
  padding: 8px 14px; border-radius: 12px; background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.1); text-align: center;
  span { display: block; color: var(--text-muted); font-size: 10px; }
  strong { display: block; font-size: 20px; margin-top: 2px; color: var(--text-primary); }
}

.kb-toolbar {
  padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
}
.toolbar-left { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; }
.search-input {
  width: 220px; height: 34px; border: 1px solid rgba(148, 163, 184, 0.14);
  background: #f8fbff; border-radius: 10px; padding: 0 10px; font-size: 13px; outline: none;
  &:focus { border-color: rgba(92, 225, 230, 0.3); }
}
.filter-select {
  height: 34px; border: 1px solid rgba(148, 163, 184, 0.14);
  background: #f8fbff; border-radius: 10px; padding: 0 10px; font-size: 13px; outline: none;
}

.kb-list-card { padding: 12px; }
.kb-table-wrap { overflow-x: auto; }
.kb-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid rgba(148, 163, 184, 0.06); }
  th { color: var(--text-muted); font-weight: 500; font-size: 11px; white-space: nowrap; }
  td { color: var(--text-secondary); }
  tbody tr:hover { background: rgba(92, 225, 230, 0.03); }
}

.col-title { min-width: 200px; }
.col-source { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-date { white-space: nowrap; }
.col-actions { white-space: nowrap; }
.doc-link { color: var(--accent-cyan); cursor: pointer; font-weight: 500; &:hover { text-decoration: underline; } }

.cat-tag {
  display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 11px;
  background: rgba(92, 225, 230, 0.08); color: #2e9ea6;
}
.tag-chip {
  display: inline-flex; padding: 1px 6px; border-radius: 4px; font-size: 10px; margin-right: 3px;
  background: rgba(148, 163, 184, 0.08); color: var(--text-muted);
}
.tag-more { color: var(--text-muted); font-size: 10px; }

.status-dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; vertical-align: middle;
  &.active { background: var(--accent-green); }
  &.inactive { background: var(--text-muted); }
}

.icon-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px;
  display: inline-grid; place-items: center; transition: all 0.15s;
  &.edit { background: rgba(90, 141, 238, 0.08); color: var(--text-secondary); &:hover { background: rgba(90, 141, 238, 0.18); } }
  &.del { background: rgba(255, 100, 100, 0.06); color: #d32f2f; &:hover { background: rgba(255, 100, 100, 0.14); } }
}

.pagination {
  display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 12px;
  button { min-height: 30px; padding: 0 12px; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.14); background: #f8fbff; cursor: pointer; font-size: 12px; &:disabled { opacity: 0.4; cursor: not-allowed; } }
  span { font-size: 13px; color: var(--text-secondary); }
}

// 详情弹窗
.detail-modal { width: min(90vw, 800px); }
.detail-body { max-height: 70vh; overflow-y: auto; }
.detail-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; font-size: 12px; color: var(--text-muted); }
.detail-tags { margin-bottom: 10px; }
.detail-content {
  color: var(--text-secondary); font-size: 13px; line-height: 1.8;
  :deep(h2) { font-size: 18px; color: var(--text-primary); }
  :deep(h3) { font-size: 15px; color: var(--text-primary); }
  :deep(strong) { color: var(--text-primary); }
}

// 通用样式
.primary-btn { min-height: 34px; padding: 0 14px; border-radius: 10px; font-size: 13px; background: linear-gradient(135deg, var(--accent-cyan), #9ce7ff); color: #fff; border: none; cursor: pointer; }
.ghost-btn { min-height: 34px; padding: 0 14px; border-radius: 10px; font-size: 13px; border: 1px solid rgba(90, 141, 238, 0.16); background: #f5f9ff; color: var(--text-primary); cursor: pointer; }
.loading-state, .empty-state { text-align: center; padding: 32px 12px; color: var(--text-muted); }

// Modal (复用于详情弹窗)
.modal-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); backdrop-filter: blur(6px); }
.modal-box { position: relative; background: #fff; border-radius: 20px; box-shadow: 0 24px 64px rgba(0,0,0,0.18); display: flex; flex-direction: column; overflow: hidden; max-height: 90vh; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 10px; border-bottom: 1px solid rgba(148,163,184,0.1); h3 { margin: 0; font-size: 18px; font-weight: 600; } }
.modal-close { width: 28px; height: 28px; border: none; background: transparent; font-size: 22px; color: var(--text-muted); cursor: pointer; border-radius: 8px; &:hover { background: rgba(148,163,184,0.12); } }
.modal-body { padding: 14px 18px; }

@media (max-width: 768px) {
  .kb-hero { flex-direction: column; }
  .kb-stats-mini { width: 100%; }
  .stat-chip { flex: 1; }
  .toolbar-left { flex-direction: column; width: 100%; .search-input { width: 100%; } }
}
</style>
