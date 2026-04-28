<template>
  <div class="page-shell detail-page" v-if="loading">
    <section class="glass-panel detail-hero">
      <span class="section-badge">Loading</span>
      <h2>正在加载患者档案...</h2>
    </section>
  </div>

  <div class="page-shell detail-page" v-else-if="patient">
    <!-- 顶部患者概览 -->
    <section class="glass-panel detail-hero">
      <div>
        <span class="section-badge">Patient Profile</span>
        <h2>{{ patient.name }} · {{ primaryDiagnosis }}</h2>
        <p>{{ patientSummary }}</p>
      </div>
      <div class="hero-actions">
        <button class="ai-analyze-btn" @click="runAiAnalyze" :disabled="aiAnalyzing">
          {{ aiAnalyzing ? 'AI 分析中...' : '🤖 AI 分析' }}
        </button>
        <button class="ai-suggest-btn" @click="runAiSuggest" :disabled="aiSuggesting">
          {{ aiSuggesting ? '生成中...' : '💡 AI 建议' }}
        </button>
        <button class="primary-btn" @click="goEdit">编辑患者</button>
        <button class="ghost-btn" @click="goBack">返回列表</button>
      </div>
    </section>

    <!-- AI 分析结果 -->
    <section class="glass-panel ai-card" v-if="aiAnalysis">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">
            🤖 AI 综合分析
            <span class="risk-badge" :class="'risk-' + aiAnalysis.riskLevel">
              {{ riskLabel(aiAnalysis.riskLevel) }}
            </span>
          </h3>
          <p class="panel-subtitle">
            {{ aiAnalysis.riskSummary }}
            <span class="ai-time" v-if="analyzedAt"> · 分析时间: {{ formatDateTime(analyzedAt) }}</span>
          </p>
        </div>
        <div class="panel-header-actions">
          <button class="ghost-btn-sm" @click="isAnalysisExpanded = !isAnalysisExpanded">
            {{ isAnalysisExpanded ? '收起 ▲' : '展开 ▼' }}
          </button>
          <button class="ghost-btn-sm" @click="runAiAnalyze" :disabled="aiAnalyzing">
            {{ aiAnalyzing ? '分析中...' : '重新分析' }}
          </button>
        </div>
      </div>
      <div class="ai-findings" v-show="isAnalysisExpanded">
        <div class="ai-section" v-if="aiAnalysis.keyFindings?.length">
          <h4>关键发现</h4>
          <ul>
            <li v-for="(f, i) in aiAnalysis.keyFindings" :key="i">{{ f }}</li>
          </ul>
        </div>
        <div class="ai-section" v-if="aiAnalysis.attentionPoints?.length">
          <h4>关注要点</h4>
          <ul>
            <li v-for="(p, i) in aiAnalysis.attentionPoints" :key="i">{{ p }}</li>
          </ul>
        </div>
        <div class="ai-section" v-if="aiAnalysis.diagnosisAssessment">
          <h4>诊断评估</h4>
          <p>{{ aiAnalysis.diagnosisAssessment }}</p>
        </div>
        <div class="ai-section" v-if="aiAnalysis.treatmentReview">
          <h4>治疗方案审查</h4>
          <p>{{ aiAnalysis.treatmentReview }}</p>
        </div>
        <div class="ai-section" v-if="aiAnalysis.followUpSuggestions">
          <h4>随访建议</h4>
          <p>{{ aiAnalysis.followUpSuggestions }}</p>
        </div>
      </div>
    </section>

    <!-- AI 建议结果 -->
    <section class="glass-panel ai-card ai-suggest-card" v-if="aiSuggestion && showSuggestion">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">💡 AI 诊疗建议</h3>
          <p class="panel-subtitle" v-if="suggestedAt">生成时间: {{ formatDateTime(suggestedAt) }}</p>
        </div>
        <div class="panel-header-actions">
          <button class="ghost-btn-sm" @click="isSuggestionExpanded = !isSuggestionExpanded">
            {{ isSuggestionExpanded ? '收起 ▲' : '展开 ▼' }}
          </button>
          <button class="ghost-btn-sm" @click="runAiSuggest" :disabled="aiSuggesting">
            {{ aiSuggesting ? '生成中...' : '重新生成' }}
          </button>
          <button class="ghost-btn-sm" @click="showSuggestion = false">关闭</button>
        </div>
      </div>
      <div class="ai-suggest-content" v-show="isSuggestionExpanded" v-html="renderMarkdown(aiSuggestion)"></div>
    </section>

    <!-- AI 建议已隐藏提示 -->
    <section class="glass-panel ai-card ai-suggest-card ai-suggest-hidden" v-if="aiSuggestion && !showSuggestion">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">💡 AI 诊疗建议 <span class="ai-time">已隐藏 · 上次生成: {{ formatDateTime(suggestedAt) }}</span></h3>
        </div>
        <button class="ghost-btn-sm" @click="showSuggestion = true; isSuggestionExpanded = true">显示建议</button>
      </div>
    </section>

    <!-- 基础资料（独立卡片，始终可见） -->
    <article class="glass-panel profile-card">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">基础资料</h3>
          <p class="panel-subtitle">患者基本信息</p>
        </div>
      </div>
      <div class="kv-grid">
        <div class="kv-item" v-for="item in profileItems" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </article>

    <!-- Tab 页签区域：子记录管理 -->
    <section class="glass-panel tab-section">
      <el-tabs v-model="activeTab" type="border-card" class="detail-tabs">
        <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key">
          <div class="tab-toolbar">
            <span class="tab-count">共 {{ getRecords(tab.key).length }} 条记录</span>
            <button class="add-btn" @click="openAddDialog(tab.key)">+ 新增</button>
          </div>

          <!-- 无数据 -->
          <div v-if="getRecords(tab.key).length === 0" class="empty-tab">
            <p>暂无 {{ tab.label }} 记录</p>
          </div>

          <!-- 列表 -->
          <div class="record-list" v-else>
            <div v-for="item in getRecords(tab.key)" :key="item.id" class="record-item">
              <div class="record-body">
                <!-- 病史记录 -->
                <template v-if="tab.key === 'medicalHistories'">
                  <div class="record-head">
                    <span class="record-type-tag">{{ item.type }}</span>
                  </div>
                  <div class="record-detail" v-if="item.details">
                    <span v-for="(val, key) in parseJson(item.details)" :key="key">{{ key }}: {{ val }}</span>
                  </div>
                </template>

                <!-- 当前症状 -->
                <template v-else-if="tab.key === 'currentSymptoms'">
                  <div class="record-head">
                    <strong>{{ item.mainComplaint || '未填写主诉' }}</strong>
                    <span v-if="item.severity" class="status-pill warn">{{ item.severity }}</span>
                  </div>
                  <div class="record-detail">
                    <span v-if="item.duration">持续时间: {{ item.duration }}</span>
                    <span v-if="item.aggravatingFactors">加重因素: {{ item.aggravatingFactors }}</span>
                    <span v-if="item.relievingFactors">缓解因素: {{ item.relievingFactors }}</span>
                  </div>
                </template>

                <!-- 体格检查 -->
                <template v-else-if="tab.key === 'physicalExaminations'">
                  <div class="kv-grid-mini">
                    <div class="kv-item" v-if="item.vitalSigns"><span>生命体征</span><strong>{{ item.vitalSigns }}</strong></div>
                    <div class="kv-item" v-if="item.generalAppearance"><span>一般外观</span><strong>{{ item.generalAppearance }}</strong></div>
                    <div class="kv-item" v-if="item.headAndNeck"><span>头部/颈部</span><strong>{{ item.headAndNeck }}</strong></div>
                    <div class="kv-item" v-if="item.chest"><span>胸部</span><strong>{{ item.chest }}</strong></div>
                    <div class="kv-item" v-if="item.cardiovascular"><span>心血管</span><strong>{{ item.cardiovascular }}</strong></div>
                    <div class="kv-item" v-if="item.abdomen"><span>腹部</span><strong>{{ item.abdomen }}</strong></div>
                    <div class="kv-item" v-if="item.extremities"><span>四肢</span><strong>{{ item.extremities }}</strong></div>
                    <div class="kv-item" v-if="item.neurological"><span>神经系统</span><strong>{{ item.neurological }}</strong></div>
                  </div>
                </template>

                <!-- 检查结果 -->
                <template v-else-if="tab.key === 'examinationResults'">
                  <div class="record-head"><strong>检查报告</strong><span class="record-date">{{ formatDate(item.createdAt) }}</span></div>
                  <div v-if="item.laboratoryTests" class="exam-section">
                    <h4 class="exam-section-title">实验室检查</h4>
                    <div v-for="(group, gi) in parseExamSections(item.laboratoryTests)" :key="'lab'+gi" class="exam-group">
                      <span class="exam-group-label">{{ group.label }}</span>
                      <div class="exam-group-values">
                        <span v-for="(val, vi) in group.items" :key="vi" class="exam-value">{{ val }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="item.imagingStudies" class="exam-section">
                    <h4 class="exam-section-title">影像学检查</h4>
                    <div v-for="(group, gi) in parseExamSections(item.imagingStudies)" :key="'img'+gi" class="exam-group">
                      <span class="exam-group-label">{{ group.label }}</span>
                      <div class="exam-group-values">
                        <span v-for="(val, vi) in group.items" :key="vi" class="exam-value">{{ val }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="item.specialTests" class="exam-section">
                    <h4 class="exam-section-title">特殊检查</h4>
                    <div v-for="(group, gi) in parseExamSections(item.specialTests)" :key="'sp'+gi" class="exam-group">
                      <span class="exam-group-label">{{ group.label }}</span>
                      <div class="exam-group-values">
                        <span v-for="(val, vi) in group.items" :key="vi" class="exam-value">{{ val }}</span>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 诊断记录 -->
                <template v-else-if="tab.key === 'diagnoses'">
                  <div class="record-head">
                    <strong>{{ item.diagnosisName }}</strong>
                    <span class="status-pill" :class="getDiagnosisTypeClass(item.type)">{{ item.type }}</span>
                  </div>
                  <div class="record-meta">
                    <span v-if="item.icdCode">ICD: {{ item.icdCode }}</span>
                    <span v-if="item.diagnosisDate">{{ formatDate(item.diagnosisDate) }}</span>
                    <span v-if="item.doctorName">医师: {{ item.doctorName }}</span>
                  </div>
                </template>

                <!-- 治疗方案 -->
                <template v-else-if="tab.key === 'treatmentPlans'">
                  <div class="record-head"><strong>治疗方案</strong><span class="record-date">{{ formatDate(item.createdAt) }}</span></div>
                  <div class="record-detail" v-if="item.medication">
                    <span v-for="(m, i) in normalizeArray(item.medication)" :key="'m'+i">💊 {{ formatMedItem(m) }}</span>
                  </div>
                  <div class="record-detail" v-if="item.procedures">
                    <span v-for="(p, i) in normalizeArray(item.procedures)" :key="'p'+i">🔧 {{ stringify(p) }}</span>
                  </div>
                  <div v-if="item.lifestyleRecommendations" class="record-lifestyle">
                    <strong>生活建议:</strong>
                    <p v-for="(r, i) in normalizeArray(item.lifestyleRecommendations)" :key="'ls'+i">
                      <span class="ls-type">{{ stringifyField(r, 'type') || '建议' }}</span>
                      {{ stringifyField(r, 'recommendation') || stringify(r) }}
                    </p>
                  </div>
                  <p v-if="item.followUpPlan" class="record-text">
                    <strong>随访计划:</strong>
                  </p>
                  <div v-if="item.followUpPlan" class="kv-grid followup-grid">
                    <div class="kv-item" v-for="(v, k) in normalizeObject(item.followUpPlan)" :key="k">
                      <span>{{ followUpLabel(k) }}</span>
                      <strong>{{ v }}</strong>
                    </div>
                  </div>
                </template>

                <!-- 病程记录 -->
                <template v-else-if="tab.key === 'progressNotes'">
                  <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                      <div class="timeline-head">
                        <strong>{{ item.type || '病程记录' }}</strong>
                        <span>{{ formatDate(item.noteDate) }}</span>
                      </div>
                      <p v-if="item.author" class="timeline-author">记录人: {{ item.author }}</p>
                      <p>{{ item.content }}</p>
                    </div>
                  </div>
                </template>

                <!-- 财务信息 -->
                <template v-else-if="tab.key === 'financialInfos'">
                  <div class="finance-grid">
                    <div class="finance-cell"><span>总费用</span><strong>¥ {{ (item.totalCost || 0).toLocaleString() }}</strong></div>
                    <div class="finance-cell"><span>医保覆盖</span><strong>¥ {{ (item.insuranceCoverage || 0).toLocaleString() }}</strong></div>
                    <div class="finance-cell"><span>自费部分</span><strong>¥ {{ (item.selfPayment || 0).toLocaleString() }}</strong></div>
                    <div class="finance-cell"><span>支付状态</span><strong class="status-pill" :class="getPaymentClass(item.paymentStatus)">{{ item.paymentStatus }}</strong></div>
                  </div>
                </template>

                <!-- 医疗团队 -->
                <template v-else-if="tab.key === 'medicalTeams'">
                  <div class="record-head"><strong>主治医师: {{ getPhysicianName(item.primaryPhysician) }}</strong></div>
                  <div class="record-detail">
                    <span v-if="getNurseName(item.nurse)">责任护士: {{ getNurseName(item.nurse) }}</span>
                    <span v-for="(spec, i) in parseSpecialists(item.specialists)" :key="i">{{ spec }}</span>
                  </div>
                </template>
              </div>
              <div class="record-actions">
                <button class="icon-btn edit" @click="openEditDialog(tab.key, item)">✎</button>
                <button class="icon-btn del" @click="deleteRecord(tab.key, item.id)">✕</button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>

  <div class="page-shell detail-page" v-else>
    <section class="glass-panel detail-hero empty-state">
      <h2>未找到患者档案</h2>
      <p>当前患者 ID 不存在，可以返回列表页重新选择。</p>
      <router-link to="/patients" class="back-link">返回患者列表</router-link>
    </section>
  </div>

  <!-- 患者编辑弹窗 -->
  <PatientFormDialog
    v-model="patientDialogVisible"
    :mode="'edit'"
    :patient-id="route.params.id"
    @saved="onPatientSaved"
  />

  <!-- 子记录表单弹窗 -->
  <SubRecordFormDialog
    v-model="subDialogVisible"
    :mode="subDialogMode"
    :title="subDialogTitle"
    :schema="subDialogSchema"
    :record="subDialogRecord"
    @save="onSubRecordSave"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getPatientById, medicalHistoryApi, currentSymptomApi, physicalExamApi,
  examinationResultApi, diagnosisApi, treatmentPlanApi, progressNoteApi,
  financialInfoApi, medicalTeamApi, analyzePatient, suggestPatient
} from '@/api/patient'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import PatientFormDialog from '@/components/PatientFormDialog.vue'
import SubRecordFormDialog from '@/components/SubRecordFormDialog.vue'

const route = useRoute()
const router = useRouter()
const patient = ref(null)
const loading = ref(true)
const activeTab = ref('diagnoses')

// ---- 子记录弹窗 ----
const subDialogVisible = ref(false)
const subDialogMode = ref('new')
const subDialogTitle = ref('')
const subDialogSchema = ref([])
const subDialogRecord = ref(null)
const currentTabApi = ref(null)

// ---- 患者编辑弹窗 ----
const patientDialogVisible = ref(false)

// ---- AI 分析 ----
const aiAnalysis = ref(null)
const aiAnalyzing = ref(false)
const analyzedAt = ref(null)
const isAnalysisExpanded = ref(true)
const aiSuggestion = ref(null)
const aiSuggesting = ref(false)
const suggestedAt = ref(null)
const isSuggestionExpanded = ref(true)
const showSuggestion = ref(false)

const riskLabel = (level) => {
  const labels = { high: '高风险', moderate: '中风险', low: '低风险' }
  return labels[level] || level
}

const renderMarkdown = (text) => {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch {
    return text.replace(/\n/g, '<br>')
  }
}

const runAiAnalyze = async () => {
  aiAnalyzing.value = true
  try {
    const res = await analyzePatient(route.params.id)
    if (res?.success) {
      aiAnalysis.value = res.data.analysis
      analyzedAt.value = new Date().toISOString()
      isAnalysisExpanded.value = true
      ElMessage.success('AI 综合分析完成')
      await refreshPatient()
    } else {
      ElMessage.error(res?.error?.message || 'AI 分析失败')
    }
  } catch (e) {
    ElMessage.error('AI 分析请求失败: ' + (e.message || '网络错误'))
  } finally {
    aiAnalyzing.value = false
  }
}

const runAiSuggest = async () => {
  aiSuggesting.value = true
  try {
    const res = await suggestPatient(route.params.id)
    if (res?.success) {
      aiSuggestion.value = res.data.suggestions
      suggestedAt.value = res.data.suggestedAt || new Date().toISOString()
      showSuggestion.value = true
      isSuggestionExpanded.value = true
      ElMessage.success('AI 诊疗建议已生成')
    } else {
      ElMessage.error(res?.error?.message || 'AI 建议生成失败')
    }
  } catch (e) {
    ElMessage.error('AI 建议生成失败: ' + (e.message || '网络错误'))
  } finally {
    aiSuggesting.value = false
  }
}

// ---- 计算属性 ----
const primaryDiagnosis = computed(() => {
  const diags = patient.value?.diagnoses
  return diags?.length ? diags[0].diagnosisName : '待诊断'
})

const patientSummary = computed(() => {
  if (!patient.value) return ''
  const p = patient.value
  return [p.gender, p.age ? `${p.age}岁` : '', p.phone, p.address].filter(Boolean).join(' · ')
})

const profileItems = computed(() => {
  if (!patient.value) return []
  const p = patient.value
  return [
    { label: '患者编号', value: p.id },
    { label: '性别', value: p.gender || '--' },
    { label: '年龄', value: p.age ? `${p.age} 岁` : '--' },
    { label: '联系电话', value: p.phone || '--' },
    { label: '身份证号', value: p.idCard || '--' },
    { label: '居住地', value: p.address || '--' },
    { label: '医保类型', value: p.insurance || '--' },
    { label: '血型', value: p.bloodType || '--' },
    { label: '职业', value: p.occupation || '--' },
    { label: 'AI 同意', value: p.aiConsent ? '是' : '否' }
  ]
})

// 根据 tab key 获取对应记录数组
const getRecords = (key) => {
  return patient.value?.[key] || []
}

// 根据 key 获取 api 和操作对象
const getTabInfo = (key) => tabs.find(t => t.key === key)

// ===== 弹窗操作 =====
const openAddDialog = (key) => {
  const tab = getTabInfo(key)
  if (!tab) return
  currentTabApi.value = tab.api
  subDialogMode.value = 'new'
  subDialogTitle.value = `新增${tab.label}`
  subDialogSchema.value = tab.schema
  subDialogRecord.value = null
  subDialogVisible.value = true
}

const openEditDialog = (key, record) => {
  const tab = getTabInfo(key)
  if (!tab) return
  currentTabApi.value = tab.api
  subDialogMode.value = 'edit'
  subDialogTitle.value = `编辑${tab.label}`
  subDialogSchema.value = tab.schema
  subDialogRecord.value = record
  subDialogVisible.value = true
}

const onSubRecordSave = async (data) => {
  const patientId = route.params.id
  const api = currentTabApi.value
  if (!api) return

  try {
    let res
    if (subDialogMode.value === 'new') {
      res = await api.create(patientId, data)
    } else {
      res = await api.update(patientId, subDialogRecord.value.id, data)
    }
    if (res?.success) {
      ElMessage.success(subDialogMode.value === 'new' ? '记录已添加' : '记录已更新')
      subDialogVisible.value = false
      await refreshPatient()
    } else {
      ElMessage.error(res?.error?.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + (error?.response?.data?.error?.message || error.message))
  }
}

const deleteRecord = async (key, recordId) => {
  const tab = getTabInfo(key)
  if (!tab) return

  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？此操作不可恢复。', '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await tab.api.remove(route.params.id, recordId)
    if (res?.success) {
      ElMessage.success('记录已删除')
      await refreshPatient()
    } else {
      ElMessage.error(res?.error?.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('删除失败: ' + (error?.response?.data?.error?.message || error.message))
    }
  }
}

// ===== 患者相关操作 =====
const goEdit = () => { patientDialogVisible.value = true }

const onPatientSaved = async () => {
  patientDialogVisible.value = false
  await refreshPatient()
}

const goBack = () => { router.push('/patients') }

const refreshPatient = async () => {
  try {
    const patientRes = await getPatientById(route.params.id)
    if (patientRes?.success) {
      patient.value = patientRes.data
      loadAiFromPatient(patientRes.data)
    }
  } catch (e) {
    console.error('刷新患者数据失败:', e)
  }
}

const loadAiFromPatient = (p) => {
  const notes = p.aiNotes
  if (notes && typeof notes === 'object') {
    aiAnalysis.value = notes.analysis || null
    aiSuggestion.value = notes.suggestion || null
    showSuggestion.value = !!notes.suggestion
    analyzedAt.value = notes.analyzedAt || null
    suggestedAt.value = notes.suggestedAt || null
  } else {
    aiAnalysis.value = null
    aiSuggestion.value = null
    analyzedAt.value = null
    suggestedAt.value = null
  }
}

// ===== 工具函数 =====
const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '--'
const formatDateTime = (d) => {
  if (!d) return '--'
  const dt = new Date(d)
  return dt.toLocaleDateString('zh-CN') + ' ' + dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const stringify = (val) => {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(stringify).filter(Boolean).join('、')
  if (typeof val === 'object') {
    if (val.text) return val.text
    // 用药项：name + dose + frequency
    if (val.name) {
      const parts = [val.name]
      if (val.dose) parts.push(val.dose)
      if (val.frequency) parts.push(`(${val.frequency})`)
      return parts.join(' ')
    }
    // 生活建议：type + recommendation
    if (val.recommendation) {
      const label = val.type || '建议'
      return `${label}: ${val.recommendation}`
    }
    // 随访：doctor/purpose/next_appointment
    if (val.doctor || val.purpose || val.next_appointment) {
      const parts = []
      if (val.doctor) parts.push(`医生: ${val.doctor}`)
      if (val.purpose) parts.push(`目的: ${val.purpose}`)
      if (val.next_appointment) parts.push(`下次: ${val.next_appointment}`)
      return parts.join(' | ')
    }
    // 通用对象 → key: value
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' | ')
  }
  return String(val)
}

const parseJson = (val) => {
  if (!val) return {}
  if (typeof val === 'string') { try { return JSON.parse(val) } catch { return { '详情': val } } }
  return val
}

const normalizeArray = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val] } catch { return [val] } }
  if (typeof val === 'object') return [val]
  return [val]
}

