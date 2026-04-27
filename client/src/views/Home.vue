<template>
  <div class="page-shell home-page">
    <section class="hero-grid">
      <div class="hero-copy glass-panel">
        <span class="section-badge">Command Deck</span>
        <h2>医疗后台总览驾驶舱</h2>
        <p>
          将患者流转、诊疗质量、费用趋势和 AI 辅助能力压缩到一个首页，
          让系统从“功能堆叠”变成更适合展示和演示的指挥中心。
        </p>

        <div class="hero-actions">
          <button class="primary-btn" @click="goPatients">进入患者管理</button>
          <button class="ghost-btn" @click="goReports">查看预警详情</button>
        </div>

        <div class="hero-tags">
          <span class="status-pill success">实时监控</span>
          <span class="status-pill">AI 协同开启</span>
          <span class="status-pill warn">2 项重点关注</span>
        </div>
      </div>

      <div class="hero-visual glass-panel">
        <div class="visual-head">
          <div>
            <p class="visual-label">综合运行指数</p>
            <h3>91.8</h3>
          </div>
          <span class="trend-chip">较昨日 +6.4%</span>
        </div>

        <div class="radar-wrap">
          <div class="radar-ring ring-a"></div>
          <div class="radar-ring ring-b"></div>
          <div class="radar-ring ring-c"></div>
          <div class="radar-core">
            <span>Stable</span>
            <strong>24/7</strong>
          </div>
          <span
            v-for="point in orbitPoints"
            :key="point.name"
            class="orbit-node"
            :style="{ top: point.top, left: point.left }"
          >
            {{ point.name }}
          </span>
        </div>

        <div class="hero-foot">
          <div>
            <span class="foot-label">会诊响应</span>
            <strong>08 分 14 秒</strong>
          </div>
          <div>
            <span class="foot-label">AI 分析调用</span>
            <strong>128 次</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="metrics-grid">
      <article
        v-for="item in metricCards"
        :key="item.label"
        class="metric-card glass-panel"
      >
        <div class="metric-top">
          <span class="metric-label">{{ item.label }}</span>
          <span class="metric-trend" :class="item.trendClass">{{ item.delta }}</span>
        </div>
        <strong>{{ item.value }}</strong>
        <p>{{ item.desc }}</p>
        <div class="metric-progress">
          <span :style="{ width: item.progress }"></span>
        </div>
      </article>
    </section>

    <section class="analytics-grid">
      <article class="glass-panel chart-panel trend-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">七日患者流量与 AI 响应趋势</h3>
            <p class="panel-subtitle">将门诊接入、住院活跃和 AI 交互量放在一张图里展示</p>
          </div>
          <span class="status-pill success">数据同步中</span>
        </div>

        <div class="trend-chart">
          <div class="chart-legend">
            <span><i class="legend-dot cyan"></i>患者流量</span>
            <span><i class="legend-dot blue"></i>AI 交互</span>
          </div>

          <svg viewBox="0 0 700 280" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flowFill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stop-color="rgba(92, 225, 230, 0.36)" />
                <stop offset="100%" stop-color="rgba(92, 225, 230, 0.02)" />
              </linearGradient>
              <linearGradient id="aiFill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stop-color="rgba(91, 139, 255, 0.32)" />
                <stop offset="100%" stop-color="rgba(91, 139, 255, 0.03)" />
              </linearGradient>
            </defs>

            <g class="grid-lines">
              <line v-for="n in 5" :key="n" :x1="0" :x2="700" :y1="n * 46" :y2="n * 46" />
            </g>

            <path :d="patientAreaPath" fill="url(#flowFill)" />
            <path :d="aiAreaPath" fill="url(#aiFill)" />
            <path :d="patientLinePath" class="line-path patient" />
            <path :d="aiLinePath" class="line-path ai" />

            <circle
              v-for="point in patientPoints"
              :key="`patient-${point.label}`"
              :cx="point.x"
              :cy="point.y"
              r="4.5"
              class="point patient"
            />
            <circle
              v-for="point in aiPoints"
              :key="`ai-${point.label}`"
              :cx="point.x"
              :cy="point.y"
              r="4"
              class="point ai"
            />
          </svg>

          <div class="chart-labels">
            <span v-for="point in patientPoints" :key="point.label">{{ point.label }}</span>
          </div>
        </div>
      </article>

      <article class="glass-panel chart-panel donut-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">诊断结构占比</h3>
            <p class="panel-subtitle">主诊断在首页形成一眼能懂的高亮分布</p>
          </div>
          <span class="status-pill">Top 5</span>
        </div>

        <div class="donut-wrap">
          <div class="donut-chart" :style="{ background: donutGradient }">
            <div class="donut-center">
              <strong>428</strong>
              <span>本周诊断</span>
            </div>
          </div>

          <div class="donut-legend">
            <div
              v-for="item in diagnosisMix"
              :key="item.name"
              class="legend-item"
            >
              <span class="legend-swatch" :style="{ background: item.color }"></span>
              <div class="legend-meta">
                <strong>{{ item.name }}</strong>
                <span>{{ item.value }}%</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="operations-grid">
      <article class="glass-panel ward-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">科室负载热区</h3>
            <p class="panel-subtitle">用病区容量与预警状态快速体现繁忙程度</p>
          </div>
          <span class="status-pill warn">高峰时段</span>
        </div>

        <div class="ward-list">
          <div v-for="ward in wards" :key="ward.name" class="ward-item">
            <div class="ward-copy">
              <strong>{{ ward.name }}</strong>
              <span>{{ ward.load }} / {{ ward.capacity }} 床位</span>
            </div>
            <div class="ward-progress">
              <span :style="{ width: ward.percent + '%', background: ward.color }"></span>
            </div>
            <span class="ward-rate">{{ ward.percent }}%</span>
          </div>
        </div>
      </article>

      <article class="glass-panel heatmap-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">一周活跃热力矩阵</h3>
            <p class="panel-subtitle">按星期和业务域查看系统活跃度与数据写入强度</p>
          </div>
        </div>

        <div class="heatmap">
          <div class="heatmap-y">
            <span v-for="item in heatmapRows" :key="item">{{ item }}</span>
          </div>
          <div class="heatmap-grid">
            <template v-for="(row, rowIndex) in heatmapValues" :key="rowIndex">
              <span
                v-for="(cell, colIndex) in row"
                :key="`${rowIndex}-${colIndex}`"
                class="heat-cell"
                :style="{
                  background: `rgba(92, 225, 230, ${0.12 + cell * 0.14})`,
                  boxShadow: `0 0 ${4 + cell * 8}px rgba(91, 139, 255, ${0.08 + cell * 0.08})`
                }"
              ></span>
            </template>
          </div>
        </div>

        <div class="heatmap-x">
          <span v-for="item in heatmapCols" :key="item">{{ item }}</span>
        </div>
      </article>

      <article class="glass-panel alert-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">关键提醒与事件流</h3>
            <p class="panel-subtitle">更适合演示的动态卡片区</p>
          </div>
        </div>

        <div class="alert-list">
          <div
            v-for="alert in alerts"
            :key="alert.title"
            class="alert-item"
            :class="alert.level"
          >
            <div class="alert-dot"></div>
            <div class="alert-copy">
              <strong>{{ alert.title }}</strong>
              <p>{{ alert.desc }}</p>
            </div>
            <span>{{ alert.time }}</span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSystemStore } from '@/stores/system'

