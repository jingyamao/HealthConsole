import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getPatientSummary } from '@/api/patient'
import { getDashboardOverview, getDashboardDetail } from '@/api/dashboard'
import { getPatientReport, getDiagnosisReport, getFinancialReport } from '@/api/report'

export const useSystemStore = defineStore('system', () => {
  const apiMetrics = ref(null)
  const apiDashboard = ref(null)
  const apiDashboardDetail = ref(null)
  const apiPatientReport = ref(null)
  const apiDiagnosisReport = ref(null)
  const apiFinancialReport = ref(null)

  const dashboardMetrics = computed(() => {
    if (apiDashboard.value) {
      return {
        totalPatients: apiDashboard.value.totalPatients,
        aiCoverage: apiDashboard.value.aiCoverage,
        highRisk: apiDashboard.value.highRisk,
        totalCost: apiDashboard.value.totalCost,
        todayNewPatients: apiDashboard.value.todayNewPatients,
        genderDistribution: apiDashboard.value.genderDistribution,
        ageGroups: apiDashboard.value.ageGroups,
        diagnosisDistribution: apiDashboard.value.diagnosisDistribution,
        paymentDistribution: apiDashboard.value.paymentDistribution,
        recentPatients: apiDashboard.value.recentPatients
      }
    }
    if (apiMetrics.value) {
      return {
        totalPatients: apiMetrics.value.totalPatients,
        aiCoverage: apiMetrics.value.aiCoverage,
        highRisk: apiMetrics.value.highRisk,
        totalCost: apiMetrics.value.totalCost
      }
    }
    return {
      totalPatients: 0,
      aiCoverage: 0,
      highRisk: 0,
      totalCost: 0
    }
  })

  // 仪表盘详细数据
  const dashboardTrend = computed(() => apiDashboardDetail.value?.dashboardTrend || [])
  const diagnosisDistribution = computed(() => apiDashboardDetail.value?.diagnosisDistribution || [])
  const departmentLoad = computed(() => apiDashboardDetail.value?.departmentLoad || [])
  const activityHeatmap = computed(() => apiDashboardDetail.value?.activityHeatmap || { rows: [], cols: [], values: [] })
  const warningEvents = computed(() => apiDashboardDetail.value?.warningEvents || [])
  const topAlerts = computed(() => warningEvents.value)

  // 患者报表数据
  const patientReportData = computed(() => {
    if (apiPatientReport.value) {
      return apiPatientReport.value
    }
    return {
      totalPatients: 0,
      aiCoverage: 0,
      ageGroups: [],
      genderDistribution: {}
    }
  })

  // 诊疗报表数据
  const diagnosisReportData = computed(() => {
    if (apiDiagnosisReport.value) {
      return apiDiagnosisReport.value
    }
    return {
      diagnosisRanking: [],
      diagnosisTypeDistribution: {},
      totalTreatments: 0,
      totalProgressNotes: 0
    }
  })

  // 费用报表数据
  const financialReportData = computed(() => {
    if (apiFinancialReport.value) {
      return apiFinancialReport.value
    }
    return {
      totalCost: 0,
      insuranceCoverage: 0,
      selfPayment: 0,
      insurancePercent: 0,
      selfPercent: 0,
      avgCost: 0,
      totalRecords: 0,
      abnormalBills: 0,
      paymentDistribution: {}
    }
  })

  async function fetchDashboardMetrics() {
    try {
      const res = await getDashboardOverview()
      if (res?.success) {
        apiDashboard.value = res.data
        return
      }
    } catch (error) {
      console.warn('获取仪表盘数据失败，尝试备用接口:', error)
    }
    try {
      const res = await getPatientSummary()
      if (res?.success) {
        apiMetrics.value = res.data
      }
    } catch (error) {
      console.warn('获取患者统计失败:', error)
    }
  }

  async function fetchDashboardDetail() {
    try {
      const res = await getDashboardDetail()
      if (res?.success) {
        apiDashboardDetail.value = res.data
      }
    } catch (error) {
      console.warn('获取仪表盘详细数据失败:', error)
    }
  }

  async function fetchPatientReport() {
    try {
      const res = await getPatientReport()
      if (res?.success) {
        apiPatientReport.value = res.data
      }
    } catch (error) {
      console.warn('获取患者报表失败:', error)
    }
  }

  async function fetchDiagnosisReport() {
    try {
      const res = await getDiagnosisReport()
      if (res?.success) {
        apiDiagnosisReport.value = res.data
      }
    } catch (error) {
      console.warn('获取诊疗报表失败:', error)
    }
  }

  async function fetchFinancialReport() {
    try {
      const res = await getFinancialReport()
      if (res?.success) {
        apiFinancialReport.value = res.data
      }
    } catch (error) {
      console.warn('获取费用报表失败:', error)
    }
  }

  return {
    dashboardTrend,
    diagnosisDistribution,
    departmentLoad,
    activityHeatmap,
    warningEvents,
    dashboardMetrics,
    topAlerts,
    patientReportData,
    diagnosisReportData,
    financialReportData,
    fetchDashboardMetrics,
    fetchDashboardDetail,
    fetchPatientReport,
    fetchDiagnosisReport,
    fetchFinancialReport
  }
})
