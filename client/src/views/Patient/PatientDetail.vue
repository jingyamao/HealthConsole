<template>
  <div class="page-shell detail-page" v-if="loading">
    <section class="glass-panel detail-hero">
      <span class="section-badge">Loading</span>
      <h2>正在加载患者档案...</h2>
    </section>
  </div>

  <div class="page-shell detail-page" v-else-if="patient">
    <section class="glass-panel detail-hero">
      <div>
        <span class="section-badge">Patient Profile</span>
        <h2>{{ patient.name }} · {{ primaryDiagnosis }}</h2>
        <p>{{ patientSummary }}</p>
      </div>
      <div class="hero-actions">
        <button class="primary-btn" @click="goEdit">编辑患者</button>
        <button class="ghost-btn" @click="goBack">返回列表</button>
      </div>
    </section>

    <section class="detail-grid">
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

      <article class="glass-panel monitor-card" v-if="physicalExam">
        <h3 class="panel-title">最近体格检查</h3>
        <div class="monitor-metrics">
          <div class="monitor-item" v-if="physicalExam.vitalSigns">
            <span>生命体征</span>
            <strong>{{ physicalExam.vitalSigns }}</strong>
          </div>
          <div class="monitor-item" v-if="physicalExam.generalAppearance">
            <span>一般外观</span>
            <strong>{{ physicalExam.generalAppearance }}</strong>
          </div>
          <div class="monitor-item" v-if="physicalExam.cardiovascular">
            <span>心血管</span>
            <strong>{{ physicalExam.cardiovascular }}</strong>
          </div>
          <div class="monitor-item" v-if="physicalExam.neurological">
            <span>神经系统</span>
            <strong>{{ physicalExam.neurological }}</strong>
          </div>
        </div>
      </article>
    </section>

    <!-- 诊断记录 -->
    <section class="glass-panel section-card" v-if="diagnoses.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">诊断记录</h3>
          <p class="panel-subtitle">共 {{ diagnoses.length }} 条诊断</p>
        </div>
      </div>
      <div class="record-list">
        <div v-for="item in diagnoses" :key="item.id" class="record-item">
          <div class="record-head">
            <strong>{{ item.diagnosisName }}</strong>
            <span class="status-pill" :class="getDiagnosisTypeClass(item.type)">{{ item.type }}</span>
          </div>
          <div class="record-meta">
            <span v-if="item.icdCode">ICD: {{ item.icdCode }}</span>
            <span v-if="item.diagnosisDate">{{ formatDate(item.diagnosisDate) }}</span>
            <span v-if="item.doctorName">医师: {{ item.doctorName }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 既往病史 -->
    <section class="glass-panel section-card" v-if="medicalHistories.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">既往病史</h3>
          <p class="panel-subtitle">共 {{ medicalHistories.length }} 条记录</p>
        </div>
      </div>
      <div class="record-list">
        <div v-for="item in medicalHistories" :key="item.id" class="record-item">
          <div class="record-head">
            <strong>{{ item.type }}</strong>
          </div>
          <div class="record-detail" v-if="item.details">
            <span v-for="(val, key) in parseJson(item.details)" :key="key">{{ key }}: {{ val }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 当前症状 -->
    <section class="glass-panel section-card" v-if="currentSymptoms.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">当前症状</h3>
          <p class="panel-subtitle">共 {{ currentSymptoms.length }} 条记录</p>
        </div>
      </div>
      <div class="record-list">
        <div v-for="item in currentSymptoms" :key="item.id" class="record-item">
          <div class="record-head">
            <strong>{{ item.mainComplaint || '未填写主诉' }}</strong>
            <span v-if="item.severity" class="status-pill warn">{{ item.severity }}</span>
          </div>
          <div class="record-detail">
            <span v-if="item.duration">持续时间: {{ item.duration }}</span>
            <span v-if="item.aggravatingFactors">加重因素: {{ item.aggravatingFactors }}</span>
            <span v-if="item.relievingFactors">缓解因素: {{ item.relievingFactors }}</span>
          </div>
          <div class="record-detail" v-if="item.symptoms">
            <span v-for="(s, i) in parseSymptoms(item.symptoms)" :key="i">{{ s }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 治疗方案 -->
    <section class="glass-panel section-card" v-if="treatmentPlans.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">治疗方案</h3>
          <p class="panel-subtitle">共 {{ treatmentPlans.length }} 条方案</p>
        </div>
      </div>
      <div class="record-list">
        <div v-for="item in treatmentPlans" :key="item.id" class="record-item">
          <div class="record-head">
            <strong>治疗方案</strong>
            <span class="record-date">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="record-detail" v-if="item.medication">
            <span v-for="(m, i) in parseJsonArray(item.medication)" :key="'m'+i">用药: {{ m }}</span>
          </div>
          <div class="record-detail" v-if="item.procedures">
            <span v-for="(p, i) in parseJsonArray(item.procedures)" :key="'p'+i">操作: {{ p }}</span>
          </div>
          <p v-if="item.lifestyleRecommendations" class="record-text">
            <strong>生活建议:</strong> {{ stringify(item.lifestyleRecommendations) }}
          </p>
          <p v-if="item.followUpPlan" class="record-text">
            <strong>随访计划:</strong> {{ stringify(item.followUpPlan) }}
          </p>
        </div>
      </div>
    </section>

    <!-- 检查结果 -->
    <section class="glass-panel section-card" v-if="examinationResults.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">检查结果</h3>
          <p class="panel-subtitle">共 {{ examinationResults.length }} 项检查</p>
        </div>
      </div>
      <div class="record-list">
        <div v-for="item in examinationResults" :key="item.id" class="record-item">
          <div class="record-head">
            <strong>检查报告</strong>
            <span class="record-date">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="record-detail">
            <span v-if="item.laboratoryTests">实验室检查: {{ item.laboratoryTests }}</span>
            <span v-if="item.imagingStudies">影像学: {{ item.imagingStudies }}</span>
            <span v-if="item.specialTests">特殊检查: {{ item.specialTests }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 费用信息 -->
    <section class="glass-panel section-card" v-if="financialInfos.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">费用信息</h3>
          <p class="panel-subtitle">共 {{ financialInfos.length }} 条记录</p>
        </div>
      </div>
      <div class="record-list">
        <div v-for="item in financialInfos" :key="item.id" class="record-item finance-item">
          <div class="finance-grid">
            <div class="finance-cell">
              <span>总费用</span>
              <strong>¥ {{ (item.totalCost || 0).toLocaleString() }}</strong>
            </div>
            <div class="finance-cell">
              <span>医保覆盖</span>
              <strong>¥ {{ (item.insuranceCoverage || 0).toLocaleString() }}</strong>
            </div>
            <div class="finance-cell">
              <span>自费部分</span>
              <strong>¥ {{ (item.selfPayment || 0).toLocaleString() }}</strong>
            </div>
            <div class="finance-cell">
              <span>支付状态</span>
              <strong class="status-pill" :class="getPaymentClass(item.paymentStatus)">{{ item.paymentStatus }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 病程记录 -->
    <section class="glass-panel timeline-card" v-if="progressNotes.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">病程记录</h3>
          <p class="panel-subtitle">共 {{ progressNotes.length }} 条记录</p>
        </div>
      </div>
      <div class="timeline">
        <div v-for="item in progressNotes" :key="item.id" class="timeline-item">
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
      </div>
    </section>

    <!-- 医疗团队 -->
    <section class="glass-panel section-card" v-if="medicalTeams.length > 0">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">医疗团队</h3>
          <p class="panel-subtitle">共 {{ medicalTeams.length }} 条记录</p>
        </div>
      </div>
      <div class="record-list">
        <div v-for="item in medicalTeams" :key="item.id" class="record-item">
          <div class="record-head">
            <strong>主治医师: {{ getPhysicianName(item.primaryPhysician) }}</strong>
          </div>
          <div class="record-detail">
            <span v-if="getNurseName(item.nurse)">责任护士: {{ getNurseName(item.nurse) }}</span>
            <span v-for="(spec, i) in parseSpecialists(item.specialists)" :key="i">{{ spec }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>

  <div class="page-shell detail-page" v-else>
    <section class="glass-panel detail-hero empty-state">
      <h2>未找到患者档案</h2>
      <p>当前患者 ID 不存在，可以返回列表页重新选择。</p>
      <router-link to="/patients" class="back-link">返回患者列表</router-link>
    </section>
  </div>

  <PatientFormDialog
    v-model="dialogVisible"
    :mode="dialogMode"
    :patient-id="dialogPatientId"
    @saved="onDialogSaved"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPatientById } from '@/api/patient'
import { ElMessage } from 'element-plus'
import PatientFormDialog from '@/components/PatientFormDialog.vue'

const route = useRoute()
const router = useRouter()

const patient = ref(null)
const loading = ref(true)

// ---- 弹窗 ----
const dialogVisible = ref(false)
const dialogMode = ref('edit')
const dialogPatientId = ref(null)

const primaryDiagnosis = computed(() => {
  if (!patient.value?.diagnoses?.length) return '待诊断'
  return patient.value.diagnoses[0].diagnosisName || '待诊断'
})

const patientSummary = computed(() => {
  if (!patient.value) return ''
  const parts = []
  if (patient.value.gender) parts.push(patient.value.gender)
  if (patient.value.age) parts.push(`${patient.value.age}岁`)
  if (patient.value.phone) parts.push(patient.value.phone)
  if (patient.value.address) parts.push(patient.value.address)
  return parts.join(' · ')
})

const diagnoses = computed(() => patient.value?.diagnoses || [])
const medicalHistories = computed(() => patient.value?.medicalHistories || [])
const treatmentPlans = computed(() => patient.value?.treatmentPlans || [])
const financialInfos = computed(() => patient.value?.financialInfos || [])
const currentSymptoms = computed(() => patient.value?.currentSymptoms || [])
const progressNotes = computed(() => patient.value?.progressNotes || [])
const medicalTeams = computed(() => patient.value?.medicalTeams || [])
const physicalExam = computed(() => patient.value?.physicalExaminations?.[0] || null)
const examinationResults = computed(() => patient.value?.examinationResults || [])

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

const formatDate = (dateStr) => {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const stringify = (val) => {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(stringify).filter(Boolean).join('、')
  if (typeof val === 'object') {
    if (val.text) return val.text
    if (val.name) return val.name
    if (val.recommendation) return `${val.type || ''}${val.recommendation}`
    if (val.description) return val.description
    if (val.title) return val.title
    const parts = Object.entries(val).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    return parts.length ? parts.join('；') : JSON.stringify(val)
  }
  return String(val)
}

const parseJson = (val) => {
  if (!val) return {}
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return { '详情': val } }
  }
  return val
}

const parseJsonArray = (val) => {
  if (!val) return []
  if (typeof val === 'string') {
    try { val = JSON.parse(val) } catch { return [val] }
  }
  if (Array.isArray(val)) return val.map(v => stringify(v)).filter(Boolean)
  if (typeof val === 'object') return [stringify(val)]
  return [String(val)]
}

const parseSymptoms = (val) => {
  if (!val) return []
  if (typeof val === 'string') {
    try { val = JSON.parse(val) } catch { return [val] }
  }
  if (Array.isArray(val)) return val.map(v => stringify(v)).filter(Boolean)
  if (typeof val === 'object') return [stringify(val)]
  return [String(val)]
}

const getPhysicianName = (val) => {
  if (!val) return '未分配'
  if (typeof val === 'string') return val
  return val.name || JSON.stringify(val)
}

const getNurseName = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.name || ''
}

const parseSpecialists = (val) => {
  if (!val) return []
  if (typeof val === 'string') {
    try { val = JSON.parse(val) } catch { return [val] }
  }
  if (Array.isArray(val)) return val.map(s => typeof s === 'object' ? `${s.name || ''}(${s.department || ''})` : String(s))
  return []
}

const getDiagnosisTypeClass = (type) => {
  if (type === '主要诊断') return 'danger'
  if (type === '次要诊断') return 'warn'
  return ''
}

const getPaymentClass = (status) => {
  if (status === '已支付') return 'success'
  if (status === '部分支付') return 'warn'
  return 'danger'
}

const goEdit = () => {
  dialogMode.value = 'edit'
  dialogPatientId.value = route.params.id
  dialogVisible.value = true
}

const onDialogSaved = async () => {
  // 刷新患者详情数据
  try {
    const res = await getPatientById(route.params.id)
    if (res?.success) {
      patient.value = res.data
    }
  } catch (error) {
    console.error('刷新患者数据失败:', error)
  }
}

const goBack = () => {
  router.push('/patients')
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await getPatientById(route.params.id)
    if (res?.success) {
      patient.value = res.data
    } else {
      ElMessage.error('患者不存在')
    }
  } catch (error) {
    console.error('获取患者详情失败:', error)
    ElMessage.error('获取患者详情失败')
  } finally {
    loading.value = false
  }
})
</script>

<style lang="less" scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-hero,
.profile-card,
.monitor-card,
.section-card,
.timeline-card {
  padding: 12px;
}

.detail-hero {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;

  h2 {
    margin: 6px 0 2px;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    max-width: 820px;
    line-height: 1.6;
    font-size: 12px;
  }
}

.hero-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.primary-btn,
.ghost-btn {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 13px;
}

.primary-btn {
  background: linear-gradient(135deg, var(--accent-cyan), #9ce7ff);
  color: #ffffff;
  border: none;
}

.ghost-btn {
  border: 1px solid rgba(90, 141, 238, 0.16);
  background: #f5f9ff;
  color: var(--text-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 8px;
}

.kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.kv-item {
  padding: 6px 8px;
  border-radius: 10px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);

  span {
    display: block;
    margin-bottom: 1px;
    color: var(--text-muted);
    font-size: 10px;
  }

  strong {
    font-size: 12px;
    word-break: break-all;
  }
}

.monitor-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.monitor-metrics {
  display: grid;
  gap: 6px;
}

.monitor-item {
  padding: 6px 8px;
  border-radius: 10px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);

  span {
    color: var(--text-muted);
    font-size: 10px;
  }

  strong {
    display: block;
    margin-top: 1px;
    font-size: 13px;
    line-height: 1.5;
  }
}

.section-card {
  .panel-header {
    margin-bottom: 6px;
  }
}

.record-list {
  display: grid;
  gap: 6px;
}

.record-item {
  padding: 8px 10px;
  border-radius: 10px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);

  p {
    margin: 3px 0 0;
    color: var(--text-secondary);
    line-height: 1.6;
    font-size: 13px;
  }
}

