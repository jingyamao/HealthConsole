import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getPatientList, getPatientSummary } from '@/api/patient'

export const usePatientStore = defineStore('patient', () => {
  const keyword = ref('')
  const currentFilter = ref('全部患者')
  const apiPatients = ref([])
  const apiSummary = ref(null)
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalRecords = ref(0)
  const totalPages = ref(1)

  const filters = [
    '全部患者',
    '高风险',
    '中风险',
    '已分析',
    '待复核',
    '部分支付'
  ]

  // 解析 AI 分析结果
  const getAiRiskLevel = (p) => {
    if (!p.aiNotes) return null
    if (typeof p.aiNotes === 'object' && p.aiNotes.analysis?.riskLevel) return p.aiNotes.analysis.riskLevel
    if (typeof p.aiNotes === 'object' && p.aiNotes.riskLevel) return p.aiNotes.riskLevel
    return null
  }

  const getAiStatus = (p) => {
    if (!p.aiNotes) return '待分析'
    const risk = getAiRiskLevel(p)
    if (risk === 'high') return '高风险'
    if (risk === 'moderate') return '已分析'
    return '已分析'
  }

  const riskLevelLabel = { high: '高风险', moderate: '中风险', low: '低风险' }

  // 将后端数据映射为前端展示格式
  const mapPatient = (p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    age: p.age || 0,
    phone: p.phone || '',
    idCard: p.idCard || '',
    address: p.address || '',
    insuranceType: p.insurance || '未知',
    ward: '待分配',
    diagnosis: p.diagnoses?.[0]?.diagnosisName || '待诊断',
    riskLevel: riskLevelLabel[getAiRiskLevel(p)] || (p.aiNotes ? '已分析' : '待分析'),
    aiStatus: getAiStatus(p),
    paymentStatus: p.financialInfos?.[0]?.paymentStatus || '未支付',
    totalCost: p.financialInfos?.[0]?.totalCost || 0,
    selfPayment: 0,
    bloodPressure: '--',
    bloodSugar: '--',
    heartRate: '--',
    alertScore: 0,
    admissionDays: 0,
    lastVisit: p.createdAt ? new Date(p.createdAt).toLocaleDateString('zh-CN') : '--',
    nextFollowUp: '--',
    tags: [],
    summary: '',
    progress: []
  })

  const patients = computed(() => {
    return apiPatients.value.map(mapPatient)
  })

  const summary = computed(() => {
    if (apiSummary.value) {
      return [
        { label: '患者总量', value: apiSummary.value.totalPatients.toString(), desc: '来自数据库' },
        { label: 'AI 覆盖', value: `${apiSummary.value.aiCoverage}%`, desc: '已完成 AI 分析的患者比例' },
        { label: '高风险', value: apiSummary.value.highRisk.toString(), desc: '需要持续关注的患者' },
        { label: '总费用', value: `¥ ${(apiSummary.value.totalCost || 0).toLocaleString()}`, desc: '累计医疗费用' }
      ]
    }
    return [
      { label: '患者总量', value: '0', desc: '暂无数据' },
      { label: 'AI 覆盖', value: '0%', desc: '暂无数据' },
      { label: '高风险', value: '0', desc: '暂无数据' },
      { label: '总费用', value: '¥ 0', desc: '暂无数据' }
    ]
  })

  const setKeyword = (value) => {
    keyword.value = value
    currentPage.value = 1
    fetchPatients()
  }

  const setFilter = (value) => {
    currentFilter.value = value
    currentPage.value = 1
    fetchPatients()
  }

  const setPage = (page) => {
    currentPage.value = page
    fetchPatients()
  }

  const setPageSize = (size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchPatients()
  }

  // 从 API 获取患者列表
  async function fetchPatients(params = {}) {
    loading.value = true
    try {
      const res = await getPatientList({
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: keyword.value,
        ...params
      })
      if (res?.success) {
        apiPatients.value = res.data.patients || []
        if (res.data.pagination) {
          totalRecords.value = res.data.pagination.total
          totalPages.value = res.data.pagination.totalPages
        }
      }
    } catch (error) {
      console.warn('获取患者列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 从 API 获取统计数据
  async function fetchSummary() {
    try {
      const res = await getPatientSummary()
      if (res?.success) {
        apiSummary.value = res.data
      }
    } catch (error) {
      console.warn('获取患者统计失败:', error)
    }
  }

  return {
    keyword,
    currentFilter,
    filters,
    patients,
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    summary,
    loading,
    setKeyword,
    setFilter,
    setPage,
    setPageSize,
    fetchPatients,
    fetchSummary
  }
})
