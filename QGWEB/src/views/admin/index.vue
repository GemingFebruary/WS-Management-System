<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, PageHeader, Loading } from '@/components'
import { adminApi } from '@/api/admin'
import { useUserStore } from '@/stores/user'
import type { Stats } from '@/types'

const router = useRouter()
const userStore = useUserStore()

// 管理员信息
const adminInfo = ref({
  name: ''
})

// 统计数据
const stats = ref<Stats>({
  jobCount: 0,
  pendingCount: 0,
  studentCount: 0,
  totalSalary: 0
})

// 加载状态
const loading = ref(false)

// 加载管理员数据
const loadAdminData = async () => {
  adminInfo.value.name = userStore.userInfo?.name || ''
  
  loading.value = true
  
  try {
    // TODO: 调用API获取统计数据
    // const res = await adminApi.getStats()
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    stats.value = {
      jobCount: 45,
      pendingCount: 12,
      studentCount: 328,
      totalSalary: 15600
    }
    
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 导航方法
const goToJobManage = () => {
  router.push('/admin/job-manage')
}

const goToApplicationReview = () => {
  router.push('/admin/application-review')
}

const addJob = () => {
  alert('功能开发中')
}

const viewAllApplications = () => {
  alert('功能开发中')
}

const salaryManage = () => {
  alert('功能开发中')
}

const salaryStats = () => {
  alert('功能开发中')
}

const studentManage = () => {
  alert('功能开发中')
}

const dataExport = () => {
  alert('功能开发中')
}

const systemSettings = () => {
  alert('功能开发中')
}

onMounted(() => {
  loadAdminData()
})
</script>

<template>
  <div class="admin-page page-content">
    <!-- 页面头部 -->
    <PageHeader
      title="管理后台"
      :show-back="true"
    />

    <!-- 管理员信息 -->
    <Card class="admin-header">
      <div class="header-content">
        <h1 class="admin-title">管理后台</h1>
        <span class="admin-name">{{ adminInfo.name }}</span>
        <span class="admin-role">管理员</span>
      </div>
    </Card>

    <!-- 数据统计 -->
    <div class="stats-section">
      <Card class="stat-card" @click="goToJobManage">
        <span class="stat-icon">📋</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.jobCount }}</span>
          <span class="stat-label">岗位总数</span>
        </div>
      </Card>
      
      <Card class="stat-card" @click="goToApplicationReview">
        <span class="stat-icon">📝</span>
        <div class="stat-info">
          <span class="stat-value pending">{{ stats.pendingCount }}</span>
          <span class="stat-label">待审核申请</span>
        </div>
      </Card>
      
      <Card class="stat-card">
        <span class="stat-icon">👥</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.studentCount }}</span>
          <span class="stat-label">学生总数</span>
        </div>
      </Card>
      
      <Card class="stat-card">
        <span class="stat-icon">💰</span>
        <div class="stat-info">
          <span class="stat-value">¥{{ stats.totalSalary }}</span>
          <span class="stat-label">本月发放</span>
        </div>
      </Card>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <Card class="menu-group">
        <h3 class="menu-title">岗位管理</h3>
        <div class="menu-item" @click="goToJobManage">
          <div class="menu-left">
            <span class="menu-icon">📋</span>
            <span class="menu-text">岗位管理</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="addJob">
          <div class="menu-left">
            <span class="menu-icon">➕</span>
            <span class="menu-text">发布新岗位</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <Card class="menu-group">
        <h3 class="menu-title">申请管理</h3>
        <div class="menu-item" @click="goToApplicationReview">
          <div class="menu-left">
            <span class="menu-icon">✅</span>
            <span class="menu-text">申请审核</span>
            <span v-if="stats.pendingCount > 0" class="menu-badge">{{ stats.pendingCount }}</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="viewAllApplications">
          <div class="menu-left">
            <span class="menu-icon">📄</span>
            <span class="menu-text">全部申请</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <Card class="menu-group">
        <h3 class="menu-title">薪资管理</h3>
        <div class="menu-item" @click="salaryManage">
          <div class="menu-left">
            <span class="menu-icon">💰</span>
            <span class="menu-text">薪资录入</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="salaryStats">
          <div class="menu-left">
            <span class="menu-icon">📊</span>
            <span class="menu-text">薪资统计</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <Card class="menu-group">
        <h3 class="menu-title">系统管理</h3>
        <div class="menu-item" @click="studentManage">
          <div class="menu-left">
            <span class="menu-icon">👥</span>
            <span class="menu-text">学生管理</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="dataExport">
          <div class="menu-left">
            <span class="menu-icon">📥</span>
            <span class="menu-text">数据导出</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="systemSettings">
          <div class="menu-left">
            <span class="menu-icon">⚙️</span>
            <span class="menu-text">系统设置</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>
    </div>

    <Loading :loading="loading" />
  </div>
</template>

<style lang="scss" scoped>
.admin-page {
  padding-bottom: 40px;
}

// 管理员头部
.admin-header {
  margin-top: 0;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: #ffffff;
}

.admin-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.admin-name {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.admin-role {
  display: inline-block;
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
}

// 统计卡片
.stats-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 12px;
  margin-top: 16px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 0 16px;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
  
  &.pending {
    color: #ff6b35;
  }
}

.stat-label {
  font-size: 12px;
  color: #999999;
}

// 菜单
.menu-section {
  margin-top: 16px;
}

.menu-group {
  padding: 0 !important;
  margin-bottom: 12px;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  padding: 16px 16px 8px;
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
  font-size: 18px;
}

.menu-text {
  font-size: 14px;
  color: #333333;
}

.menu-badge {
  padding: 2px 8px;
  background-color: #ff4d4f;
  color: #ffffff;
  border-radius: 10px;
  font-size: 11px;
  margin-left: 8px;
}

.menu-arrow {
  font-size: 14px;
  color: #999999;
}
</style>