.record-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  strong {
    font-size: 14px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.record-meta {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
  flex-wrap: wrap;
}

.record-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;

  span {
    color: var(--text-secondary);
    font-size: 13px;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(148, 163, 184, 0.06);
    line-height: 1.6;
  }
}

.record-text {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;

  strong {
    color: var(--text-primary);
  }
}

.record-date {
  color: var(--text-muted);
  font-size: 12px;
}

.finance-item {
  padding: 10px;
}

.finance-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.finance-cell {
  text-align: center;

  span {
    display: block;
    color: var(--text-muted);
    font-size: 10px;
    margin-bottom: 1px;
  }

  strong {
    font-size: 14px;
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  border: 1px solid transparent;
  white-space: nowrap;

  &.success {
    color: var(--accent-green);
    background: rgba(61, 217, 165, 0.08);
    border-color: rgba(61, 217, 165, 0.12);
  }

  &.warn {
    color: var(--accent-gold);
    background: rgba(246, 198, 107, 0.08);
    border-color: rgba(246, 198, 107, 0.12);
  }

  &.danger {
    color: var(--accent-rose);
    background: rgba(255, 125, 144, 0.08);
    border-color: rgba(255, 125, 144, 0.12);
  }
}

.timeline {
  display: grid;
  gap: 6px;
}

.timeline-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: start;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--accent-cyan);
  box-shadow: 0 0 10px rgba(92, 225, 230, 0.4);
}

