<template>
  <div class="dashboard-container">
    <div class="dashboard-glow glow-left"></div>
    <div class="dashboard-glow glow-right"></div>

    <header class="header-top">
      <div class="brand-zone">
        <div class="logo-mark">
          <span></span>
        </div>
        <div class="brand-copy">
          <p class="eyebrow">Medical Intelligence Suite</p>
          <h1>Health Console</h1>
        </div>
      </div>

      <div class="header-center">
        <div class="view-chip">
          <span class="chip-label">当前视图</span>
          <strong>{{ currentTitle }}</strong>
        </div>
        <div class="time-chip">
          <el-icon><Clock /></el-icon>
          <span>{{ currentTime }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="menu-toggle" @click="toggleMenu">
          <el-icon><Menu /></el-icon>
        </button>

        <div class="notification-chip">
          <span class="pulse"></span>
          <span>系统状态正常</span>
        </div>

        <el-dropdown @command="handleCommand">
          <div class="user-avatar-wrapper">
            <div class="user-meta">
              <span class="user-role">值班账号</span>
              <span class="user-name">{{ userInfo.userName || '用户' }}</span>
            </div>
            <el-avatar :size="40" :icon="UserFilled" class="user-avatar" />
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
    </header>

    <div class="dashboard-main">
      <!-- 移动端遮罩层 -->
      <div
        class="sidebar-overlay"
        :class="{ visible: showMobileOverlay }"
        @click="closeMobileSidebar"
      ></div>

      <aside class="side-panel" :class="{ collapsed: isMenuCollapsed, 'mobile-open': showMobileOverlay }">
        <HeaderNav />
      </aside>

      <main class="content-panel">
        <router-view />
      </main>
    </div>

<!-- TODO: 待后续优化后再启用
    <FloatingAIChat />
-->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, SwitchButton, ArrowDown, UserFilled, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import HeaderNav from '@/components/headerNav.vue'
// TODO: 待后续优化后再启用
// import FloatingAIChat from '@/components/FloatingAIChat.vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const isMenuCollapsed = ref(false)
const isMobile = ref(false)
const showMobileOverlay = ref(false)
const currentTime = ref('')
let clockTimer = null

const currentTitle = computed(() => route.meta.title || '系统总览')

const formatNow = () => {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  })
  currentTime.value = formatter.format(new Date())
}

const toggleMenu = () => {
  if (isMobile.value) {
    showMobileOverlay.value = !showMobileOverlay.value
  } else {
    isMenuCollapsed.value = !isMenuCollapsed.value
  }
}

const closeMobileSidebar = () => {
  showMobileOverlay.value = false
}

const handleCommand = (command) => {
  if (command === 'logout') {
    handleLogout()
  }
}