const formatMedItem = (item) => {
  if (!item) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'object') {
    const parts = [item.name || '']
    if (item.dose) parts.push(item.dose)
    if (item.frequency) parts.push(`(${item.frequency})`)
    return parts.filter(Boolean).join(' ')
  }
  return String(item)
}

const stringifyField = (obj, key) => {
  if (!obj || typeof obj !== 'object') return ''
  return obj[key] || ''
}

const formatKvObject = (val) => {
  if (!val) return '--'
  let obj = val
  if (typeof val === 'string') { try { obj = JSON.parse(val) } catch { return val } }
  if (typeof obj !== 'object' || Array.isArray(obj)) return stringify(val)
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' | ')
}

const normalizeObject = (val) => {
  if (!val) return {}
  if (typeof val === 'object' && !Array.isArray(val)) return val
  if (typeof val === 'string') { try { const p = JSON.parse(val); return typeof p === 'object' && !Array.isArray(p) ? p : {} } catch { return {} } }
  return {}
}

const followUpLabelMap = {
  doctor: '主治医师',
  purpose: '复查目的',
  next_appointment: '下次随访',
  '医生': '主治医师',
  '目的': '复查目的',
  '下次随访': '下次随访',
  '复查时间': '下次随访'
}

const followUpLabel = (key) => {
  return followUpLabelMap[key] || key
}

