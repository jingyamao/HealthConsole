<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-desc">您访问的页面可能已被移动、删除或暂时不可用</p>
      <el-button type="primary" @click="goHome" class="home-button">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style lang="less" scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #409eff;
  margin: 0 0 20px 0;
  line-height: 1;
  letter-spacing: -5px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
}

.error-desc {
  font-size: 16px;
  color: #606266;
  margin: 0 0 30px 0;
  line-height: 1.6;
}

.home-button {
  padding: 12px 28px;
  font-size: 16px;
  border-radius: 4px;
  transition: none;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .not-found-container {
    padding: 10px;
  }

  .not-found-content {
    padding: 30px 20px;
    width: 90%;
  }

  .error-code {
    font-size: 80px;
    letter-spacing: -3px;
  }

  .error-title {
    font-size: 20px;
  }

  .error-desc {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .error-code {
    font-size: 60px;
  }

  .home-button {
    width: 100%;
  }
}
</style>
