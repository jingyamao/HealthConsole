<template>
  <div class="page-shell report-page">
    <section class="glass-panel report-hero">
      <span class="section-badge">Financial Insight</span>
      <h2>费用与支付态势</h2>
      <p>用强对比色和大数字模块突出医保、自费和预警支出，更适合管理端首页联动展示。</p>
    </section>

    <section class="finance-grid">
      <article class="glass-panel finance-card">
        <span>总费用规模</span>
        <strong>¥ {{ formatMoney(data.totalCost) }}</strong>
        <p>累计医疗费用总额</p>
      </article>
      <article class="glass-panel finance-card">
        <span>医保覆盖</span>
        <strong>{{ data.insurancePercent }}%</strong>
        <p>¥ {{ formatMoney(data.insuranceCoverage) }}</p>
      </article>
      <article class="glass-panel finance-card">
        <span>自费占比</span>
        <strong>{{ data.selfPercent }}%</strong>
        <p>¥ {{ formatMoney(data.selfPayment) }}</p>
      </article>
      <article class="glass-panel finance-card">
        <span>异常账单</span>
        <strong>{{ data.abnormalBills }}</strong>
        <p>费用超过 5 万的记录</p>
      </article>
    </section>

    <section class="detail-grid">
      <article class="glass-panel detail-card">
        <h3 class="panel-title">费用概览</h3>
        <div class="overview-list">
          <div class="overview-item">
            <span>记录总数</span>
            <strong>{{ data.totalRecords }}</strong>
          </div>
          <div class="overview-item">
            <span>人均费用</span>
            <strong>¥ {{ formatMoney(data.avgCost) }}</strong>
          </div>
        </div>
      </article>

      <article class="glass-panel detail-card">
        <h3 class="panel-title">支付状态分布</h3>
        <div class="payment-list" v-if="paymentKeys.length > 0">
          <div v-for="status in paymentKeys" :key="status" class="payment-item">
            <span class="status-label">{{ status }}</span>
            <span class="status-count">{{ paymentDistribution[status].count }} 条</span>
            <strong>¥ {{ formatMoney(paymentDistribution[status].totalCost) }}</strong>
          </div>
        </div>
        <div class="empty-hint" v-else>暂无支付数据</div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'

const systemStore = useSystemStore()

onMounted(() => {
  systemStore.fetchFinancialReport()
})

const data = computed(() => systemStore.financialReportData)

const paymentDistribution = computed(() => data.value.paymentDistribution || {})
const paymentKeys = computed(() => Object.keys(paymentDistribution.value))

const formatMoney = (num) => {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(2) + 'w'
  return num.toLocaleString()
}
</script>

<style lang="less" scoped>
.report-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-hero,
.finance-card,
.detail-card {
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

.finance-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.finance-card {
  span {
    color: var(--text-secondary);
    font-size: 13px;
  }

  strong {
    display: block;
    margin: 10px 0 6px;
    font-size: 34px;
  }

  p {
    margin: 0;
    color: var(--text-muted);
    line-height: 1.7;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.overview-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);

  span {
    color: var(--text-secondary);
  }

  strong {
    font-size: 18px;
  }
}

.payment-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.payment-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  background: #f9fbff;
  border: 1px solid rgba(148, 163, 184, 0.08);

  .status-label {
    color: var(--text-primary);
    font-weight: 500;
  }

  .status-count {
    color: var(--text-muted);
    font-size: 13px;
  }

  strong {
    text-align: right;
  }
}

.empty-hint {
  margin-top: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 24px 0;
}

@media (max-width: 1100px) {
  .finance-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .finance-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