const handleLogout = async () => {
  try {
    await userStore.userLogout()
    localStorage.clear()
    ElMessage.success('退出登录成功')
    router.push('/login')
  } catch (error) {
    localStorage.clear()
    ElMessage.warning('已退出登录')
    router.push('/login')
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 1080
  if (!isMobile.value) {
    showMobileOverlay.value = false
  }
}

onMounted(() => {
  handleResize()
  formatNow()
  clockTimer = window.setInterval(formatNow, 60000)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (clockTimer) {
    window.clearInterval(clockTimer)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="less" scoped>
.dashboard-container {
  position: relative;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background:
    radial-gradient(circle at top left, rgba(86, 182, 213, 0.1), transparent 28%),
    radial-gradient(circle at right center, rgba(90, 141, 238, 0.12), transparent 24%),
    linear-gradient(180deg, #f7fbff 0%, #f3f8fd 48%, #f7fbff 100%);
  overflow: hidden;
}

.dashboard-glow {
  position: absolute;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.34;
  pointer-events: none;
}

.glow-left {
  top: -140px;
  left: -120px;
  background: rgba(86, 182, 213, 0.22);
}

.glow-right {
  right: -120px;
  bottom: 60px;
  background: rgba(90, 141, 238, 0.18);
}

.header-top {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(240px, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(142, 164, 188, 0.16);
  border-radius: 24px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 24px rgba(125, 150, 180, 0.1);
  flex-shrink: 0;
}

.brand-zone {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(91, 139, 255, 0.24), rgba(92, 225, 230, 0.12));
  border: 1px solid rgba(86, 182, 213, 0.16);
  box-shadow: inset 0 0 20px rgba(86, 182, 213, 0.08);
  flex-shrink: 0;

  span {
    position: absolute;
    inset: 10px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
    box-shadow: 0 0 20px rgba(92, 225, 230, 0.46);
  }
}

.brand-copy {
  .eyebrow {
    margin: 0 0 2px;
    color: var(--accent-cyan);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    line-height: 1;
    letter-spacing: 0.03em;
  }
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.view-chip,
.time-chip,
.notification-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 6px 10px;
  border-radius: 14px;
  border: 1px solid rgba(142, 164, 188, 0.14);
  background: #f7fbff;
  color: var(--text-secondary);
  font-size: 13px;
}

.view-chip {
  strong {
    color: var(--text-primary);
    font-size: 14px;
  }
}

.chip-label {
  color: var(--text-muted);
  font-size: 11px;
}

.time-chip {
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.menu-toggle {
  display: none;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(142, 164, 188, 0.14);
  border-radius: 14px;
  background: #f7fbff;
  color: var(--text-primary);
}

.notification-chip {
  color: var(--accent-green);
}

.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 12px currentColor;
  animation: pulseGlow 1.9s infinite;
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 10px;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid rgba(142, 164, 188, 0.14);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(125, 150, 180, 0.14);
  }
}

.user-meta {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-role {
  color: var(--text-muted);
  font-size: 11px;
}

.user-name {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
}

.user-avatar {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  box-shadow: 0 6px 16px rgba(91, 139, 255, 0.28);
}

.arrow-icon {
  color: var(--text-muted);
  font-size: 12px;
}

.dashboard-main {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar-overlay {
  display: none;
}

.side-panel {
  width: 220px;
  min-width: 220px;
  height: 100%;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(142, 164, 188, 0.16);
  border-radius: 24px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 24px rgba(125, 150, 180, 0.1);
  transition: width 0.3s ease, min-width 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;

  &.collapsed {
    width: 0;
    min-width: 0;
    opacity: 0;
    border-width: 0;
    pointer-events: none;
  }
}

.content-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(142, 164, 188, 0.14);
  border-radius: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: flex 0.3s ease;
}

@keyframes pulseGlow {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
}

@media (max-width: 1280px) {
  .header-top {
    grid-template-columns: 1fr;
    justify-items: start;
    gap: 10px;
  }

  .header-center,
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 1080px) {
  .dashboard-container {
    padding: 8px;
  }

  .menu-toggle {
    display: inline-grid;
    place-items: center;
  }

  .dashboard-main {
    gap: 0;
    position: relative;
  }

  /* header 始终在侧边栏之上 */
  .header-top {
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .sidebar-overlay {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 9;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(2px);
    border-radius: 20px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;

    &.visible {
      opacity: 1;
      pointer-events: auto;
    }
  }

  .side-panel {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    height: 100%;
    width: 220px;
    min-width: 220px;
    border-radius: 0 20px 20px 0;
    transform: translateX(-100%);
    opacity: 1;
    transition: transform 0.3s ease;
    pointer-events: auto;

    &.collapsed {
      width: 220px;
      min-width: 220px;
      opacity: 1;
      border-width: 1px;
      transform: translateX(-100%);
    }

    &.mobile-open {
      transform: translateX(0);
    }
  }

  .content-panel {
    width: 100%;
    border-radius: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }

  .header-top {
    padding: 8px 10px;
    border-radius: 18px;
    gap: 8px;
  }

  .brand-copy h1 {
    font-size: 18px;
  }

  .logo-mark {
    width: 40px;
    height: 40px;
  }

  .header-center {
    justify-content: flex-start;
  }

  .view-chip,
  .time-chip {
    min-height: 36px;
    padding: 4px 8px;
    font-size: 12px;
  }

  .notification-chip {
    display: none;
  }

  .user-meta {
    display: none;
  }

  .side-panel {
    width: 200px;
    min-width: 200px;
    border-radius: 0 18px 18px 0;

    &.collapsed {
      width: 200px;
      min-width: 200px;
    }
  }

  .content-panel {
    border-radius: 18px;
  }
}

@media (max-width: 520px) {
  .brand-zone {
    gap: 8px;
  }

  .view-chip,
  .time-chip {
    width: 100%;
    justify-content: space-between;
  }

  .header-actions {
    gap: 8px;
  }

  .user-avatar-wrapper {
    padding: 4px 6px;
  }

  .side-panel {
    width: 180px;
    min-width: 180px;

    &.collapsed {
      width: 180px;
      min-width: 180px;
    }
  }
}
</style>
