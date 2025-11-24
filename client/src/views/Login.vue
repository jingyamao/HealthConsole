<template>
  <div class="login-container">
    <div class="login-form">
      <h2>医疗后台管理系统</h2>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: '',
        remember: false
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      },
      loading: false,
      error: ''
    }
  },
  setup() {
    const userStore = useUserStore()
    
    const handleLogin = async () => {
      const loginFormRef = this.$refs.loginFormRef
      await loginFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true
          this.error = ''
          try {
            // 模拟登录，实际项目中会调用真实接口
            // await userStore.login(this.loginForm)
            
            // 模拟登录成功
            localStorage.setItem('token', 'mock-token')
            ElMessage.success('登录成功')
            this.$router.push('/dashboard')
          } catch (error) {
            this.error = error.message || '登录失败，请重试'
          } finally {
            this.loading = false
          }
        }
      })
    }
    
    return {
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-form {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.error-message {
  color: #f56c6c;
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}
</style>