// 解析检查报告文本 → [{ label: '血常规', items: ['WBC 6.5x10^9/L', ...] }, ...]
const parseExamSections = (text) => {
  if (!text) return []
  const t = typeof text === 'string' ? text : String(text)
  // 按顶级分隔符拆分子章节：中文冒号前作为标签
  const sections = []
  // 先按中英文句号分割大段
  const parts = t.split(/[。；;]/).filter(Boolean)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    // 尝试找到第一个冒号作为标签分隔
    const colonIdx = trimmed.search(/[：:]/)
    if (colonIdx > 0) {
      const label = trimmed.slice(0, colonIdx).trim()
      const content = trimmed.slice(colonIdx + 1).trim()
      if (content) {
        // 按逗号和中文逗号拆分值
        const items = content.split(/[,，]/).map(s => s.trim()).filter(Boolean)
        sections.push({ label, items })
      }
    } else {
      // 没有冒号，整体作为一项
      if (sections.length > 0) {
        sections[sections.length - 1].items.push(trimmed)
      } else {
        sections.push({ label: '', items: [trimmed] })
      }
    }
  }
  return sections
}

const getPhysicianName = (v) => v ? (typeof v === 'string' ? v : (v.name || JSON.stringify(v))) : '未分配'
const getNurseName = (v) => v ? (typeof v === 'string' ? v : (v.name || '')) : ''
const parseSpecialists = (val) => {
  if (!val) return []
  if (typeof val === 'string') { try { val = JSON.parse(val) } catch { return [val] } }
  if (Array.isArray(val)) return val.map(s => typeof s === 'object' ? `${s.name || ''}(${s.department || ''})` : String(s))
  return []
}

