<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, FormInput, Loading } from '@/components'
import { jobsApi } from '@/api/jobs'
import type { Job } from '@/types'

const router = useRouter()

// 搜索和筛选
const searchKeyword = ref('')
const filterData = ref({
  jobType: '',
  department: '',
  status: 'recruiting'
})
const sortBy = ref('publishDate')

// 岗位列表
const jobList = ref<Job[]>([])
const totalJobs = ref(0)
const loading = ref(false)
const hasMore = ref(true)
const pageNum = ref(1)
const pageSize = ref(10)

// 筛选选项
const jobTypeOptions = ['全部', '校内', '校外']
const departmentOptions = ['全部', '图书馆', '学生处', '计算机学院', '教务处', '后勤处']
const statusOptions = ['全部', '招聘中', '已满员', '已关闭']

// 当前选中的筛选项
const activeFilter = ref<string | null>(null)

// 显示筛选选择器
const showFilterPicker = (type: string) => {
  // 简单实现：使用原生select
  const options = getFilterOptions(type)
  const current = filterData.value[type as keyof typeof filterData.value]
  const index = options.findIndex(opt => opt === current || (opt === '全部' && !current))
  
  const result = prompt(`选择${type === 'jobType' ? '类型' : type === 'department' ? '部门' : '状态'}\n${options.map((opt, i) => `${i}. ${opt}`).join('\n')}\n\n当前: ${options[index]}\n请输入序号:`)
  
  if (result !== null) {
    const selectedIndex = parseInt(result)
    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < options.length) {
      const value = options[selectedIndex] === '全部' ? '' : options[selectedIndex]
      filterData.value[type as keyof typeof filterData.value] = value
      resetAndLoad()
    }
  }
}

// 获取筛选项
const getFilterOptions = (type: string): string[] => {
  switch (type) {
    case 'jobType': return jobTypeOptions
    case 'department': return departmentOptions
    case 'status': return statusOptions
    default: return []
  }
}

// 改变排序
const changeSort = (sort: string) => {
  sortBy.value = sort
  resetAndLoad()
}

// 重置并加载
const resetAndLoad = () => {
  pageNum.value = 1
  hasMore.value = true
  jobList.value = []
  loadJobList()
}

// 处理搜索
const handleSearch = () => {
  resetAndLoad()
}

