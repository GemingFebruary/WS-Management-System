<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/Card.vue'
import Loading from '@/components/Loading.vue'
import Modal from '@/components/Modal.vue'
import { jobsApi } from '@/api/jobs'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/date'
import type { Job } from '@/types'

const router = useRouter()
const userStore = useUserStore()

// 退出确认
const showLogoutModal = ref(false)
const handleLogout = () => { showLogoutModal.value = true }
const confirmLogout = () => { userStore.logout(); showLogoutModal.value = false }

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

// 移动端检测 + 响应式 pageSize
const isMobile = ref(window.innerWidth < 768)
const pageSize = ref(isMobile.value ? 6 : 12)

// 筛选选项
const jobTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '校内', value: '校内' },
  { label: '校外', value: '校外' }
]
const departmentOptions = [
  { label: '全部部门', value: '' },
  { label: '图书馆', value: '图书馆' },
  { label: '学生处', value: '学生处' },
  { label: '计算机学院', value: '计算机学院' },
  { label: '教务处', value: '教务处' },
  { label: '后勤处', value: '后勤处' }
]
const statusOptions = [
  { label: '招聘中', value: 'recruiting' },
  { label: '已满员', value: 'full' },
  { label: '已关闭', value: 'closed' },
  { label: '全部状态', value: '' }
]

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

const handleSearch = () => resetAndLoad()

// 筛选变更
const onFilterChange = (key: string, value: string) => {
  (filterData.value as any)[key] = value
  resetAndLoad()
}

// 加载岗位列表
const loadJobList = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await jobsApi.getJobList({
      keyword: searchKeyword.value,
      jobType: filterData.value.jobType || undefined,
      department: filterData.value.department || undefined,
      status: filterData.value.status || undefined,
      sortBy: sortBy.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })

    if (res.code === 200) {
      const list = (res.data?.list || []).map((job: any) => ({
        ...job,
        statusText: job.status === 'recruiting' ? '招聘中' : job.status === 'full' ? '已满员' : '已关闭'
      }))

      if (pageNum.value === 1) {
        jobList.value = list
      } else {
        jobList.value = [...jobList.value, ...list]
      }

      totalJobs.value = res.data?.total || 0
      hasMore.value = jobList.value.length < totalJobs.value
      pageNum.value++
    }
  } catch (error) {
    console.error('加载岗位列表失败:', error)
  } finally {
    loading.value = false
  }
}

const goToJobDetail = (jobId: string) => router.push(`/job-detail/${jobId}`)

// 无限滚动：提前加载
const handleScroll = () => {
  if (loading.value || !hasMore.value) return
  const scrollH = document.documentElement.scrollHeight
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const clientH = document.documentElement.clientHeight
  // 距底部 200px 时提前加载
  if (scrollH - scrollTop - clientH < 200) {
    loadJobList()
  }
}

const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth < 768
  if (wasMobile !== isMobile.value) {
    pageSize.value = isMobile.value ? 6 : 12
  }
}