const getDiagnosisTypeClass = (t) => t === '主要诊断' ? 'danger' : t === '次要诊断' ? 'warn' : ''
const getPaymentClass = (s) => s === '已支付' ? 'success' : s === '部分支付' ? 'warn' : 'danger'

// ===== 表单 Schema 定义 =====
const diagnosisSchema = [
  { key: 'diagnosisName', label: '诊断名称', type: 'text', required: true, placeholder: '请输入诊断名称' },
  { key: 'type', label: '诊断类型', type: 'select', required: true, options: ['主要诊断', '次要诊断', '鉴别诊断'] },
  { key: 'icdCode', label: 'ICD 编码', type: 'text', placeholder: '请输入 ICD-10 编码' },
  { key: 'doctorName', label: '诊断医师', type: 'text', placeholder: '请输入医师姓名' },
  { key: 'diagnosisDate', label: '诊断日期', type: 'date' }
]

const medicalHistorySchema = [
  { key: 'type', label: '病史类型', type: 'select', required: true, options: ['慢性疾病', '手术史', '过敏史', '家族史', '疫苗接种'] },
  { key: 'details', label: '详细内容（键值对）', type: 'kvlist', required: true, keyPlaceholder: '字段', valuePlaceholder: '内容', spanFull: true }
]

const currentSymptomSchema = [
  { key: 'mainComplaint', label: '主诉', type: 'text', required: true, placeholder: '请输入主要症状' },
  { key: 'severity', label: '严重程度', type: 'select', options: ['轻', '中', '重'] },
  { key: 'duration', label: '持续时间', type: 'text', placeholder: '如：3天' },
  { key: 'aggravatingFactors', label: '加重因素', type: 'text' },
  { key: 'relievingFactors', label: '缓解因素', type: 'text' },
  { key: 'symptoms', label: '症状详情', type: 'tags', placeholder: '输入症状名称，按回车添加' }
]

