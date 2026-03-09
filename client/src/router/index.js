import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      requiresAuth: true,
      title: '仪表盘'
    },
    children: [
      // 首页路由
      {
        path: '/Home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: {
          requiresAuth: true,
          title: '首页'
        }
      },
      // 患者管理路由
      {
        path: '/patients',
        name: 'PatientList',
        component: () => import('@/views/Patient/PatientList.vue'),
        meta: {
          requiresAuth: true,
          title: '患者列表'
        }
      },
      // AI系统路由
      {
        path: '/ai',
        name: 'AIChat',
        component: () => import('@/views/AISystem/AIChat.vue'),
        meta: {
          requiresAuth: true,
          title: 'AI聊天'
        }
      },
      // 报表统计路由
      {
        path: '/reports/patients',
        name: 'PatientReport',
        component: () => import('@/views/Report/PatientReport.vue'),
        meta: {
          requiresAuth: true,
          title: '患者报表'
        }
      },
      {
        path: '/reports/diagnosis',
        name: 'DiagnosisReport',
        component: () => import('@/views/Report/DiagnosisReport.vue'),
        meta: {
          requiresAuth: true,
          title: '诊疗统计'
        }
      },
      {
        path: '/reports/financial',
        name: 'FinancialReport',
        component: () => import('@/views/Report/FinancialReport.vue'),
        meta: {
          requiresAuth: true,
          title: '费用统计'
        }
      },
      // 帮助中心路由
      {
        path: '/help/guide',
        name: 'HelpGuide',
        component: () => import('@/views/Help/HelpGuide.vue'),
        meta: {
          requiresAuth: true,
          title: '使用指南'
        }
      },
    ]
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  next()
})

export default router