onMounted(() => {
  loadJobList()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="job-list-page page-content">
    <!-- 移动端顶部导航 -->
    <header class="mobile-header hide-desktop">
      <span class="mobile-header-title">岗位列表</span>
    </header>

    <!-- 桌面端顶部导航（统一） -->
    <header class="desktop-header hide-mobile">
      <div class="header-content">
        <router-link to="/home" class="logo">
          <img src="@/assets/QG.png" alt="" class="logo-img" />
          <span class="logo-text">勤工助学岗位匹配系统</span>
        </router-link>
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item" active-class="active" exact>首页</router-link>
          <router-link to="/job-list" class="nav-item" active-class="active">岗位列表</router-link>
          <router-link to="/notices" class="nav-item" active-class="active">全部公告</router-link>
          <router-link to="/profile" class="nav-item" active-class="active">个人中心</router-link>
        </nav>
        <div class="header-right">
          <template v-if="userStore.isLoggedIn">
            <span class="header-user">{{ userStore.userInfo?.name }}</span>
            <button class="header-btn" @click="handleLogout">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="header-btn">登录</router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- 搜索栏 -->
    <Card class="search-bar">
      <div class="search-input-wrapper">
        <img class="search-icon" src="@/assets/img/icon/search.svg" alt="" />
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

    <!-- 筛选条件（下拉框） -->
    <Card class="filter-bar">
      <div class="filter-list">
        <div class="filter-select-wrapper">
          <select
            class="filter-select"
            :value="filterData.jobType"
            @change="onFilterChange('jobType', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in jobTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="filter-select-wrapper">
          <select
            class="filter-select"
            :value="filterData.department"
            @change="onFilterChange('department', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in departmentOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="filter-select-wrapper">
          <select
            class="filter-select"
            :value="filterData.status"
            @change="onFilterChange('status', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- 排序选项 -->
    <div class="sort-bar">
      <span class="sort-text">共 {{ totalJobs }} 个岗位</span>
      <div class="sort-options">
        <span class="sort-option" :class="{ active: sortBy === 'publishDate' }" @click="changeSort('publishDate')">默认</span>
        <span class="sort-option" :class="{ active: sortBy === 'salary' }" @click="changeSort('salary')">薪资</span>
        <span class="sort-option" :class="{ active: sortBy === 'match' }" @click="changeSort('match')">匹配度</span>
      </div>
    </div>

    <!-- 岗位列表 -->
    <div class="job-list-container">
      <Card v-for="job in jobList" :key="job.jobId" class="job-card" @click="goToJobDetail(job.jobId)">
        <div class="job-header">
          <span class="job-name">{{ job.jobName }}</span>
          <span v-if="job.matchScore" class="match-tag">{{ job.matchScore }}%</span>
        </div>
        <div class="job-dept">{{ job.department }}</div>
        <div class="job-details">
          <div class="detail-row">
            <span class="detail-item"><img class="detail-icon" src="@/assets/img/icon/briefcase.svg" alt="" /> {{ job.jobType }}</span>
            <span class="detail-item"><img class="detail-icon" src="@/assets/img/icon/user.svg" alt="" /> 招聘{{ job.recruitNum }}人</span>
          </div>
          <div class="detail-row">
            <span class="detail-item"><img class="detail-icon" src="@/assets/img/icon/clock.svg" alt="" /> {{ job.workTime }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-item salary-text"><img class="detail-icon" src="@/assets/img/icon/money.svg" alt="" /> ¥{{ job.salary }}/时</span>
          </div>
        </div>
        <div class="job-footer">
          <span class="status-tag" :class="`status-${job.status}`">{{ job.statusText }}</span>
          <span class="publish-date">{{ formatDate(job.publishDate) }}</span>
        </div>
      </Card>

      <div v-if="jobList.length === 0 && !loading" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="empty-text">暂无岗位信息</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && jobList.length === 0" class="section-loading">
      <div class="loading-spinner-sm"></div>
      <span class="loading-text-sm">加载中...</span>
    </div>
    <div v-else-if="loading && jobList.length > 0" class="load-more">
      <div class="loading-spinner-sm"></div>
      <span class="loading-text-sm">加载更多...</span>
    </div>
    <div v-if="!hasMore && jobList.length > 0" class="no-more">
      <span class="no-more-text">—— 没有更多了 ——</span>
    </div>

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
.job-list-page {
  padding-bottom: 80px;
  @media (min-width: 768px) { padding-bottom: 40px; }
}

// ===== 顶部导航（统一） =====
.desktop-header {
  background-color: #4A90E2;
  color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-content {
    width: 100%;
    height: 56px;
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .logo-img {
    width: 32px;
    height: 32px;
    border-radius: 6px;
  }
  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
  }
  .nav-menu { display: flex; gap: 8px; margin: 0 auto; padding: 0 32px; }
  .nav-item {
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
    text-decoration: none;
    padding: 6px 16px;
    border-radius: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.1); }
    &.active { color: #ffffff; background: rgba(255, 255, 255, 0.18); font-weight: 500; }
  }
  .header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .header-user { font-size: 13px; color: rgba(255, 255, 255, 0.85); }
  .header-btn {
    font-size: 13px;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 4px 14px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    &:hover { background: rgba(255, 255, 255, 0.25); }
  }
}

// ===== 搜索栏 =====
.search-bar { padding: 12px 16px !important; }

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 0 12px;
}

.search-icon { width: 16px; height: 16px; }

.search-input {
  flex: 1;
  height: 40px;
  background: transparent;
  font-size: 14px;
  &::placeholder { color: #999; }
}

.search-btn {
  padding: 8px 16px;
  background-color: #4A90E2;
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  transition: background-color 0.2s;
  &:hover { background-color: #357ABD; }
}

// ===== 筛选栏（下拉框） =====
.filter-bar { padding: 10px 16px !important; }

.filter-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  @media (min-width: 768px) { gap: 12px; }
}

.filter-select-wrapper {
  position: relative;
  flex-shrink: 0;
}

.filter-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 6px 28px 6px 10px;
  font-size: 13px;
  color: #333;
  background-color: #f8f8f8;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
  min-width: 100px;
  &:hover, &:focus { border-color: #4A90E2; outline: none; }
  @media (min-width: 768px) { min-width: 120px; }
}

// ===== 排序栏 =====
.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  @media (min-width: 768px) { padding: 12px 24px; }
}

.sort-text { font-size: 13px; color: #666; }
.sort-options { display: flex; gap: 16px; }
.sort-option {
  font-size: 13px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
  &:hover, &.active { color: #4A90E2; }
}

// ===== 岗位列表 =====
.job-list-container {
  padding: 0 12px;
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 0 16px;
  }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
}

.job-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
}

.job-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.job-name { font-size: 15px; font-weight: 600; color: #333; }
.match-tag { background: linear-gradient(135deg, #4A90E2, #357ABD); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.job-dept { font-size: 13px; color: #666; margin-bottom: 8px; }
.job-details { margin-bottom: 8px; }
.detail-row { display: flex; gap: 16px; margin-bottom: 4px; }
.detail-item { font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px; &.salary-text { color: #ff6b35; font-weight: 600; } }
.detail-icon { width: 14px; height: 14px; }
.job-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #f0f0f0; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 11px; &.status-recruiting { background-color: #f6ffed; color: #52c41a; } &.status-full { background-color: #fff2f0; color: #ff4d4f; } &.status-closed { background-color: #f5f5f5; color: #999; } }
.publish-date { font-size: 11px; color: #999; }

// ===== 空状态/加载 =====
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; }
.empty-text { font-size: 14px; color: #999; }

.section-loading { display: flex; flex-direction: column; align-items: center; padding: 32px 0; gap: 12px; }
.loading-spinner-sm { width: 28px; height: 28px; border: 3px solid #e8e8e8; border-top-color: #4A90E2; border-radius: 50%; animation: spin-sm 0.8s linear infinite; }
@keyframes spin-sm { to { transform: rotate(360deg); } }
.loading-text-sm { font-size: 13px; color: #999; }

.load-more { text-align: center; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.no-more { text-align: center; padding: 20px; }
.no-more-text { font-size: 13px; color: #999; }
</style>
