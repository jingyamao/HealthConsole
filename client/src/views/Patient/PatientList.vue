<template>
  <div class="page-shell patient-page">
    <section class="patient-hero glass-panel">
      <div>
        <span class="section-badge">Patients Hub</span>
        <h2>患者管理工作台</h2>
        <p>支持搜索、查看详情和新增患者，数据实时同步至后端数据库。</p>
      </div>
      <div class="hero-actions">
        <button class="primary-btn" @click="dialogMode = 'new'; dialogPatientId = null; dialogVisible = true">新增患者</button>
        <button class="ghost-btn" @click="goTopPatient">查看重点患者</button>
      </div>
    </section>

    <section class="summary-grid">
      <article v-for="item in summaryCards" :key="item.label" class="glass-panel summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <p>{{ item.desc }}</p>
      </article>
    </section>

    <section class="glass-panel table-panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">患者列表</h3>
          <p class="panel-subtitle">当前共匹配 {{ totalRecords }} 条记录</p>
        </div>
        <div class="panel-header-right">
          <input
            :value="keyword"
            class="search-box"
            placeholder="姓名 / 手机号 / 编号 / 诊断"
            @input="patientStore.setKeyword($event.target.value)"
          />
          <span class="status-pill success">已联动数据</span>
        </div>
      </div>

      <div class="patient-table">
        <div class="table-head">
          <span>患者</span>
          <span>主诊断</span>
          <span>病区</span>
          <span>AI 状态</span>
          <span>风险等级</span>
          <span>操作</span>
        </div>

        <div v-for="row in patients" :key="row.id" class="table-row">
          <div class="patient-name">
            <strong>{{ row.name }}</strong>
            <span>{{ row.gender }} · {{ row.age }} 岁 · {{ row.id }}</span>
          </div>
          <span class="cell-text">{{ row.diagnosis }}</span>
          <span class="cell-text">{{ row.ward }}</span>
          <span class="status-pill" :class="getAiClass(row.aiStatus)">{{ row.aiStatus }}</span>
          <span class="risk-chip" :class="getRiskClass(row.riskLevel)">{{ row.riskLevel }}</span>
          <div class="action-btns">
            <button class="detail-btn" @click="goDetail(row.id)">详情</button>
            <button class="edit-btn" @click="dialogMode = 'edit'; dialogPatientId = row.id; dialogVisible = true">编辑</button>
            <button class="delete-btn" @click="handleDelete(row.id, row.name)">删除</button>
          </div>
        </div>

        <div v-if="patients.length === 0" class="empty-state">
          <p>暂无匹配的患者数据</p>
        </div>
      </div>

      <div class="pagination">
        <div class="page-size-selector">
          <span>每页</span>
          <select :value="patientStore.pageSize" @change="patientStore.setPageSize(Number($event.target.value))">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span>条</span>
        </div>
        <div class="page-btns">
          <button class="page-btn" :disabled="currentPage <= 1" @click="patientStore.setPage(currentPage - 1)">上一页</button>
          <template v-for="p in displayedPages" :key="p">
            <button v-if="p === '...'" class="page-btn ellipsis" disabled>...</button>
            <button v-else class="page-btn" :class="{ active: p === currentPage }" @click="patientStore.setPage(p)">{{ p }}</button>
          </template>
          <button class="page-btn" :disabled="currentPage >= totalPages" @click="patientStore.setPage(currentPage + 1)">下一页</button>
        </div>
        <span class="page-info">共 {{ totalRecords }} 条</span>
      </div>
    </section>

    <PatientFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :patient-id="dialogPatientId"
      @saved="onDialogSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePatientStore } from '@/stores/patient'
import { deletePatient } from '@/api/patient'
import PatientFormDialog from '@/components/PatientFormDialog.vue'

const router = useRouter()
const route = useRoute()
const patientStore = usePatientStore()
const { summary, patients, currentPage, totalPages, totalRecords, keyword } = storeToRefs(patientStore)

const summaryCards = computed(() => summary.value)

