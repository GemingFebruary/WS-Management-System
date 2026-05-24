<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Card, PageHeader, Loading } from '@/components'
import { applicationsApi } from '@/api/applications'
import { useUserStore } from '@/stores/user'
import type { Application } from '@/types'

const router = useRouter()
const userStore = useUserStore()

// 状态筛选
const activeStatus = ref('all')

// 申请列表
const applicationList = ref<Application[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const total = ref(0)

// 状态选项
const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' }
]

// 切换状态
const changeStatus = (status: string) => {
  activeStatus.value = status
  pageNum.value = 1
  hasMore.value = true
  applicationList.value = []
  loadApplicationList()
}

// 加载申请列表
const loadApplicationList = async () => {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  
  try {
    // TODO: 调用API获取申请列表
    // const res = await applicationsApi.getMyApplications({
    //   status: activeStatus.value === 'all' ? undefined : activeStatus.value,
    //   pageNum: pageNum.value,
    //   pageSize: pageSize.value
    // })
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockApplications: Application[] = [
      {
        _id: '1',
        applyId: '1',
        studentId: userStore.userInfo?.studentId || '',
        studentName: userStore.userInfo?.name || '',
        jobId: '1',
        jobName: '图书馆助理',
        department: '图书馆',
        reason: '我对图书馆工作很感兴趣',
        status: 'pending',
        statusText: '待审核',
        applyTime: '2026-04-15 10:30',
        reviewTime: ''
      },
      {
        _id: '2',
        applyId: '2',
        studentId: userStore.userInfo?.studentId || '',
        studentName: userStore.userInfo?.name || '',
        jobId: '2',
        jobName: '实验室助理',
        department: '计算机学院',
        reason: '我有相关经验',
        status: 'approved',
        statusText: '已通过',
        applyTime: '2026-04-10 14:20',
        reviewTime: '2026-04-12 09:00'
      },
      {
        _id: '3',
        applyId: '3',
        studentId: userStore.userInfo?.studentId || '',
        studentName: userStore.userInfo?.name || '',
        jobId: '3',
        jobName: '行政助理',
        department: '学生处',
        reason: '希望锻炼自己的能力',
        status: 'rejected',
        statusText: '已驳回',
        applyTime: '2026-04-08 16:45',
        reviewTime: '2026-04-09 10:00',
        rejectReason: '专业不符合要求'
      }
    ]
    
    const totalCount = 5
    
    if (pageNum.value === 1) {
      applicationList.value = mockApplications
    } else {
      applicationList.value = [...applicationList.value, ...mockApplications]
    }
    
    total.value = totalCount
    hasMore.value = applicationList.value.length < totalCount
    pageNum.value++
    
  } catch (error) {
    console.error('加载申请列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetail = (applyId: string) => {
  // TODO: 跳转到申请详情页
  alert('查看申请详情: ' + applyId)
}

// 查看薪资
const viewSalary = (jobId: string) => {
  router.push(`/salary-query?jobId=${jobId}`)
}

// 跳转到岗位列表
const goToJobList = () => {
  router.push('/job-list')
}

// 获取状态标签样式
const getStatusClass = (status: string) => {
  return `status-${status}`
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loadApplicationList()
})
</script>

<template>
  <div class="my-applications-page page-content">
    <!-- 页面头部 -->
    <PageHeader
      title="我的申请"
      :show-back="true"
    />

    <!-- 状态筛选 -->
    <Card class="status-tabs">
      <div class="tabs-list">
        <div
          v-for="tab in statusTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeStatus === tab.key }"
          @click="changeStatus(tab.key)"
        >
          {{ tab.label }}
        </div>
      </div>
    </Card>

    <!-- 申请列表 -->
    <div class="application-list">
      <Card
        v-for="app in applicationList"
        :key="app.applyId"
        class="application-card"
        @click="viewDetail(app.applyId)"
      >
        <div class="app-header">
          <span class="app-job">{{ app.jobName }}</span>
          <span class="app-status" :class="getStatusClass(app.status)">{{ app.statusText }}</span>
        </div>
        
        <div class="app-dept">{{ app.department }}</div>
        
        <div class="app-info">
          <span class="info-text">申请时间: {{ app.applyTime }}</span>
          <span class="info-text">审核时间: {{ app.reviewTime || '待审核' }}</span>
        </div>
        
        <div v-if="app.status === 'rejected'" class="app-footer">
          <span class="reject-reason">驳回原因: {{ app.rejectReason }}</span>
        </div>
        
        <div v-if="app.status === 'approved'" class="app-actions">
          <button class="btn btn-secondary btn-small" @click.stop="viewSalary(app.jobId)">查看薪资</button>
        </div>
      </Card>

      <!-- 空状态 -->
      <div v-if="applicationList.length === 0 && !loading" class="empty-state">
        <span class="empty-icon">📭</span>
        <span class="empty-text">暂无申请记录</span>
        <button class="btn btn-primary" @click="goToJobList">去申请岗位</button>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && applicationList.length > 0" class="load-more">
        <button class="btn btn-secondary" @click="loadApplicationList" :disabled="loading">
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
      
      <div v-if="!hasMore && applicationList.length > 0" class="no-more">
        <span class="no-more-text">没有更多了</span>
      </div>
    </div>

    <Loading :loading="loading && applicationList.length === 0" />
  </div>
</template>

<style lang="scss" scoped>
.my-applications-page {
  padding-bottom: 40px;
}

// 状态筛选
.status-tabs {
  margin-top: 0;
  padding: 12px 16px !important;
}

.tabs-list {
  display: flex;
  gap: 8px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  color: #666666;
  background-color: #f8f8f8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &.active {
    background-color: #4A90E2;
    color: #ffffff;
  }
}

// 申请列表
.application-list {
  padding: 0 12px;
}

.application-card {
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.app-job {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.app-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  
  &.status-pending {
    background-color: #fffbe6;
    color: #faad14;
  }
  
  &.status-approved {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.status-rejected {
    background-color: #fff2f0;
    color: #ff4d4f;
  }
}

.app-dept {
  font-size: 13px;
  color: #666666;
  margin-bottom: 12px;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-text {
  font-size: 12px;
  color: #999999;
}

.app-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.reject-reason {
  font-size: 12px;
  color: #ff4d4f;
}

.app-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999999;
  margin-bottom: 20px;
}

// 加载更多
.load-more {
  text-align: center;
  padding: 20px;
}

.no-more {
  text-align: center;
  padding: 20px;
}

.no-more-text {
  font-size: 13px;
  color: #999999;
}
</style>