const physicalExamSchema = [
  { key: 'vitalSigns', label: '生命体征', type: 'textarea', rows: 2, placeholder: '如：T 36.5°C, P 72次/分, R 18次/分, BP 120/80mmHg' },
  { key: 'generalAppearance', label: '一般外观', type: 'textarea', rows: 2 },
  { key: 'headAndNeck', label: '头部/颈部', type: 'textarea', rows: 2 },
  { key: 'chest', label: '胸部', type: 'textarea', rows: 2 },
  { key: 'cardiovascular', label: '心血管', type: 'textarea', rows: 2 },
  { key: 'abdomen', label: '腹部', type: 'textarea', rows: 2 },
  { key: 'extremities', label: '四肢', type: 'textarea', rows: 2 },
  { key: 'neurological', label: '神经系统', type: 'textarea', rows: 2 }
]

const examinationResultSchema = [
  { key: 'laboratoryTests', label: '实验室检查', type: 'textarea', rows: 3, placeholder: '如：血常规、尿常规结果' },
  { key: 'imagingStudies', label: '影像学检查', type: 'textarea', rows: 3, placeholder: '如：X光、CT、MRI结果' },
  { key: 'specialTests', label: '特殊检查', type: 'textarea', rows: 3, placeholder: '如：心电图、内镜结果' }
]

