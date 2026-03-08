<template>
  <div class="dashboard-container">
    <div class="header-top">
      <div class="logo"></div>
      <div class="title">Health Console</div>
    </div>
    <div class="header-nav">
      <HeaderNav />
    </div>
  </div>
</template>

<script setup>
import HeaderNav from '@/components/headerNav.vue'

</script>

<style lang="less" scoped>
.dashboard-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #c3fbff;
  .header-top {
    height: 60px;
    background-color: #fff;
    display: flex;
    align-items: center;
    .logo {
      width: 200px;
      height: 100%;
      background-image: url('@/assets/logo.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .title {
      width: calc(100% - 200px);
      color: #006b7d;
      font-size: 2.2rem;
      margin-bottom: 10px;
      letter-spacing: 1px;
      font-weight: 600;
      animation: slideUp 1s ease-out;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
  .header-nav {
    width: 200px;
    height: 100vh;
  }
}
</style>