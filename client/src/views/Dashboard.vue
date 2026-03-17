<template>
  <div class="dashboard-container">
    <div class="header-top">
      <div class="logo"></div>
      <div class="title">Health Console</div>
      <div class="menu-toggle" @click="toggleMenu">
        <el-icon><Menu /></el-icon>
      </div>
      <div class="user-info">
        <el-dropdown @command="handleCommand">
          <div class="user-avatar-wrapper">
            <el-avatar :size="36" :icon="UserFilled" class="user-avatar" />
            <span class="user-name">{{ userInfo.userName || '用户' }}</span>
            <el-icon class="arrow-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="header-content">
      <div class="header-nav" :class="{ 'collapsed': isMenuCollapsed }">
        <HeaderNav />
      </div>
      <div class="content" :class="{ 'full-width': isMenuCollapsed }">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, SwitchButton, ArrowDown, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import HeaderNav from '@/components/headerNav.vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const router = useRouter()
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const isMenuCollapsed = ref(false)

const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    handleLogout()
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.userLogout()
    // 清除本地存储的所有数据
    localStorage.clear()
    ElMessage.success('退出登录成功')
    router.push('/login')
  } catch (error) {
    // 即使API调用失败，也要清除本地数据
    localStorage.clear()
    ElMessage.warning('已退出登录')
    router.push('/login')
  }
}

const handleResize = () => {
  if (window.innerWidth < 768) {
    isMenuCollapsed.value = true
  } else {
    isMenuCollapsed.value = false
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="less" scoped>
.dashboard-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  .header-top {
    height: 60px;
    background-color: #fff;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e8e8e8;
    position: relative;
    box-sizing: border-box;
    .logo {
      width: 200px;
      height: 100%;
      background-image: url('@/assets/logo.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .title {
      flex: 1;
      color: #006b7d;
      font-size: 2.2rem;
      margin-bottom: 10px;
      letter-spacing: 1px;
      font-weight: 600;
      animation: slideUp 1s ease-out;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .menu-toggle {
      display: none;
      cursor: pointer;
      padding: 10px;
      margin-right: 10px;
      color: #006b7d;
      font-size: 24px;
      transition: all 0.3s ease;
      
      &:hover {
        color: #005a9c;
        transform: scale(1.1);
      }
    }
    .user-info {
      display: flex;
      align-items: center;
      margin-right: 20px;
      
      .user-avatar-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        background-color: rgba(0, 107, 125, 0.05);
        
        &:hover {
          background-color: rgba(0, 107, 125, 0.1);
          transform: translateY(-1px);
        }
        
        .user-avatar {
          background: linear-gradient(135deg, #006b7d 0%, #008ba3 100%);
          box-shadow: 0 2px 8px rgba(0, 107, 125, 0.2);
        }
        
        .user-name {
          color: #0f3b2e;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        
        .arrow-icon {
          color: #006b7d;
          font-size: 14px;
          transition: transform 0.3s ease;
        }
      }
      
      &:hover .arrow-icon {
        transform: rotate(180deg);
      }
    }
  }
  .header-content {
    flex: 1;
    display: flex;
    flex-direction: row;
    .header-nav {
      width: 200px;
      height: calc(100vh - 60px);
      background-color: #f7f9fc;
      border-right: 1px solid #e8e8e8;
      transition: all 0.3s ease;
      
      &.collapsed {
        width: 0;
        overflow: hidden;
      }
    }
    .content {
      flex: 1;
      padding: 10px;
      background-color: #f5f7fa;
      transition: all 0.3s ease;
      height: calc(100vh - 60px);
      box-sizing: border-box;
      
      &.full-width {
        width: 100%;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-container {
    .header-top {
      .logo {
        width: 120px;
      }
      .title {
        font-size: 1.5rem;
      }
      .menu-toggle {
        display: block;
      }
      .user-info {
        margin-right: 10px;
        
        .user-avatar-wrapper {
          padding: 4px 8px;
          gap: 6px;
          
          .user-name {
            display: none;
          }
          
          .user-avatar {
            :deep(svg) {
              width: 32px;
              height: 32px;
            }
          }
        }
      }
    }
    .header-content {
      .header-nav {
        width: 160px;
        position: fixed;
        top: 60px;
        left: 0;
        z-index: 1000;
        height: calc(100vh - 60px);
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
      }
      .content {
        padding: 15px;
      }
    }
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    .header-top {
      .logo {
        width: 100px;
      }
      .title {
        font-size: 1.2rem;
      }
      .user-info {
        .user-avatar-wrapper {
          padding: 4px 6px;
          
          .user-avatar {
            :deep(svg) {
              width: 28px;
              height: 28px;
            }
          }
        }
      }
    }
    .header-content {
      .content {
        padding: 10px;
      }
    }
  }
}
</style>