<template>
  <div class="page-shell help-page">
    <section class="glass-panel help-hero">
      <span class="section-badge">Guide Center</span>
      <h2>系统使用与建设建议</h2>
      <p>这里既可以做最终的帮助中心，也可以作为毕业设计答辩时的“系统说明”展示区。</p>
    </section>

    <section class="help-grid">
      <article class="glass-panel help-card">
        <h3 class="panel-title">推荐演示顺序</h3>
        <ol class="steps">
          <li>登录进入首页驾驶舱，展示可视化总览。</li>
          <li>切换到患者管理，说明档案与 AI 分析联动。</li>
          <li>进入报表页，展示诊断与费用统计。</li>
          <li>最后打开 AI 对话，说明智能辅助能力。</li>
        </ol>
      </article>

      <article class="glass-panel help-card">
        <h3 class="panel-title">下一步开发建议</h3>
        <div class="tips">
          <span>优先补齐患者列表与详情接口</span>
          <span>把首页指标改为真实统计查询</span>
          <span>将 AI 分析写回患者档案</span>
        </div>
      </article>
    </section>
  </div>
</template>

<style lang="less" scoped>
.help-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.help-hero,
.help-card {
  padding: 18px;
}

.help-hero {
  h2 {
    margin: 12px 0 4px;
    font-size: 32px;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
  }
}

.help-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.steps {
  margin: 12px 0 0;
  padding-left: 14px;
  color: var(--text-secondary);

  li + li {
    margin-top: 8px;
  }
}

.tips {
  display: grid;
  gap: 8px;
  margin-top: 12px;

  span {
    min-height: 54px;
    display: inline-flex;
    align-items: center;
    padding: 0 12px;
    border-radius: 16px;
    background: #f8fbff;
    border: 1px solid rgba(148, 163, 184, 0.1);
    color: var(--text-secondary);
  }
}

@media (max-width: 900px) {
  .help-grid {
    grid-template-columns: 1fr;
  }
}
</style>