const treatmentPlanSchema = [
  { key: 'medication', label: '用药方案', type: 'rows', spanFull: true,
    fields: [
      { key: 'name', label: '药品名称', type: 'text', required: true, placeholder: '如：阿司匹林' },
      { key: 'dose', label: '剂量', type: 'text', placeholder: '如：100mg' },
      { key: 'frequency', label: '频次', type: 'text', placeholder: '如：qd（每日一次）' }
    ],
    addLabel: '添加药品' },
  { key: 'procedures', label: '处置/手术', type: 'tags', placeholder: '输入处置名称，按回车添加' },
  { key: 'lifestyleRecommendations', label: '生活建议', type: 'rows', spanFull: true,
    fields: [
      { key: 'type', label: '类型', type: 'select', required: true, options: ['饮食', '运动', '作息', '心理', '其他'] },
      { key: 'recommendation', label: '建议内容', type: 'textarea', rows: 2, placeholder: '请输入具体建议' }
    ],
    addLabel: '添加建议' },
  { key: 'followUpPlan', label: '随访计划', type: 'kvlist', spanFull: true, keyPlaceholder: '字段（如：医生、目的、下次随访）', valuePlaceholder: '值' }
]

const progressNoteSchema = [
  { key: 'type', label: '记录类型', type: 'select', required: true, options: ['入院记录', '病程记录', '手术记录', '出院记录'] },
  { key: 'author', label: '记录人', type: 'text', required: true, placeholder: '请输入记录人姓名' },
  { key: 'content', label: '记录内容', type: 'textarea', required: true, rows: 5, placeholder: '请输入病程记录内容' },
  { key: 'noteDate', label: '记录日期', type: 'date', required: true },
  { key: 'noteTime', label: '记录时间', type: 'text', placeholder: 'HH:MM:SS' }
]

const financialInfoSchema = [
  { key: 'totalCost', label: '总费用', type: 'number', placeholder: '请输入总费用金额' },
  { key: 'insuranceCoverage', label: '医保覆盖', type: 'number', placeholder: '请输入医保覆盖金额' },
  { key: 'selfPayment', label: '自费金额', type: 'number', placeholder: '请输入自费金额' },
  { key: 'paymentStatus', label: '支付状态', type: 'select', required: true, options: ['未支付', '部分支付', '已支付'] },
  { key: 'paymentHistory', label: '支付历史', type: 'tags', placeholder: '输入支付记录，按回车添加' }
]