const router = useRouter()
const systemStore = useSystemStore()

onMounted(() => {
  systemStore.fetchDashboardMetrics()
  systemStore.fetchDashboardDetail()
})

const metricCards = computed(() => [
  {
    label: '在院患者',
    value: systemStore.dashboardMetrics.totalPatients.toString(),
    delta: '+12.8%',
    desc: '当前 demo 数据池已形成闭环视图',
    progress: '76%',
    trendClass: 'up'
  },
  {
    label: 'AI 分析完成率',
    value: `${systemStore.dashboardMetrics.aiCoverage}%`,
    delta: '+4.6%',
    desc: '重点病例已具备 AI 辅助链路',
    progress: `${systemStore.dashboardMetrics.aiCoverage}%`,
    trendClass: 'up'
  },
  {
    label: '高风险患者',
    value: systemStore.dashboardMetrics.highRisk.toString(),
    delta: '需重点关注',
    desc: '建议值班时优先查看详情页',
    progress: '58%',
    trendClass: 'good'
  },
  {
    label: '累计费用',
    value: `¥ ${(systemStore.dashboardMetrics.totalCost / 10000).toFixed(2)}w`,
    delta: '实时联动',
    desc: '用于财务报表与异常费用演示',
    progress: '68%',
    trendClass: 'warn'
  }
])

const orbitPoints = [
  { name: 'ICU', top: '18%', left: '62%' },
  { name: 'AI', top: '34%', left: '18%' },
  { name: 'RPT', top: '72%', left: '30%' },
  { name: 'EMR', top: '68%', left: '72%' }
]

