<template>
  <div class="dashboard-container">
    <div class="header-top">
      <div class="logo"></div>
      <div class="title">Health Console</div>
      <div class="menu-toggle" @click="toggleMenu">
        <el-icon><Menu /></el-icon>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { Menu } from '@element-plus/icons-vue'
import HeaderNav from '@/components/headerNav.vue'

const isMenuCollapsed = ref(false)

const toggleMenu = () => {
  isMenuCollapsed.value = !isMenuCollapsed.value
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
      padding: 20px;
      background-color: #f5f7fa;
      transition: all 0.3s ease;
      
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
    }
    .header-content {
      
      .content {
        padding: 10px;
      }
    }
  }
}
</style>