const displayedPages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (cur > 3) pages.push('...')
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const getRiskClass = (level) => {
  if (level === '高风险') return 'danger'
  if (level === '中风险') return 'warn'
  return 'safe'
}

const getAiClass = (status) => {
  if (status === '已分析') return 'success'
  if (status === '待复核') return 'warn'
  return ''
}

const goDetail = (id) => { router.push(`/patients/${id}`) }

const goTopPatient = () => {
  const firstPatient = patients.value[0]
  if (firstPatient) router.push(`/patients/${firstPatient.id}`)
}

const handleDelete = async (id, name) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除患者「${name}」吗？此操作不可恢复。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    const res = await deletePatient(id)
    if (res?.success) {
      ElMessage.success('患者已删除')
      patientStore.fetchPatients()
      patientStore.fetchSummary()
    } else {
      ElMessage.error(res?.error?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// ---- 弹窗 ----
const dialogVisible = ref(false)
const dialogMode = ref('new')
const dialogPatientId = ref(null)

const onDialogSaved = () => {
  patientStore.fetchPatients()
  patientStore.fetchSummary()
}

onMounted(() => {
  patientStore.fetchPatients()
  patientStore.fetchSummary()

  // 从详情页跳转过来时自动打开编辑弹窗
  if (route.query.edit) {
    dialogMode.value = 'edit'
    dialogPatientId.value = route.query.edit
    dialogVisible.value = true
    router.replace({ path: '/patients' })
  }
})
</script>

<style lang="less" scoped>
.patient-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.patient-hero,
.table-panel {
  padding: 14px;
}

.summary-card {
  padding: 10px 14px;
  min-width: 0;
  overflow: hidden;
}

.patient-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;

  h2 { margin: 8px 0 2px; font-size: 26px; }
  p { margin: 0; color: var(--text-secondary); font-size: 13px; }
}

.hero-actions { display: flex; gap: 8px; }

.primary-btn,
.ghost-btn,
.detail-btn {
  min-height: 36px; padding: 0 12px; border-radius: 12px; font-size: 13px;
}

.primary-btn {
  background: linear-gradient(135deg, var(--accent-cyan), #9ce7ff);
  color: #fff; border: none; cursor: pointer;
}

.ghost-btn, .detail-btn, .edit-btn, .delete-btn {
  border: 1px solid rgba(90, 141, 238, 0.16); background: #f5f9ff;
  color: var(--text-primary); cursor: pointer;
}

.edit-btn { border-color: rgba(92, 225, 230, 0.16); color: var(--accent-cyan); border-radius: 12px; }
.delete-btn { border-color: rgba(255, 125, 144, 0.16); color: var(--accent-rose); border-radius: 12px; }

.action-btns { display: flex; gap: 6px; }

.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }

.summary-card {
  span { color: var(--text-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
  strong { display: block; margin: 4px 0 2px; font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  p { margin: 0; color: var(--text-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.panel-header-right { display: flex; align-items: center; gap: 10px; }

.search-box {
  height: 34px; padding: 0 12px; border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12); background: #f8fbff;
  color: var(--text-secondary); font-size: 13px; outline: none; width: 220px;
  transition: border-color 0.2s;
  &:focus { border-color: rgba(92, 225, 230, 0.3); }
}

.patient-table { display: grid; gap: 8px; overflow: hidden; }

.table-head, .table-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) minmax(140px, 1fr) minmax(90px, 0.7fr) minmax(90px, 0.7fr) minmax(80px, 0.6fr) minmax(160px, auto);
  gap: 8px; align-items: center;
}

.table-head { padding: 0 6px 4px; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }

.table-row { padding: 8px 10px; border-radius: 14px; border: 1px solid rgba(148, 163, 184, 0.1); background: #fbfdff; color: var(--text-secondary); }

.patient-name {
  min-width: 0;
  strong { display: block; color: var(--text-primary); margin-bottom: 1px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  span { color: var(--text-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
}

.cell-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

.risk-chip {
  display: inline-flex; justify-content: center; padding: 3px 8px; border-radius: 999px;
  font-size: 12px; border: 1px solid transparent; white-space: nowrap;
  &.safe { color: var(--accent-green); background: rgba(61, 217, 165, 0.08); border-color: rgba(61, 217, 165, 0.12); }
  &.warn { color: var(--accent-gold); background: rgba(246, 198, 107, 0.08); border-color: rgba(246, 198, 107, 0.12); }
  &.danger { color: var(--accent-rose); background: rgba(255, 125, 144, 0.08); border-color: rgba(255, 125, 144, 0.12); }
}

.empty-state { text-align: center; padding: 30px 0; color: var(--text-muted); }

.pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; flex-wrap: wrap; }

.page-size-selector {
  display: flex; align-items: center; gap: 4px;
  span { color: var(--text-muted); font-size: 12px; }
  select {
    height: 30px; padding: 0 6px; border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.12); background: #f8fbff;
    color: var(--text-secondary); font-size: 12px; outline: none; cursor: pointer;
    &:focus { border-color: rgba(92, 225, 230, 0.3); }
  }
}

.page-btns { display: flex; align-items: center; gap: 6px; }

.page-btn {
  min-width: 32px; height: 32px; padding: 0 8px; border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.12); background: #f8fbff;
  color: var(--text-secondary); font-size: 13px; cursor: pointer; transition: all 0.2s;
  &:hover:not(:disabled):not(.active) { border-color: rgba(92, 225, 230, 0.2); background: #f0f7ff; }
  &.active { background: linear-gradient(135deg, var(--accent-cyan), #5b8bff); color: #fff; border-color: transparent; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &.ellipsis { border: none; background: transparent; }
}

.page-info { margin-left: 8px; color: var(--text-muted); font-size: 12px; }

@media (max-width: 900px) {
  .patient-hero { flex-direction: column; align-items: flex-start; gap: 10px; h2 { font-size: 22px; } }
  .panel-header { flex-wrap: wrap; gap: 8px; }
  .panel-header-right { width: 100%; }
  .search-box { flex: 1; width: auto; }
  .table-head, .table-row { grid-template-columns: minmax(100px, 1.1fr) minmax(80px, 0.9fr) minmax(60px, 0.6fr) minmax(60px, 0.6fr) minmax(56px, 0.5fr) minmax(110px, auto); gap: 6px; }
  .table-head { font-size: 10px; }
  .table-row { padding: 6px 8px; border-radius: 10px; }
  .patient-name { strong { font-size: 13px; } span { font-size: 10px; } }
  .risk-chip { padding: 2px 6px; font-size: 11px; }
  .action-btns { gap: 4px; }
  .primary-btn, .ghost-btn, .detail-btn { min-height: 30px; padding: 0 8px; font-size: 12px; }
  .edit-btn, .delete-btn { min-height: 30px; padding: 0 6px; font-size: 12px; }
}

@media (max-width: 600px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .summary-card { padding: 8px 10px; strong { font-size: 18px; } }
  .table-panel { overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 10px; }
  .patient-table { min-width: 540px; }
  .table-head, .table-row { grid-template-columns: 100px 80px 50px 50px 50px 110px; gap: 4px; }
  .table-head { font-size: 9px; }
  .table-row { padding: 5px 6px; border-radius: 8px; }
  .patient-name strong { font-size: 12px; }
  .patient-name span { font-size: 9px; }
  .cell-text { font-size: 11px; }
  .risk-chip { padding: 1px 4px; font-size: 10px; }
  .status-pill { font-size: 10px; padding: 1px 5px; }
  .action-btns { gap: 3px; }
  .detail-btn, .edit-btn, .delete-btn { min-height: 26px; padding: 0 5px; font-size: 11px; border-radius: 8px; }
  .page-btn { min-width: 28px; height: 28px; font-size: 12px; }
  .pagination { flex-direction: column; gap: 8px; }
  .page-btns { flex-wrap: wrap; justify-content: center; }
}
</style>
