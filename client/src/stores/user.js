import { defineStore } from 'pinia'
import { login, loginOut } from '@/api/login'
import { ref } from 'vue'

export const useUserStore = defineStore('user',() => {
  const storedUserInfo = localStorage.getItem('userInfo')
  const userInfo = ref(storedUserInfo ? JSON.parse(storedUserInfo) : {
    userId: '',
    userName: '',
  })
  async function userLogin() {
    const res = await login(userInfo.value)
    if (res && res.success) {
      // 如果后端返回了用户信息，更新 userInfo
      if (res.data && res.data.user) {
        userInfo.value = {
          userId: res.data.user.userId || userInfo.value.userId,
          userName: res.data.user.userName || userInfo.value.userName,
        }
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      return res
    } else {
      return Promise.reject('登录失败')
    }
  }
  async function userLogout() {
    const res = await loginOut()
    if (res) {
      localStorage.removeItem('userInfo')
      return res
    } else {
      return Promise.reject('退出登录失败')
    }
  }

  return {
    userInfo,
    userLogin,
    userLogout,
  }
})