.timeline-content {
  padding: 8px 10px;
  border-radius: 10px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);

  p {
    margin: 3px 0 0;
    color: var(--text-secondary);
    line-height: 1.6;
    font-size: 12px;
  }
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;

  strong {
    font-size: 12px;
  }

  span {
    color: var(--text-muted);
    font-size: 10px;
    white-space: nowrap;
  }
}

.timeline-author {
  color: var(--text-muted) !important;
  font-size: 11px !important;
  margin-top: 2px !important;
}

.empty-state {
  display: grid;
  gap: 10px;
  justify-items: start;
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  background: rgba(91, 139, 255, 0.1);
  border: 1px solid rgba(91, 139, 255, 0.18);
  color: var(--text-primary);
  font-size: 13px;
}

@media (max-width: 1100px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detail-hero {
    flex-direction: column;
    gap: 10px;

    h2 {
      font-size: 18px;
    }
  }

  .hero-actions {
    width: 100%;

    button {
      flex: 1;
    }
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .kv-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .finance-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .timeline-head {
    flex-direction: column;
    gap: 2px;
  }

  .record-head {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .kv-grid {
    grid-template-columns: 1fr;
  }

  .finance-grid {
    grid-template-columns: 1fr 1fr;
  }

  .record-detail {
    flex-direction: column;
    gap: 3px;
  }
}
</style>