// 加载岗位列表
const loadJobList = async () => {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  
  try {
    // TODO: 调用API获取岗位列表
    // const res = await jobsApi.getJobList({
    //   keyword: searchKeyword.value,
    //   jobType: filterData.value.jobType,
    //   department: filterData.value.department,
    //   status: filterData.value.status,
    //   sortBy: sortBy.value,
    //   pageNum: pageNum.value,
    //   pageSize: pageSize.value
    // })
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockJobs: Job[] = [
      {
        _id: '1',
        jobId: '1',
        jobName: '图书馆助理',
        department: '图书馆',
        jobType: '校内',
        workTime: '周一至周五下午 14:00-17:00',
        salary: 15,
        recruitNum: 10,
        status: 'recruiting',
        statusText: '招聘中',
        publishDate: '2026-04-15',
        matchScore: 85
      },
      {
        _id: '2',
        jobId: '2',
        jobName: '实验室助理',
        department: '计算机学院',
        jobType: '校内',
        workTime: '周末',
        salary: 20,
        recruitNum: 5,
        status: 'recruiting',
        statusText: '招聘中',
        publishDate: '2026-04-14',
        matchScore: 78
      },
      {
        _id: '3',
        jobId: '3',
        jobName: '行政助理',
        department: '学生处',
        jobType: '校内',
        workTime: '课余时间',
        salary: 18,
        recruitNum: 8,
        status: 'recruiting',
        statusText: '招聘中',
        publishDate: '2026-04-13',
        matchScore: 72
      },
      {
        _id: '4',
        jobId: '4',
        jobName: '教务处助理',
        department: '教务处',
        jobType: '校内',
        workTime: '周一至周五上午',
        salary: 16,
        recruitNum: 3,
        status: 'full',
        statusText: '已满员',
        publishDate: '2026-04-12'
      }
    ]
    
    const total = 20
    
    if (pageNum.value === 1) {
      jobList.value = mockJobs
    } else {
      jobList.value = [...jobList.value, ...mockJobs]
    }
    
    totalJobs.value = total
    hasMore.value = jobList.value.length < total
    pageNum.value++
    
  } catch (error) {
    console.error('加载岗位列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转到岗位详情
const goToJobDetail = (jobId: string) => {
  router.push(`/job-detail/${jobId}`)
}

// 获取筛选显示文本
const getFilterText = (type: string): string => {
  const value = filterData.value[type as keyof typeof filterData.value]
  return value || '全部'
}

onMounted(() => {
  loadJobList()
})
</script>

<template>
  <div class="job-list-page page-content">
    <!-- 桌面端顶部导航 -->
    <header class="desktop-header hide-mobile">
      <div class="header-content">
        <router-link to="/home" class="logo">勤工助学岗位匹配系统</router-link>
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item">首页</router-link>
          <router-link to="/job-list" class="nav-item active">岗位列表</router-link>
          <router-link to="/profile" class="nav-item">个人中心</router-link>
        </nav>
        <div class="header-actions">
          <router-link to="/login" class="btn btn-primary btn-small">登录</router-link>
        </div>
      </div>
    </header>

    <!-- 搜索栏 -->
    <Card class="search-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索岗位名称、部门"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
    </Card>

    <!-- 筛选条件 -->
    <Card class="filter-bar">
      <div class="filter-list">
        <div class="filter-item" @click="showFilterPicker('jobType')">
          <span class="filter-label">类型: {{ getFilterText('jobType') }}</span>
          <span class="filter-arrow">▼</span>
        </div>
        <div class="filter-item" @click="showFilterPicker('department')">
          <span class="filter-label">部门: {{ getFilterText('department') }}</span>
          <span class="filter-arrow">▼</span>
        </div>
        <div class="filter-item" @click="showFilterPicker('status')">
          <span class="filter-label">状态: {{ getFilterText('status') }}</span>
          <span class="filter-arrow">▼</span>
        </div>
      </div>
    </Card>

    <!-- 排序选项 -->
    <div class="sort-bar">
      <span class="sort-text">共 {{ totalJobs }} 个岗位</span>
      <div class="sort-options">
        <span
          class="sort-option"
          :class="{ active: sortBy === 'publishDate' }"
          @click="changeSort('publishDate')"
        >默认</span>
        <span
          class="sort-option"
          :class="{ active: sortBy === 'salary' }"
          @click="changeSort('salary')"
        >薪资</span>
        <span
          class="sort-option"
          :class="{ active: sortBy === 'match' }"
          @click="changeSort('match')"
        >匹配度</span>
      </div>
    </div>

    <!-- 岗位列表 -->
    <div class="job-list-container">
      <Card
        v-for="job in jobList"
        :key="job.jobId"
        class="job-card"
        @click="goToJobDetail(job.jobId)"
      >
        <div class="job-header">
          <span class="job-name">{{ job.jobName }}</span>
          <span v-if="job.matchScore" class="match-tag">{{ job.matchScore }}%</span>
        </div>
        
        <div class="job-dept">{{ job.department }}</div>
        
        <div class="job-details">
          <div class="detail-row">
            <span class="detail-item">💼 {{ job.jobType }}</span>
            <span class="detail-item">👥 招聘{{ job.recruitNum }}人</span>
          </div>
          <div class="detail-row">
            <span class="detail-item">⏰ {{ job.workTime }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-item salary-text">💰 ¥{{ job.salary }}/时</span>
          </div>
        </div>
        
        <div class="job-footer">
          <span class="status-tag" :class="`status-${job.status}`">{{ job.statusText }}</span>
          <span class="publish-date">{{ job.publishDate }}</span>
        </div>
      </Card>

      <!-- 空状态 -->
      <div v-if="jobList.length === 0 && !loading" class="empty-state">
        <span class="empty-icon">📭</span>
        <span class="empty-text">暂无岗位信息</span>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && jobList.length > 0" class="load-more">
        <button class="btn btn-secondary" @click="loadJobList" :disabled="loading">
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
      
      <div v-if="!hasMore && jobList.length > 0" class="no-more">
        <span class="no-more-text">没有更多了</span>
      </div>
    </div>

    <Loading :loading="loading && jobList.length === 0" />
  </div>
</template>

<style lang="scss" scoped>
.job-list-page {
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
    
    &:hover,
    &.active {
      color: #ffffff;
    }
  }
}

// 搜索栏
.search-bar {
  padding: 12px 16px !important;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 0 12px;
}

.search-icon {
  font-size: 16px;
}

.search-input {
  flex: 1;
  height: 40px;
  background: transparent;
  font-size: 14px;
  
  &::placeholder {
    color: #999999;
  }
}

.search-btn {
  padding: 8px 16px;
  background-color: #4A90E2;
  color: #ffffff;
  border-radius: 6px;
  font-size: 14px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #357ABD;
  }
}

// 筛选栏
.filter-bar {
  padding: 12px 16px !important;
}

.filter-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  
  @media (min-width: 768px) {
    gap: 16px;
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background-color: #f8f8f8;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
  }
}

.filter-label {
  font-size: 13px;
  color: #666666;
}

.filter-arrow {
  font-size: 10px;
  color: #999999;
}

// 排序栏
.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  
  @media (min-width: 768px) {
    padding: 16px 24px;
  }
}

.sort-text {
  font-size: 13px;
  color: #666666;
}

.sort-options {
  display: flex;
  gap: 16px;
}

.sort-option {
  font-size: 13px;
  color: #999999;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover,
  &.active {
    color: #4A90E2;
  }
}

// 岗位列表
.job-list-container {
  padding: 0 12px;
  
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 0 16px;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.job-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.job-name {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.match-tag {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.job-dept {
  font-size: 13px;
  color: #666666;
  margin-bottom: 12px;
}

.job-details {
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}

.detail-item {
  font-size: 12px;
  color: #666666;
  
  &.salary-text {
    color: #ff6b35;
    font-weight: 600;
  }
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  
  &.status-recruiting {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.status-full {
    background-color: #fff2f0;
    color: #ff4d4f;
  }
  
  &.status-closed {
    background-color: #f5f5f5;
    color: #999999;
  }
}

.publish-date {
  font-size: 11px;
  color: #999999;
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
