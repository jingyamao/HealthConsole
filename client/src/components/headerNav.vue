<template>
  <nav class="nav-shell">
    <div class="nav-brand">
      <div class="brand-mark">
        <span></span>
      </div>
      <div>
        <p class="brand-overline">Health Console</p>
        <h2>智能医疗中枢</h2>
      </div>
    </div>

    <div class="nav-scroll-area">
      <div
        v-for="section in navSections"
        :key="section.title"
        class="nav-section"
      >
        <p class="section-title">{{ section.title }}</p>
        <router-link
          v-for="item in section.items"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isActive(item.path) }"
        >
          <div class="nav-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div class="nav-copy">
            <span class="nav-name">{{ item.label }}</span>
            <span class="nav-desc">{{ item.desc }}</span>
          </div>
        </router-link>
      </div>
    </div>

    <div class="nav-footer">
      <div class="footer-card">
        <div class="footer-header">
          <span class="status-pill success">系统在线</span>
          <span class="footer-dot"></span>
        </div>
        <h3>今日值守建议</h3>
        <p>优先关注首页风险预警与费用异常趋势，适合作为演示入口。</p>
      </div>
    </div>
  </nav>
</template>

<script setup>
import {
  House,
  User,
  Search,
  DataAnalysis,
  Histogram,
  Money,
  Document,
  QuestionFilled
} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navSections = [
  {
    title: '指挥中心',
    items: [
      { path: '/home', label: '首页总览', desc: '实时态势与重点预警', icon: House },
      { path: '/ai', label: 'AI 对话', desc: '医疗问答与分析草稿', icon: Search }
    ]
  },
  {
    title: '核心业务',
    items: [
      { path: '/patients', label: '患者管理', desc: '档案、诊断与随访', icon: User },
      { path: '/reports/patients', label: '患者报表', desc: '规模、结构与分层', icon: DataAnalysis },
      { path: '/reports/diagnosis', label: '诊疗统计', desc: '诊断构成与趋势', icon: Histogram },
      { path: '/reports/financial', label: '费用统计', desc: '医保与支付态势', icon: Money }
    ]
  },
  {
    title: '智能辅助',
    items: [
      { path: '/knowledge-base', label: '知识库管理', desc: '医学文献与诊疗指南', icon: Document },
      { path: '/help/guide', label: '帮助中心', desc: '操作说明与建设路线', icon: QuestionFilled }
    ]
  }
]

const isActive = (path) => {
  if (path === '/patients') {
    return route.path.startsWith('/patients')
  }
  return route.path === path
}
</script>

<style lang="less" scoped>
.nav-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
  color: var(--text-primary);
  overflow: hidden;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(142, 164, 188, 0.14);

  h2 {
    margin: 4px 0 0;
    font-size: 20px;
    line-height: 1.1;
  }
}

.brand-overline {
  margin: 0;
  color: var(--accent-cyan);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.brand-mark {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(91, 139, 255, 0.22), rgba(92, 225, 230, 0.12));
  border: 1px solid rgba(92, 225, 230, 0.18);
  box-shadow: inset 0 0 24px rgba(92, 225, 230, 0.08);
  flex-shrink: 0;

  span {
    position: absolute;
    inset: 10px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
    box-shadow: 0 0 18px rgba(92, 225, 230, 0.4);
  }
}

.nav-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  margin: 0;
  padding: 6px 8px 2px;
  color: var(--text-muted);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 18px;
  border: 1px solid transparent;
  color: var(--text-secondary);
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateX(3px);
    color: var(--text-primary);
    border-color: rgba(86, 182, 213, 0.14);
    background: linear-gradient(135deg, rgba(90, 141, 238, 0.08), rgba(86, 182, 213, 0.08));
    box-shadow: 0 6px 16px rgba(125, 150, 180, 0.1);
  }

  &.active {
    color: var(--text-primary);
    border-color: rgba(86, 182, 213, 0.16);
    background:
      radial-gradient(circle at left top, rgba(86, 182, 213, 0.12), transparent 48%),
      linear-gradient(135deg, rgba(90, 141, 238, 0.14), rgba(86, 182, 213, 0.08));
    box-shadow: 0 8px 20px rgba(125, 150, 180, 0.12);
  }
}

.nav-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #f5f9ff;
  border: 1px solid rgba(142, 164, 188, 0.14);
  color: var(--accent-cyan);
  font-size: 16px;
  flex-shrink: 0;
}

.nav-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.nav-name {
  font-size: 14px;
  font-weight: 600;
}

.nav-desc {
  color: var(--text-muted);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-footer {
  flex-shrink: 0;
  padding: 6px 8px 8px;
  border-top: 1px solid rgba(142, 164, 188, 0.12);
}

.footer-card {
  padding: 10px 12px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f8fbff, #f3f8ff);
  border: 1px solid rgba(142, 164, 188, 0.14);

  h3 {
    margin: 8px 0 2px;
    font-size: 14px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.6;
  }
}

.footer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 12px rgba(61, 217, 165, 0.65);
}

@media (max-width: 768px) {
  .nav-brand {
    padding: 8px 10px 8px;

    h2 {
      font-size: 18px;
    }
  }

  .nav-link {
    padding: 6px;
  }

  .nav-scroll-area {
    padding: 6px;
  }
}
</style>
