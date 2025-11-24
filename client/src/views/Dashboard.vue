<template>
  <div class="dashboard-container">
    <el-container>
      <el-header>
        <div class="header-left">
          <el-button @click="toggleSidebar" icon="el-icon-menu" plain></el-button>
          <h1>医疗后台管理系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar size="small" icon="el-icon-user"></el-avatar>
              {{ username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-container>
        <el-aside :width="sidebarWidth" :class="{ 'collapsed': isCollapse }">
          <el-menu
            :collapse="isCollapse"
            :default-active="activeMenu"
            class="sidebar-menu"
            router
          >
            <el-menu-item index="/dashboard">
              <el-icon><HomeFilled /></el-icon>
              <template #title>首页</template>
            </el-menu-item>
            <el-sub-menu index="1">
              <template #title>
                <el-icon><User /></el-icon>
                <template #title>用户管理</template>
              </template>
              <el-menu-item index="/users">用户列表</el-menu-item>
              <el-menu-item index="/roles">角色管理</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="2">
              <template #title>
                <el-icon><Document /></el-icon>
                <template #title>数据管理</template>
              </template>
              <el-menu-item index="/patients">患者管理</el-menu-item>
              <el-menu-item index="/records">病例管理</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>
        <el-main>
          <div class="dashboard-content">
            <h2>欢迎使用医疗后台管理系统</h2>
            <el-row :gutter="20">
              <el-col :span="6">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-number">1,234</div>
                    <div class="stat-label">总用户数</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-number">567</div>
                    <div class="stat-label">今日访问</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-number">34</div>
                    <div class="stat-label">待处理任务</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card class="stat-card">
                  <div class="stat-content">
                    <div class="stat-number">98%</div>
                    <div class="stat-label">系统正常</div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { useSystemStore } from '../stores/system'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { HomeFilled, User, Document } from '@element-plus/icons-vue'

export default {
  name: 'Dashboard',
  components: {
    HomeFilled,
    User,
    Document
  },
  data() {
    return {
      activeMenu: '/dashboard'
    }
  },
  computed: {
    isCollapse() {
      const systemStore = useSystemStore()
      return systemStore.isSidebarCollapse
    },
    sidebarWidth() {
      return this.isCollapse ? '64px' : '240px'
    },
    username() {
      const userStore = useUserStore()
      return userStore.username || '管理员'
    }
  },
  mounted() {
    const userStore = useUserStore()
    userStore.fetchUserInfo()
  },
  methods: {
    toggleSidebar() {
      const systemStore = useSystemStore()
      systemStore.toggleSidebar()
    },
    async handleLogout() {
      const userStore = useUserStore()
      try {
        await userStore.logout()
        ElMessage.success('退出成功')
        this.$router.push('/login')
      } catch (error) {
        ElMessage.error('退出失败')
      }
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.el-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.sidebar-menu {
  height: 100%;
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
}

.dashboard-content {
  padding: 20px;
}

.dashboard-content h2 {
  margin-bottom: 20px;
  color: #303133;
}

.stat-card {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}
</style>