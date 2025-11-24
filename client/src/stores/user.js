import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || ''
  },
  
  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/login', credentials)
        this.token = response.data.token
        this.userInfo = response.data.user
        localStorage.setItem('token', this.token)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      try {
        await axios.post('/api/logout')
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.token = null
        this.userInfo = null
        localStorage.removeItem('token')
      }
    },
    
    async fetchUserInfo() {
      if (!this.token) return
      
      this.loading = true
      try {
        const response = await axios.get('/api/user/info', {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })
        this.userInfo = response.data
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
      } finally {
        this.loading = false
      }
    }
  }
})