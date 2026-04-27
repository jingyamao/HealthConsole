<template>
  <div class="login-container">
    <!-- 背景粒子容器 -->
    <div class="particles-container">
      <div
        v-for="(particle, index) in particles"
        :key="index"
        class="particle"
        :style="{
          width: particle.size + 'px',
          height: particle.size + 'px',
          left: particle.x + '%',
          top: particle.y + '%',
          animationDelay: particle.delay + 's',
          animationDuration: particle.duration + 's'
        }"
      ></div>
    </div>

    <!-- 医疗装饰图标 -->
    <div class="medical-icon" style="top: 10%; left: 15%;">
      <Icon name="heart" />
    </div>
    <div class="medical-icon" style="top: 25%; right: 20%; animation-delay: 5s;">
      <Icon name="plus" />
    </div>
    <div class="medical-icon" style="bottom: 20%; left: 25%; animation-delay: 10s;">
      <Icon name="plus" />
    </div>
    <div class="medical-icon" style="bottom: 15%; right: 15%; animation-delay: 15s;">
      <Icon name="user" />
    </div>

    <!-- 主内容区 -->
    <div class="login-form">
      <div class="logo-container">
        <div class="logo-icon">
          <!-- 心跳图标 -->
          <Icon name="heart" color="white" />
        </div>
      </div>

      <h1>医疗后台管理系统</h1>

      <!-- 登录输入框 -->
      <div class="form-inputs">
        <div class="input-group">
          <div class="input-label">用户ID</div>
          <input
            type="text"
            v-model="userInfo.userId"
            placeholder="请输入用户ID"
            class="login-input"
            @keydown.enter="handleLogin"
          />
        </div>
        <div class="input-group">
          <div class="input-label">用户名</div>
          <input
            type="text"
            v-model="userInfo.userName"
            placeholder="请输入用户名"
            class="login-input"
            @keydown.enter="handleLogin"
          />
        </div>
      </div>

      <button
        class="login-button"
        @click="handleLogin"
        @mouseenter="onButtonHover(true)"
        @mouseleave="onButtonHover(false)"
        title="进入系统"
      >
        <!-- 箭头图标 -->
        <Icon name="arrow-right" color="white" className="arrow-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/icon.vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const router = useRouter()
const particles = ref([])
const isHovering = ref(false)

// 生成背景粒子
const createParticles = () => {
  const particleCount = 25
  const newParticles = []

  for (let i = 0; i < particleCount; i++) {
    newParticles.push({
      x: Math.random() * 100,
      y: Math.random() * 100 + 100, // 从下方开始
      size: Math.random() * 15 + 8,
      delay: Math.random() * 15,
      duration: Math.random() * 15 + 10
    })
  }

  particles.value = newParticles
}

// 处理登录
const handleLogin = async () => {
  try {
    const loginSuccess = await userStore.userLogin()
    if (loginSuccess && loginSuccess.success) {
      ElMessage.success(loginSuccess.data?.message || '登录成功')
      router.push('/home')
    }
  } catch (error) {
    ElMessage.error(error?.message || '登录失败')
  }
}

// 按钮悬停效果
const onButtonHover = (hovering) => {
  isHovering.value = hovering
}

// 初始化
onMounted(() => {
  createParticles()
})
</script>

<style lang="less" scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  overflow: hidden;
  z-index: 10;

  /* 浮动粒子背景 */
  .particles-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    overflow: hidden;
    .particle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.8);
      animation: float 15s infinite linear;
      cursor: pointer;
      transition: transform 0.3s ease, background-color 0.3s ease;

      &:hover {
        transform: scale(1.5);
        background-color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}



@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.8;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

/* 主内容区域 */
.login-form {
  position: relative;
  z-index: 20;
  width: 90%;
  max-width: 500px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 107, 166, 0.2);
  text-align: center;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  .logo-container {
    margin-bottom: 16px;
    animation: fadeIn 1.5s ease-out;
    .logo-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #00bcd4, #008ba3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 10px;
      color: white;
      font-size: 36px;
      box-shadow: 0 8px 20px rgba(0, 155, 184, 0.3);
    }
  }
  h1 {
    color: #006b7d;
    font-size: 2.2rem;
    margin-bottom: 18px;
    letter-spacing: 1px;
    font-weight: 600;
    animation: slideUp 1s ease-out;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* 表单输入区域 */
  .form-inputs {
    margin-bottom: 18px;
    animation: slideUp 1s ease-out 0.3s;
    animation-fill-mode: forwards;
    opacity: 0;
    
    .input-group {
      margin-bottom: 14px;
      text-align: left;
      
      .input-label {
        display: block;
        color: #006b7d;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 4px;
        letter-spacing: 0.5px;
      }
      
      .login-input {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e0f7fa;
        border-radius: 8px;
        font-size: 16px;
        color: #0f3b2e;
        background-color: rgba(255, 255, 255, 0.8);
        transition: all 0.3s ease;
        box-sizing: border-box;
        
        &:focus {
          outline: none;
          border-color: #00bcd4;
          box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
          background-color: #ffffff;
        }
        
        &::placeholder {
          color: #a0c4c9;
          font-size: 14px;
        }
      }
    }
  }

  /* 交互式按钮 */
  .login-button {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #9ea1ff, #17dbfe);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(0, 155, 184, 0.4);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: none;
    outline: none;
    position: relative;
    overflow: hidden;
    animation: pulse 2s infinite 0.5s, fadeIn 1s ease-out 0.5s;
    opacity: 0;
    animation-fill-mode: forwards;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      transform: scale(0);
      border-radius: 50%;
      transition: transform 0.5s ease;
    }

    &:hover {
      transform: scale(1.1) translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 155, 184, 0.5);

      &::before {
        transform: scale(1.5);
      }
    }

    &:active {
      transform: scale(0.95);
      box-shadow: 0 5px 15px rgba(0, 155, 184, 0.3);
    }

    .arrow-icon {
      transition: transform 0.3s ease;

      .login-button:hover & {
        transform: translateX(5px);
      }
    }
  }

}

/* 装饰性医疗元素 */
.medical-icon {
  position: absolute;
  opacity: 0.1;
  color: #00bcd4;
  font-size: 24px;
  animation: fadeInRotate 20s infinite linear;
  z-index: 5;
  width: 24px;
  height: 24px;
}

/* 动画关键帧 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 188, 212, 0.7); }
  70% { box-shadow: 0 0 0 20px rgba(0, 188, 212, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 188, 212, 0); }
}

@keyframes fadeInRotate {
  0% {
    opacity: 0.05;
    transform: rotate(0deg) scale(0.8);
  }
  50% {
    opacity: 0.15;
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    opacity: 0.05;
    transform: rotate(360deg) scale(0.8);
  }
}

/* 响应式调整 */
@media (max-width: 600px) {
  .login-form {
    padding: 20px 14px;
    width: 95%;
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 14px;
  }

  .form-inputs {
    margin-bottom: 14px;

    .input-group {
      margin-bottom: 10px;
      
      .input-label {
        font-size: 13px;
      }
      
      .login-input {
        padding: 8px 10px;
        font-size: 14px;
      }
    }
  }

  .logo-icon {
    width: 70px;
    height: 70px;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .login-button {
    width: 70px;
    height: 70px;

    .arrow-icon {
      width: 20px;
      height: 20px;
    }
  }
}
</style>