const trendSeries = computed(() => systemStore.dashboardTrend)
const diagnosisMix = computed(() => systemStore.diagnosisDistribution)
const wards = computed(() => systemStore.departmentLoad)
const heatmapRows = computed(() => systemStore.activityHeatmap.rows)
const heatmapCols = computed(() => systemStore.activityHeatmap.cols)
const heatmapValues = computed(() => systemStore.activityHeatmap.values)
const alerts = computed(() => systemStore.warningEvents)

const goPatients = () => {
  router.push('/patients')
}

const goReports = () => {
  router.push('/reports/financial')
}

const buildPoints = (key) => {
  const data = trendSeries.value
  if (!data || data.length === 0) return []
  const width = 700
  const height = 280
  const paddingX = 30
  const max = Math.max(...data.map(item => item.patient), ...data.map(item => item.ai)) + 20
  const stepX = (width - paddingX * 2) / (data.length - 1)

  return data.map((item, index) => {
    const x = paddingX + stepX * index
    const y = height - 24 - (item[key] / max) * 210
    return { label: item.label, x, y }
  })
}

const pathFromPoints = (points) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

const areaFromPoints = (points) => {
  if (!points || points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${pathFromPoints(points)} L ${last.x} 256 L ${first.x} 256 Z`
}

const patientPoints = computed(() => buildPoints('patient'))
const aiPoints = computed(() => buildPoints('ai'))
const patientLinePath = computed(() => pathFromPoints(patientPoints.value))
const aiLinePath = computed(() => pathFromPoints(aiPoints.value))
const patientAreaPath = computed(() => areaFromPoints(patientPoints.value))
const aiAreaPath = computed(() => areaFromPoints(aiPoints.value))

const donutGradient = computed(() => {
  const data = diagnosisMix.value
  if (!data || data.length === 0) return 'conic-gradient(#ccc 0% 100%)'
  let offset = 0
  const parts = data.map((item) => {
    const start = offset
    offset += item.value
    return `${item.color} ${start}% ${offset}%`
  })
  return `conic-gradient(${parts.join(', ')})`
})
</script>

<style lang="less" scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-grid,
.analytics-grid,
.operations-grid {
  display: grid;
  gap: 16px;
}

.hero-grid {
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.9fr);
}

.hero-copy,
.hero-visual,
.metric-card,
.chart-panel,
.ward-panel,
.heatmap-panel,
.alert-panel {
  padding: 18px;
}

.hero-copy {
  h2 {
    margin: 12px 0 6px;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.06;
    letter-spacing: 0.02em;
  }

  p {
    max-width: 680px;
    margin: 0;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.8;
  }
}

.hero-actions,
.hero-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-actions {
  margin: 16px 0 12px;
}

.primary-btn,
.ghost-btn {
  min-height: 48px;
  padding: 0 12px;
  border-radius: 16px;
  border: 1px solid transparent;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.primary-btn {
  color: #ffffff;
  background: linear-gradient(135deg, var(--accent-cyan), #9ce7ff);
  box-shadow: 0 18px 36px rgba(92, 225, 230, 0.2);
}

.ghost-btn {
  color: var(--text-primary);
  background: rgba(91, 139, 255, 0.1);
  border-color: rgba(91, 139, 255, 0.16);
}

.primary-btn:hover,
.ghost-btn:hover {
  transform: translateY(-2px);
}

.hero-visual {
  position: relative;
  overflow: hidden;
}

.hero-visual::before {
  content: '';
  position: absolute;
  inset: -40% auto auto -20%;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(86, 182, 213, 0.14), transparent 60%);
}

.visual-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 6px 0 0;
    font-size: 44px;
    line-height: 1;
  }
}

.visual-label,
.foot-label {
  color: var(--text-muted);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.trend-chip {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(61, 217, 165, 0.12);
  border: 1px solid rgba(61, 217, 165, 0.16);
  color: var(--accent-green);
  font-size: 12px;
}

.radar-wrap {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 260px;
  margin: 10px 0 4px;
}

.radar-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(92, 225, 230, 0.14);
  animation: rotate 16s linear infinite;
}

.ring-a {
  width: 224px;
  height: 224px;
}

.ring-b {
  width: 168px;
  height: 168px;
  animation-direction: reverse;
}

.ring-c {
  width: 112px;
  height: 112px;
}

.radar-core {
  position: relative;
  z-index: 2;
  display: flex;
  width: 116px;
  height: 116px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(86, 182, 213, 0.18), #ffffff 70%);
  border: 1px solid rgba(86, 182, 213, 0.22);
  box-shadow: 0 16px 34px rgba(125, 150, 180, 0.18);

  span {
    color: var(--text-muted);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  strong {
    margin-top: 6px;
    font-size: 24px;
  }
}

.orbit-node {
  position: absolute;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-secondary);
  font-size: 12px;
}

.hero-foot {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  strong {
    display: block;
    margin-top: 4px;
    font-size: 20px;
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.metric-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.metric-trend {
  font-size: 12px;

  &.up,
  &.good {
    color: var(--accent-green);
  }

  &.warn {
    color: var(--accent-gold);
  }
}

.metric-card {
  strong {
    display: block;
    margin: 8px 0 4px;
    font-size: 34px;
    line-height: 1;
  }

  p {
    margin: 0 0 12px;
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.metric-progress {
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--accent-blue), var(--accent-cyan));
    box-shadow: 0 0 16px rgba(92, 225, 230, 0.24);
  }
}

.analytics-grid {
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.8fr);
}

.trend-chart {
  margin-top: 12px;
}

.chart-legend {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  border-radius: 50%;

  &.cyan {
    background: var(--accent-cyan);
  }

  &.blue {
    background: var(--accent-blue);
  }
}

.trend-chart svg {
  width: 100%;
  height: 280px;
}

.grid-lines line {
  stroke: rgba(148, 163, 184, 0.12);
  stroke-dasharray: 4 8;
}

.line-path {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;

  &.patient {
    stroke: var(--accent-cyan);
  }

  &.ai {
    stroke: var(--accent-blue);
  }
}

.point {
  stroke: #ffffff;
  stroke-width: 4;

  &.patient {
    fill: var(--accent-cyan);
  }

  &.ai {
    fill: var(--accent-blue);
  }
}

.chart-labels {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.donut-wrap {
  display: grid;
  place-items: center;
  gap: 16px;
  margin-top: 12px;
}

.donut-chart {
  position: relative;
  display: grid;
  place-items: center;
  width: 230px;
  height: 230px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 22px 50px rgba(2, 8, 18, 0.3);

  &::after {
    content: '';
    position: absolute;
    inset: 26px;
    border-radius: 50%;
    background: linear-gradient(180deg, #ffffff, #f7fbff);
    box-shadow: inset 0 0 0 1px rgba(142, 164, 188, 0.1);
  }
}

.donut-center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  strong {
    font-size: 40px;
    line-height: 1;
  }

  span {
    margin-top: 4px;
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.donut-legend {
  width: 100%;
  display: grid;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 14px currentColor;
}

.legend-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;

  strong {
    font-size: 14px;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.operations-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) minmax(320px, 0.88fr);
}

.ward-list,
.alert-list {
  display: grid;
  gap: 10px;
}

.ward-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(110px, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.ward-copy {
  strong {
    display: block;
    margin-bottom: 2px;
  }

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }
}

.ward-progress {
  height: 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
  }
}

.ward-rate {
  color: var(--text-secondary);
  font-size: 13px;
}

.heatmap {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 8px;
  align-items: stretch;
}

.heatmap-y,
.heatmap-x {
  display: grid;
  color: var(--text-muted);
  font-size: 12px;
}

.heatmap-y {
  grid-template-rows: repeat(5, 1fr);
  gap: 4px;
}

.heatmap-x {
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 8px;
  padding-left: 50px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.heat-cell {
  display: block;
  min-height: 52px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.alert-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: #f9fbff;

  span {
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
  }
}

.alert-dot {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 50%;
  background: var(--accent-blue);
}

.alert-copy {
  strong {
    display: block;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.alert-item.warn .alert-dot {
  background: var(--accent-gold);
  box-shadow: 0 0 14px rgba(246, 198, 107, 0.45);
}

.alert-item.info .alert-dot {
  background: var(--accent-cyan);
  box-shadow: 0 0 14px rgba(92, 225, 230, 0.45);
}

.alert-item.danger .alert-dot {
  background: var(--accent-rose);
  box-shadow: 0 0 14px rgba(255, 125, 144, 0.45);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1380px) {
  .operations-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .alert-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1200px) {
  .hero-grid,
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-copy,
  .hero-visual,
  .metric-card,
  .chart-panel,
  .ward-panel,
  .heatmap-panel,
  .alert-panel {
    padding: 14px;
  }

  .metrics-grid,
  .operations-grid {
    grid-template-columns: 1fr;
  }

  .hero-foot,
  .ward-item {
    grid-template-columns: 1fr;
  }

  .heatmap {
    grid-template-columns: 44px 1fr;
  }

  .heatmap-x {
    padding-left: 40px;
  }

  .donut-chart {
    width: 200px;
    height: 200px;
  }
}
</style>
