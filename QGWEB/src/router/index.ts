import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
    meta: { title: '首页', showTabBar: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: '我的', showTabBar: true }
  },
  {
    path: '/job-list',
    name: 'JobList',
    component: () => import('@/views/jobList/index.vue'),
    meta: { title: '岗位列表', showTabBar: true }
  },
  {
    path: '/job-detail/:id',
    name: 'JobDetail',
    component: () => import('@/views/jobDetail/index.vue'),
    meta: { title: '岗位详情' }
  },
  {
    path: '/apply-job/:id',
    name: 'ApplyJob',
    component: () => import('@/views/applyJob/index.vue'),
    meta: { title: '申请岗位', requireAuth: true }
  },
  {
    path: '/my-applications',
    name: 'MyApplications',
    component: () => import('@/views/myApplications/index.vue'),
    meta: { title: '我的申请', requireAuth: true }
  },
  {
    path: '/salary-query',
    name: 'SalaryQuery',
    component: () => import('@/views/salaryQuery/index.vue'),
    meta: { title: '薪资查询', requireAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/index.vue'),
    meta: { title: '管理后台', requireAuth: true, requireAdmin: true }
  },
  {
    path: '/admin/job-manage',
    name: 'JobManage',
    component: () => import('@/views/admin/jobManage.vue'),
    meta: { title: '岗位管理', requireAuth: true, requireAdmin: true }
  },
  {
    path: '/admin/application-review',
    name: 'ApplicationReview',
    component: () => import('@/views/admin/applicationReview.vue'),
    meta: { title: '申请审核', requireAuth: true, requireAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '勤工助学'} - 勤工助学岗位匹配系统`
  
  const userStore = useUserStore()
  
  // 需要登录的页面
  if (to.meta.requireAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  // 需要管理员权限的页面
  if (to.meta.requireAdmin && userStore.userRole !== 'admin') {
    next({ name: 'Home' })
    return
  }
  
  next()
})

export default router

// 导入store用于路由守卫
import { useUserStore } from '@/stores/user'
