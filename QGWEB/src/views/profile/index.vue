<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, Modal } from '@/components'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 用户统计数据
const applyCount = ref(0)
const successCount = ref(0)
const totalSalary = ref(0)

// 退出确认弹窗
const showLogoutModal = ref(false)

// 是否登录
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 是否是管理员
const isAdmin = computed(() => userStore.userRole === 'admin')

// 加载用户统计
const loadUserStats = async () => {
  // TODO: 调用API获取用户统计
  applyCount.value = 5
  successCount.value = 2
  totalSalary.value = 1200
}

// 导航方法
const goToLogin = () => {
  router.push('/login')
}

const goToMyApplications = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/my-applications')
}

const goToSalaryQuery = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/salary-query')
}

const goToJobList = () => {
  router.push('/job-list')
}

const goToAdmin = () => {
  router.push('/admin')
}

const editProfile = () => {
  alert('功能开发中')
}

const changePassword = () => {
  alert('功能开发中')
}

const contactUs = () => {
  alert('勤工助学管理中心\n电话：010-12345678\n邮箱：qgzx@university.edu.cn')
}

const handleLogout = () => {
  showLogoutModal.value = true
}

const confirmLogout = () => {
  userStore.logout()
  showLogoutModal.value = false
}

onMounted(() => {
  if (isLoggedIn.value) {
    loadUserStats()
  }
})
</script>

<template>
  <div class="profile-page page-content">
    <!-- 桌面端顶部导航 -->
    <header class="desktop-header hide-mobile">
      <div class="header-content">
        <router-link to="/home" class="logo">勤工助学岗位匹配系统</router-link>
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item">首页</router-link>
          <router-link to="/job-list" class="nav-item">岗位列表</router-link>
          <router-link to="/profile" class="nav-item active">个人中心</router-link>
        </nav>
        <div class="header-actions">
          <template v-if="isLoggedIn">
            <span class="user-name">{{ userInfo?.name }}</span>
            <button class="btn btn-secondary btn-small" @click="handleLogout">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-primary btn-small">登录</router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- 用户信息卡片 -->
    <Card class="user-card">
      <div class="user-header">
        <div class="user-avatar">
          <span v-if="userInfo?.name">{{ userInfo.name.charAt(0) }}</span>
          <span v-else>?</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ userInfo?.name || '未登录' }}</span>
          <span class="user-detail">{{ userInfo?.studentId || '' }}</span>
          <span class="user-detail">{{ userInfo?.major || '' }} {{ userInfo?.grade || '' }}</span>
        </div>
      </div>
      
      <div v-if="isLoggedIn" class="user-stats">
        <div class="stat-item">
          <span class="stat-value">{{ applyCount }}</span>
          <span class="stat-label">申请次数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ successCount }}</span>
          <span class="stat-label">成功上岗</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">¥{{ totalSalary }}</span>
          <span class="stat-label">累计薪资</span>
        </div>
      </div>
      
      <button v-if="!isLoggedIn" class="btn btn-primary btn-block login-action" @click="goToLogin">
        立即登录
      </button>
    </Card>

    <!-- 功能菜单 -->
    <div v-if="isLoggedIn" class="menu-section">
      <Card class="menu-group">
        <div class="menu-item" @click="goToMyApplications">
          <div class="menu-left">
            <span class="menu-icon">📝</span>
            <span class="menu-text">我的申请</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        
        <div class="menu-item" @click="goToSalaryQuery">
          <div class="menu-left">
            <span class="menu-icon">💰</span>
            <span class="menu-text">薪资查询</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        
        <div class="menu-item" @click="goToJobList">
          <div class="menu-left">
            <span class="menu-icon">📋</span>
            <span class="menu-text">岗位列表</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <Card class="menu-group">
        <div class="menu-item" @click="editProfile">
          <div class="menu-left">
            <span class="menu-icon">✏️</span>
            <span class="menu-text">编辑资料</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        
        <div class="menu-item" @click="changePassword">
          <div class="menu-left">
            <span class="menu-icon">🔒</span>
            <span class="menu-text">修改密码</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        
        <div class="menu-item" @click="contactUs">
          <div class="menu-left">
            <span class="menu-icon">📞</span>
            <span class="menu-text">联系我们</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <!-- 管理员入口 -->
      <Card v-if="isAdmin" class="menu-group">
        <div class="menu-item admin-entry" @click="goToAdmin">
          <div class="menu-left">
            <span class="menu-icon">⚙️</span>
            <span class="menu-text">管理后台</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <Card class="menu-group">
        <div class="menu-item" @click="handleLogout">
          <div class="menu-left">
            <span class="menu-icon">🚪</span>
            <span class="menu-text text-danger">退出登录</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>
    </div>

    <!-- 未登录提示 -->
    <Card v-if="!isLoggedIn" class="login-tip">
      <p class="tip-text">登录后可以享受更多服务</p>
      <p class="tip-text">查看岗位、提交申请、查询薪资</p>
    </Card>

    <!-- 退出确认弹窗 -->
    <Modal
      v-model="showLogoutModal"
      title="提示"
      content="确定要退出登录吗？"
      :show-cancel="true"
      @confirm="confirmLogout"
    />
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  padding-bottom: 80px;
  
  @media (min-width: 768px) {
    padding-bottom: 40px;
  }
}

// 桌面端顶部导航
.desktop-header {
  background-color: #4A90E2;
  color: #ffffff;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .logo {
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
  }
  
  .nav-menu {
    display: flex;
    gap: 32px;
  }
  
  .nav-item {
    color: rgba(255, 255, 255, 0.8);
    font-size: 15px;
    transition: color 0.2s ease;
    
    &:hover,
    &.active {
      color: #ffffff;
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .user-name {
    font-size: 14px;
  }
}

// 用户卡片
.user-card {
  margin-top: 16px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  
  @media (min-width: 768px) {
    gap: 20px;
  }
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  
  @media (min-width: 768px) {
    width: 72px;
    height: 72px;
    font-size: 28px;
  }
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
  
  @media (min-width: 768px) {
    font-size: 20px;
  }
}

.user-detail {
  display: block;
  font-size: 13px;
  color: #666666;
  margin-top: 2px;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
  
  @media (min-width: 768px) {
    font-size: 24px;
  }
}

.stat-label {
  font-size: 12px;
  color: #999999;
}

.login-action {
  margin-top: 16px;
}

// 菜单
.menu-section {
  margin-top: 16px;
}

.menu-group {
  padding: 0 !important;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #fafafa;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  font-size: 20px;
}

.menu-text {
  font-size: 15px;
  color: #333333;
  
  &.text-danger {
    color: #ff4d4f;
  }
}

.menu-arrow {
  font-size: 14px;
  color: #999999;
}

.admin-entry {
  .menu-text {
    color: #4A90E2;
    font-weight: 500;
  }
}

// 未登录提示
.login-tip {
  text-align: center;
  padding: 32px 16px !important;
}

.tip-text {
  font-size: 14px;
  color: #999999;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}
</style>
