import { defineStore } from 'pinia'

export const useSystemStore = defineStore('system', {
  state: () => ({
    sidebarCollapse: false,
    theme: 'default',
    language: 'zh-CN',
    breadcrumbList: []
  }),
  
  getters: {
    isSidebarCollapse: (state) => state.sidebarCollapse,
    currentTheme: (state) => state.theme
  },
  
  actions: {
    toggleSidebar() {
      this.sidebarCollapse = !this.sidebarCollapse
    },
    
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
    },
    
    setLanguage(language) {
      this.language = language
      localStorage.setItem('language', language)
    },
    
    updateBreadcrumbList(list) {
      this.breadcrumbList = list
    },
    
    loadSettings() {
      const savedTheme = localStorage.getItem('theme')
      const savedLanguage = localStorage.getItem('language')
      
      if (savedTheme) {
        this.theme = savedTheme
      }
      
      if (savedLanguage) {
        this.language = savedLanguage
      }
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'system-settings',
        storage: localStorage,
        paths: ['theme', 'language']
      }
    ]
  }
})