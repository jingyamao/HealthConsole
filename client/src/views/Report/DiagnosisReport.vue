<template>
  <div class="page-shell report-page">
    <section class="glass-panel report-hero">
      <span class="section-badge">Diagnosis Analytics</span>
      <h2>诊疗统计雷达</h2>
      <p>把主诊断占比、复诊活跃度和重点病种趋势做成更有冲击力的分析页骨架。</p>
    </section>

    <section class="stats-row">
      <article class="glass-panel stat-card">
        <span>诊断记录总数</span>
        <strong>{{ totalDiagnoses }}</strong>
      </article>
      <article class="glass-panel stat-card">
        <span>治疗方案数</span>
        <strong>{{ totalTreatments }}</strong>
      </article>
      <article class="glass-panel stat-card">
        <span>病程记录数</span>
        <strong>{{ totalProgressNotes }}</strong>
      </article>
    </section>

    <section class="diag-grid">
      <article class="glass-panel diag-card">
        <h3 class="panel-title">主诊断排名</h3>
        <div class="rank-list" v-if="ranking.length > 0">
          <div v-for="item in ranking" :key="item.name" class="rank-item">
            <b>{{ item.index }}</b>
            <span>{{ item.name }}</span>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
        <div class="empty-hint" v-else>暂无诊断数据</div>
      </article>

      <article class="glass-panel diag-card">
        <h3 class="panel-title">诊断类型分布</h3>
        <div class="type-list" v-if="typeKeys.length > 0">
          <div v-for="type in typeKeys" :key="type" class="type-item">
            <span>{{ type }}</span>
            <strong>{{ diagnosisTypeDistribution[type] }}</strong>
          </div>
        </div>
        <div class="empty-hint" v-else>暂无类型数据</div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'

const systemStore = useSystemStore()

onMounted(() => {
  systemStore.fetchDiagnosisReport()
})

const ranking = computed(() => {
  return systemStore.diagnosisReportData.diagnosisRanking || []
})

const diagnosisTypeDistribution = computed(() => {
  return systemStore.diagnosisReportData.diagnosisTypeDistribution || {}
})

const typeKeys = computed(() => Object.keys(diagnosisTypeDistribution.value))

const totalDiagnoses = computed(() => {
  return ranking.value.reduce((sum, item) => sum + (item.count || 0), 0)
})

const totalTreatments = computed(() => systemStore.diagnosisReportData.totalTreatments || 0)
const totalProgressNotes = computed(() => systemStore.diagnosisReportData.totalProgressNotes || 0)
</script>

<style lang="less" scoped>
.report-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-hero,
.diag-card,
.stat-card {
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  text-align: center;

  span {
    color: var(--text-secondary);
    font-size: 13px;
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 36px;
  }
}

.diag-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.rank-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.rank-item {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.1);

  b {
    color: var(--accent-cyan);
  }

  span {
    color: var(--text-secondary);
  }
}

.type-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.1);

  span {
    color: var(--text-secondary);
  }

  strong {
    color: var(--accent-cyan);
    font-size: 20px;
  }
}

.empty-hint {
  margin-top: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 24px 0;
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .diag-grid {
    grid-template-columns: 1fr;
  }
}
</style>
