<template>
  <div class="page-shell report-page">
    <section class="glass-panel report-hero">
      <span class="section-badge">Patient Report</span>
      <h2>患者结构分析</h2>
      <p>将患者规模、年龄层、活跃状态和 AI 覆盖率组合成更适合毕业设计展示的可视化模块。</p>
    </section>

    <section class="report-grid">
      <article class="glass-panel big-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">年龄段分层</h3>
            <p class="panel-subtitle">不同年龄层患者的总体占比</p>
          </div>
        </div>
        <div class="bar-list">
          <div v-for="item in ageGroups" :key="item.label" class="bar-item">
            <span>{{ item.label }}</span>
            <div class="bar-track"><i :style="{ width: item.value + '%', background: item.color }"></i></div>
            <strong>{{ item.value }}%</strong>
          </div>
        </div>
      </article>

      <article class="glass-panel side-card">
        <h3 class="panel-title">AI 覆盖率</h3>
        <div class="gauge" :style="{ background: gaugeBackground }">{{ aiCoverage }}%</div>
        <p>重点慢病患者已完成首轮 AI 分析</p>
      </article>
    </section>

    <!-- 性别分布 -->
    <section class="glass-panel gender-card">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">性别分布</h3>
          <p class="panel-subtitle">患者性别统计</p>
        </div>
      </div>
      <div class="gender-grid">
        <div class="gender-item" v-for="(count, gender) in genderDistribution" :key="gender">
          <span>{{ gender }}</span>
          <strong>{{ count }}</strong>
          <span class="gender-percent">{{ totalPatients > 0 ? Math.round(count / totalPatients * 100) : 0 }}%</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'

const systemStore = useSystemStore()

onMounted(() => {
  systemStore.fetchPatientReport()
})

const totalPatients = computed(() => systemStore.patientReportData.totalPatients || 0)
const aiCoverage = computed(() => systemStore.patientReportData.aiCoverage || 0)

const ageGroups = computed(() => {
  const groups = systemStore.patientReportData.ageGroups || []
  const colors = [
    'linear-gradient(90deg, #5ce1e6, #5b8bff)',
    'linear-gradient(90deg, #5b8bff, #9f7aea)',
    'linear-gradient(90deg, #3dd9a5, #5ce1e6)',
    'linear-gradient(90deg, #f6c66b, #ff9d66)'
  ]
  return groups.map((item, i) => ({
    ...item,
    color: item.color || colors[i] || colors[0]
  }))
})

const genderDistribution = computed(() => {
  return systemStore.patientReportData.genderDistribution || { '男': 0, '女': 0 }
})

const gaugeBackground = computed(() =>
  `conic-gradient(#5ce1e6 0 ${aiCoverage.value}%, rgba(148, 163, 184, 0.12) ${aiCoverage.value}% 100%)`
)
</script>

<style lang="less" scoped>
.report-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-hero,
.big-card,
.side-card,
.gender-card {
  padding: 18px;
}

.report-hero {
  h2 {
    margin: 12px 0 4px;
    font-size: 32px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
  }
}

.report-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
}

.bar-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.bar-item {
  display: grid;
  grid-template-columns: 100px 1fr 56px;
  gap: 10px;
  align-items: center;

  span {
    color: var(--text-secondary);
  }

  strong {
    text-align: right;
  }
}

.bar-track {
  height: 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.08);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
  }
}

.side-card {
  display: grid;
  place-items: center;
  text-align: center;

  p {
    max-width: 240px;
    margin: 8px 0 0;
    color: var(--text-secondary);
  }
}

.gauge {
  display: grid;
  place-items: center;
  width: 180px;
  height: 180px;
  margin-top: 12px;
  border-radius: 50%;
  font-size: 38px;
  font-weight: 700;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 18px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: inset 0 0 0 1px rgba(142, 164, 188, 0.1);
  }

  &::before {
    content: 'AI';
    position: absolute;
    z-index: 1;
    top: 44px;
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: 0.14em;
  }
}

.gender-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.gender-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);

  span {
    color: var(--text-secondary);
    font-size: 14px;
  }

  strong {
    font-size: 32px;
  }

  .gender-percent {
    color: var(--text-muted);
    font-size: 13px;
  }
}

@media (max-width: 900px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
}
</style>
