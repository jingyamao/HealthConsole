<template>
  <el-menu
    :default-active="activeIndex"
    class="header-nav-menu"
    text-color="#0f3b2e"
    active-text-color="#005a9c"
    background-color="#f7f9fc"
    hover-background-color="#e8f4fd"
    router
    >
    <!-- 首页 -->
    <el-menu-item index="/Home">
      <template #title>
        <el-icon><House /></el-icon>
        <span>首页</span>
      </template>
    </el-menu-item>

    <!-- AI系统 -->
    <el-menu-item index="/ai">
      <template #title>
        <el-icon><Search /></el-icon>
        <span>AI聊天</span>
      </template>
    </el-menu-item>
    
    <!-- 患者管理 -->
    <el-sub-menu index="1">
      <template #title>
        <el-icon><User /></el-icon>
        <span>患者管理</span>
      </template>
      <el-menu-item index="/patients">
        <template #title>
          <el-icon><List /></el-icon>
          <span>患者列表</span>
        </template>
      </el-menu-item>
      <!-- <el-menu-item index="/patients/add">
        <template #title>
          <el-icon><Plus /></el-icon>
          <span>患者管理</span>
        </template>
      </el-menu-item>
      <el-menu-item index="/patients/import">
        <template #title>
          <el-icon><Download /></el-icon>
          <span>患者导入</span>
        </template>
      </el-menu-item>
      <el-menu-item index="/patients/export">
        <template #title>
          <el-icon><Upload /></el-icon>
          <span>患者导出</span>
        </template>
      </el-menu-item> -->
    </el-sub-menu>

    <!-- 报表统计 -->
    <el-sub-menu index="3">
      <template #title>
        <el-icon><PieChart /></el-icon>
        <span>报表统计</span>
      </template>
      <el-menu-item index="/reports/patients">
        <template #title>
          <el-icon><DataAnalysis /></el-icon>
          <span>患者报表</span>
        </template>
      </el-menu-item>
      <el-menu-item index="/reports/diagnosis">
        <template #title>
          <el-icon><Histogram /></el-icon>
          <span>诊疗统计</span>
        </template>
      </el-menu-item>
      <el-menu-item index="/reports/financial">
        <template #title>
          <el-icon><Money /></el-icon>
          <span>费用统计</span>
        </template>
      </el-menu-item>
    </el-sub-menu>

    <!-- 帮助中心 -->
    <el-menu-item index="/help/guide">
      <template #title>
        <el-icon><QuestionFilled /></el-icon>
        <span>帮助中心</span>
      </template>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import {
  House,
  User,
  List,
  Search,
  PieChart,
  DataAnalysis,
  Histogram,
  Money,
  QuestionFilled
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 根据当前路由计算激活的菜单项
const activeIndex = computed(() => {
  return route.path
})
</script>

<style lang="less" scoped>
.header-nav-menu {
  width: 100%;
  height: 100%;
  border: none;

  // 修改Element Plus默认样式
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    transition: all 0.2s ease;
    font-weight: 500;
    border-radius: 4px;

    &:hover {
      background-color: #e8f4fd !important;
      color: #0f3b2e !important;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 90, 156, 0.15);
    }
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(135deg, #006b7d 0%, #006b7d 100%) !important;
    color: #ffffff !important;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 90, 156, 0.3);
    border: none !important;

    &:hover {
      background: linear-gradient(135deg, #006b7d 0%, #006b7d 100%) !important;
      transform: translateY(-1px);
    }
  }

  :deep(.el-sub-menu__title.is-active) {
    background: linear-gradient(135deg, #006b7d 0%, #006b7d 100%) !important;
    color: #ffffff !important;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 90, 156, 0.3);
    border: none !important;
  }

  :deep(.el-sub-menu .el-menu-item) {
    background-color: #f7f9fc !important;
    color: #0f3b2e !important;
    border-bottom: 1px solid rgba(0, 90, 156, 0.05) !important;
    border-radius: 3px;

    &:hover {
      background-color: #e8f4fd !important;
      color: #006b7d !important;
    }

    &.is-active {
      background: linear-gradient(135deg, #006b7d 0%, #006b7d 100%) !important;
      color: #ffffff !important;
    }
  }

  :deep(.el-sub-menu__icon-arrow) {
    color: #006b7d !important;
    transition: transform 0.3s ease;
  }

  :deep(.el-sub-menu:hover .el-sub-menu__icon-arrow) {
    transform: rotate(180deg);
  }
}
</style>