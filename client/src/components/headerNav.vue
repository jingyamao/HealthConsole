<template>
  <el-menu
    default-active="1"
    class="header-nav-menu"
    text-color="#15803d"
    active-text-color="#004a7f"
    hover-background-color="#dcfce7"
    background-color="#f0fdf4"
    >
    <el-menu-item index="1">
      <el-icon><icon-menu /></el-icon>
      <span>Navigator One</span>
    </el-menu-item>
    <el-menu-item index="2">
      <el-icon><document /></el-icon>
      <span>Navigator Two</span>
    </el-menu-item>
    <el-menu-item index="3">
      <el-icon><setting /></el-icon>
      <span>Navigator Three</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>

</script>

<style lang="less" scoped>
.header-nav-menu {
  width: 100%;
  height: 100%;
}
</style>