const medicalTeamSchema = [
  { key: 'primaryPhysician', label: '主治医师', type: 'kvlist', spanFull: true, keyPlaceholder: '字段', valuePlaceholder: '值' },
  { key: 'nurse', label: '责任护士', type: 'kvlist', spanFull: true, keyPlaceholder: '字段', valuePlaceholder: '值' },
  { key: 'specialists', label: '专科医师', type: 'rows', spanFull: true,
    fields: [
      { key: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入姓名' },
      { key: 'department', label: '科室', type: 'text', placeholder: '请输入科室' },
      { key: 'role', label: '角色', type: 'text', placeholder: '如：会诊医生' }
    ],
    addLabel: '添加专科医师' }
]

// ---- Tab 定义 ----
const tabs = [
  { key: 'diagnoses',          label: '诊断记录', api: diagnosisApi,          schema: diagnosisSchema },
  { key: 'medicalHistories',   label: '病史记录', api: medicalHistoryApi,    schema: medicalHistorySchema },
  { key: 'currentSymptoms',    label: '当前症状', api: currentSymptomApi,     schema: currentSymptomSchema },
  { key: 'physicalExaminations', label: '体格检查', api: physicalExamApi,     schema: physicalExamSchema },
  { key: 'examinationResults', label: '检查结果', api: examinationResultApi,  schema: examinationResultSchema },
  { key: 'treatmentPlans',     label: '治疗方案', api: treatmentPlanApi,      schema: treatmentPlanSchema },
  { key: 'progressNotes',      label: '病程记录', api: progressNoteApi,       schema: progressNoteSchema },
  { key: 'financialInfos',     label: '财务信息', api: financialInfoApi,      schema: financialInfoSchema },
  { key: 'medicalTeams',       label: '医疗团队', api: medicalTeamApi,        schema: medicalTeamSchema },
]

// ===== 初始化 =====
onMounted(async () => {
  loading.value = true
  try {
    const res = await getPatientById(route.params.id)
    if (res?.success) {
      patient.value = res.data
      loadAiFromPatient(res.data)
      // 自动切换到第一个有数据的 tab
      for (const tab of tabs) {
        if (getRecords(tab.key).length > 0) {
          activeTab.value = tab.key
          break
        }
      }
    } else {
      ElMessage.error('患者不存在')
    }
  } catch (e) {
    ElMessage.error('获取患者详情失败')
  } finally {
    loading.value = false
  }
})
</script>

<style lang="less" scoped>
.detail-page { display: flex; flex-direction: column; gap: 8px; }

.detail-hero {
  padding: 12px;
  display: flex; align-items: start; justify-content: space-between; gap: 14px;
  h2 { margin: 6px 0 2px; font-size: 22px; }
  p { margin: 0; color: var(--text-secondary); max-width: 820px; line-height: 1.6; font-size: 12px; }
}

.hero-actions { display: flex; gap: 8px; flex-shrink: 0; }

.primary-btn, .ghost-btn {
  min-height: 32px; padding: 0 12px; border-radius: 10px; font-size: 13px; cursor: pointer;
}
.primary-btn { background: linear-gradient(135deg, var(--accent-cyan), #9ce7ff); color: #fff; border: none; }
.ghost-btn { border: 1px solid rgba(90, 141, 238, 0.16); background: #f5f9ff; color: var(--text-primary); }

// 基础资料卡片
.profile-card { padding: 12px; }

.kv-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.kv-item {
  padding: 6px 8px; border-radius: 10px; background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);
  span { display: block; margin-bottom: 1px; color: var(--text-muted); font-size: 10px; }
  strong { font-size: 12px; word-break: break-all; }
}

// Tab 区域
.tab-section { padding: 6px; }

.detail-tabs {
  border-radius: 14px; overflow: hidden;
  :deep(.el-tabs__header) { margin-bottom: 0; border-radius: 14px 14px 0 0; }
  :deep(.el-tabs__content) { padding: 12px; min-height: 200px; }
}

.tab-toolbar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
  .tab-count { color: var(--text-muted); font-size: 13px; }
}

.add-btn {
  min-height: 30px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--accent-cyan);
  background: rgba(92, 225, 230, 0.08); color: #2e9ea6; font-size: 12px; cursor: pointer;
  transition: background 0.15s; font-weight: 500;
  &:hover { background: rgba(92, 225, 230, 0.16); }
}

.empty-tab {
  text-align: center; padding: 32px 12px; color: var(--text-muted);
  p { margin: 0; font-size: 14px; }
}

// 记录列表
.record-list { display: grid; gap: 8px; }

.record-item {
  display: flex; padding: 10px 12px; border-radius: 10px;
  background: #f9fbff; border: 1px solid rgba(148, 163, 184, 0.08);
  gap: 12px; align-items: flex-start;
  &:hover { border-color: rgba(92, 225, 230, 0.18); }
}

.record-body { flex: 1; min-width: 0; }

.record-actions {
  display: flex; gap: 4px; flex-shrink: 0; margin-top: 2px;
}

.icon-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 14px; display: grid; place-items: center; transition: all 0.15s;
  &.edit { background: rgba(90, 141, 238, 0.08); color: var(--text-secondary); }
  &.edit:hover { background: rgba(90, 141, 238, 0.18); color: var(--text-primary); }
  &.del { background: rgba(255, 100, 100, 0.06); color: #d32f2f; }
  &.del:hover { background: rgba(255, 100, 100, 0.14); }
}

.record-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; strong { font-size: 14px; } }
.record-meta { display: flex; gap: 8px; margin-top: 2px; color: var(--text-muted); font-size: 12px; flex-wrap: wrap; }
.record-detail { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;
  span { color: var(--text-secondary); font-size: 12px; padding: 2px 8px; border-radius: 6px; background: rgba(148, 163, 184, 0.06); }
}
.record-text { margin: 4px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.7; strong { color: var(--text-primary); } }
.record-lifestyle { margin-top: 6px; color: var(--text-secondary); font-size: 13px; line-height: 1.7;
  strong { color: var(--text-primary); }
  p { margin: 2px 0 0 0; padding-left: 8px; }
  .ls-type { display: inline-block; min-width: 32px; padding: 0 6px; margin-right: 4px; border-radius: 4px; font-size: 11px; color: #2e9ea6; background: rgba(92,225,230,0.08); }
}
.record-date { color: var(--text-muted); font-size: 12px; }
.record-type-tag { font-size: 13px; font-weight: 600; color: var(--accent-cyan); background: rgba(92, 225, 230, 0.08); padding: 2px 10px; border-radius: 6px; }

// 体格检查迷你网格
.kv-grid-mini { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px;
  .kv-item { padding: 4px 6px; span { font-size: 9px; } strong { font-size: 11px; } }
}

// 费用展示
.finance-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.finance-cell { text-align: center; span { display: block; color: var(--text-muted); font-size: 10px; margin-bottom: 2px; } strong { font-size: 14px; } }

// 检查报告
.exam-section { margin-top: 10px; }
.exam-section-title { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: var(--text-primary); padding-bottom: 4px; border-bottom: 1px solid rgba(92,225,230,0.15); }
.exam-group { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; }
.exam-group-label { flex-shrink: 0; min-width: 64px; padding: 1px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #3a5fa0; background: rgba(90,141,238,0.08); text-align: center; }
.exam-group-values { display: flex; flex-wrap: wrap; gap: 4px; }
.exam-value { padding: 2px 8px; border-radius: 6px; background: rgba(148,163,184,0.05); color: var(--text-secondary); font-size: 12px; border: 1px solid rgba(148,163,184,0.08); white-space: nowrap; }

// 随访计划网格
.followup-grid { margin-top: 6px; grid-template-columns: repeat(3, 1fr); }

// 病程时间线
.timeline-item { display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: start; }
.timeline-dot { width: 8px; height: 8px; margin-top: 4px; border-radius: 50%; background: var(--accent-cyan); box-shadow: 0 0 10px rgba(92, 225, 230, 0.4); }
.timeline-content {
  padding: 6px 10px; border-radius: 10px; background: #f6f9ff; border: 1px solid rgba(148, 163, 184, 0.06);
  p { margin: 3px 0 0; color: var(--text-secondary); line-height: 1.6; font-size: 12px; }
}
.timeline-head { display: flex; justify-content: space-between; gap: 8px; strong { font-size: 12px; } span { color: var(--text-muted); font-size: 10px; } }
.timeline-author { color: var(--text-muted) !important; font-size: 11px !important; margin-top: 2px !important; }

// 状态标签
.status-pill {
  display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 999px;
  font-size: 10px; border: 1px solid transparent; white-space: nowrap;
  &.success { color: var(--accent-green); background: rgba(61, 217, 165, 0.08); border-color: rgba(61, 217, 165, 0.12); }
  &.warn { color: var(--accent-gold); background: rgba(246, 198, 107, 0.08); border-color: rgba(246, 198, 107, 0.12); }
  &.danger { color: var(--accent-rose); background: rgba(255, 125, 144, 0.08); border-color: rgba(255, 125, 144, 0.12); }
}

.empty-state { display: grid; gap: 10px; justify-items: start; padding: 12px; }
.back-link { display: inline-flex; align-items: center; min-height: 34px; padding: 0 12px; border-radius: 10px; background: rgba(91, 139, 255, 0.1); border: 1px solid rgba(91, 139, 255, 0.18); color: var(--text-primary); font-size: 13px; }

// AI 按钮
.ai-analyze-btn, .ai-suggest-btn {
  min-height: 32px; padding: 0 12px; border-radius: 10px; font-size: 13px; cursor: pointer;
}
.ai-analyze-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.ai-suggest-btn {
  background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff; border: none;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

// AI 分析结果卡片
.ai-card {
  padding: 14px; border: 1px solid rgba(99, 102, 241, 0.15); background: linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(139, 92, 246, 0.02));
  .panel-title { font-size: 16px; display: flex; align-items: center; gap: 8px; }
}

.risk-badge {
  display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
  &.risk-high { color: #dc2626; background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.15); }
  &.risk-moderate { color: #d97706; background: rgba(217, 119, 6, 0.08); border: 1px solid rgba(217, 119, 6, 0.15); }
  &.risk-low { color: #059669; background: rgba(5, 150, 105, 0.08); border: 1px solid rgba(5, 150, 105, 0.15); }
}

.ai-findings { display: grid; gap: 10px; margin-top: 8px; }
.ai-section {
  h4 { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: var(--text-primary); }
  ul { margin: 0; padding-left: 16px; li { margin-bottom: 2px; color: var(--text-secondary); font-size: 13px; line-height: 1.6; } }
  p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.7; }
}

// AI 建议
.ai-suggest-card { border-color: rgba(245, 158, 11, 0.2); background: linear-gradient(135deg, rgba(245, 158, 11, 0.03), rgba(249, 115, 22, 0.02)); }
.ai-suggest-hidden { opacity: 0.6; .panel-title { font-size: 14px; } }
.ai-suggest-content {
  padding-top: 8px; color: var(--text-secondary); font-size: 13px; line-height: 1.8;
  :deep(h2) { font-size: 16px; color: var(--text-primary); }
  :deep(h3) { font-size: 14px; color: var(--text-primary); }
  :deep(strong) { color: var(--text-primary); }
  :deep(ul) { padding-left: 16px; li { margin-bottom: 4px; } }
}
.ghost-btn-sm { min-height: 28px; padding: 0 10px; border-radius: 8px; font-size: 12px; border: 1px solid rgba(90, 141, 238, 0.16); background: #f5f9ff; color: var(--text-primary); cursor: pointer; }
.panel-header-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.ai-time { color: var(--text-muted); font-size: 11px; }

// 响应式
@media (max-width: 1100px) { .kv-grid { grid-template-columns: repeat(2, 1fr); } .kv-grid-mini { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .detail-hero { flex-direction: column; gap: 10px; h2 { font-size: 18px; } }
  .hero-actions { width: 100%; button { flex: 1; } }
  .kv-grid { grid-template-columns: repeat(2, 1fr); }
  .finance-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kv-grid-mini { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 480px) {
  .kv-grid, .finance-grid { grid-template-columns: 1fr; }
  .kv-grid-mini { grid-template-columns: 1fr; }
}
</style>
