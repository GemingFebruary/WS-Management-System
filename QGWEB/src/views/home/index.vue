<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/Card.vue'
import Swiper from '@/components/Swiper.vue'
import Modal from '@/components/Modal.vue'
import { useUserStore } from '@/stores/user'
import { jobsApi } from '@/api/jobs'
import { adminApi } from '@/api/admin'
import { formatDate } from '@/utils/date'
import type { Job, Notice } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const getIconUrl = (name: string) => {
  return new URL(`../../assets/img/icon/${name}.svg`, import.meta.url).href
}

// 轮播图
const bannerList = ref([
  { id: 1, title: '勤工助学，助力成长', imageUrl: 'https://picsum.photos/seed/qg1/1200/400' },
  { id: 2, title: '丰富岗位任你选', imageUrl: 'https://picsum.photos/seed/qg2/1200/400' },
  { id: 3, title: '智能匹配，快速上岗', imageUrl: 'https://picsum.photos/seed/qg3/1200/400' }
])

// 推荐岗位
const recommendJobs = ref<Job[]>([])
const recommendLoading = ref(false)
const recommendError = ref(false)

// 公告
const noticeList = ref<Notice[]>([])
const allNoticeList = ref<any[]>([])
const noticeLoading = ref(false)
const noticeError = ref(false)
const showNoticeDetail = ref(false)
const selectedNotice = ref<any>(null)

const openNotice = (notice: any) => { selectedNotice.value = notice; showNoticeDetail.value = true }

// 退出确认
const showLogoutModal = ref(false)
const handleLogout = () => { showLogoutModal.value = true }
const confirmLogout = () => { userStore.logout(); showLogoutModal.value = false }

// 加载公告
const loadNotices = async () => {
  noticeLoading.value = true
  noticeError.value = false
  try {
    const res = await adminApi.getNotices()
    let rawList: any[] = []
    if (res.code === 200) {
      const d = res.data as any
      if (Array.isArray(d)) rawList = d
      else if (d && Array.isArray(d.list)) rawList = d.list
    }
    if (rawList.length > 0) {
      allNoticeList.value = rawList.map((item: any) => ({
        _id: item._id || '',
        title: item.title || '无标题',
        content: item.content || '',
        date: formatDate(item.publishDate),
        publishDate: item.publishDate,
        publisher: item.publisher || ''
      }))
      noticeList.value = allNoticeList.value.slice(0, 3)
    } else {
      noticeError.value = true
    }
  } catch (err) {
    console.error('加载公告失败:', err)
    noticeError.value = true
  } finally {
    noticeLoading.value = false
  }
}

// 加载推荐岗位
const loadRecommendJobs = async () => {
  recommendLoading.value = true
  recommendError.value = false
  try {
    const res = await jobsApi.getRecommendJobs()
    if (res.code === 200) {
      recommendJobs.value = (res.data?.list || []).map((job: Job) => ({
        ...job,
        statusText: job.status === 'recruiting' ? '招聘中' : job.status === 'full' ? '已满员' : '已关闭'
      }))
    }
    if (recommendJobs.value.length === 0) recommendError.value = true
  } catch (err) {
    console.error('加载推荐岗位失败:', err)
    try {
      const fallback = await jobsApi.getJobList({ pageNum: 1, pageSize: 6, status: 'recruiting' })
      if (fallback.code === 200) {
        recommendJobs.value = (fallback.data?.list || []).map((job: Job) => ({ ...job, statusText: '招聘中' }))
      }
    } catch (e) {
      recommendError.value = true
    }
  } finally {
    recommendLoading.value = false
  }
}

// 导航
const goToJobList = () => router.push('/job-list')
const goToJobDetail = (jobId: string) => router.push(`/job-detail/${jobId}`)
const goToMyApplications = () => {
  if (!userStore.isLoggedIn) { router.push('/login'); return }
  router.push('/my-applications')
}
const goToSalaryQuery = () => {
  if (!userStore.isLoggedIn) { router.push('/login'); return }
  router.push('/salary-query')
}
const goToProfile = () => router.push('/profile')

const quickEntries = [
  { icon: 'document', text: '岗位查询', action: goToJobList },
  { icon: 'edit-pen', text: '我的申请', action: goToMyApplications },
  { icon: 'money', text: '薪资查询', action: goToSalaryQuery },
  { icon: 'user', text: '个人中心', action: goToProfile }
]

onMounted(() => {
  loadNotices()
  loadRecommendJobs()
})
</script>

<template>
  <div class="home-page page-content">
    <!-- 移动端顶部导航 -->
    <header class="mobile-header hide-desktop">
      <span class="mobile-header-title">勤工助学岗位匹配系统</span>
    </header>

    <!-- 桌面端顶部导航 -->
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

    <!-- 轮播图 -->
    <section class="banner-section">
      <Swiper :list="bannerList" :autoplay="true" :interval="3000" />
    </section>

    <!-- 快捷功能入口 -->
    <Card class="quick-entry">
      <div class="entry-list">
        <div
          v-for="(entry, index) in quickEntries"
          :key="index"
          class="entry-item"
          @click="entry.action"
        >
          <img class="entry-icon" :src="getIconUrl(entry.icon)" alt="" />
          <span class="entry-text">{{ entry.text }}</span>
        </div>
      </div>
    </Card>

    <!-- 最新公告（在推荐岗位上方） -->
    <Card class="notice-section">
      <div class="notice-header">
        <h3 class="notice-title">最新公告</h3>
        <span class="recommend-more" @click="router.push('/notices')">查看更多 &gt;</span>
      </div>

      <!-- 加载中 -->
      <div v-if="noticeLoading" class="section-loading">
        <div class="loading-spinner-sm"></div>
        <span class="loading-text-sm">加载公告中...</span>
      </div>

      <!-- 加载失败 -->
      <div v-else-if="noticeError" class="section-error">
        <img class="error-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="error-text">暂无公告</span>
        <button class="retry-btn" @click="loadNotices">重新加载</button>
      </div>

      <!-- 公告列表 -->
      <div v-else class="notice-list">
        <div v-for="notice in noticeList" :key="notice._id" class="notice-item" @click="openNotice(notice)">
          <span class="notice-dot">•</span>
          <span class="notice-content">{{ notice.title }}</span>
          <span class="notice-date">{{ notice.date }}</span>
        </div>
      </div>
    </Card>

    <!-- 推荐岗位 -->
    <Card class="recommend-section">
      <div class="recommend-header">
        <h3 class="recommend-title">推荐岗位</h3>
        <span class="recommend-more" @click="goToJobList">查看更多 &gt;</span>
      </div>

      <!-- 加载中 -->
      <div v-if="recommendLoading" class="section-loading">
        <div class="loading-spinner-sm"></div>
        <span class="loading-text-sm">加载岗位中...</span>
      </div>

      <!-- 加载失败 -->
      <div v-else-if="recommendError" class="section-error">
        <img class="error-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="error-text">加载岗位失败</span>
        <button class="retry-btn" @click="loadRecommendJobs">重新加载</button>
      </div>

      <!-- 岗位列表 -->
      <div v-else class="job-list">
        <Card
          v-for="job in recommendJobs"
          :key="job.jobId"
          class="job-card"
          @click="goToJobDetail(job.jobId)"
        >
          <div class="job-header">
            <span class="job-name">{{ job.jobName }}</span>
            <span v-if="job.matchScore" class="match-tag">匹配度 {{ job.matchScore }}%</span>
          </div>
          <div class="job-info">
            <span class="info-item"><img class="info-icon" src="@/assets/img/icon/location.svg" alt="" /> {{ job.department }}</span>
            <span class="info-item"><img class="info-icon" src="@/assets/img/icon/briefcase.svg" alt="" /> {{ job.jobType }}</span>
          </div>
          <div class="job-info">
            <span class="info-item"><img class="info-icon" src="@/assets/img/icon/clock.svg" alt="" /> {{ job.workTime }}</span>
            <span class="info-item salary"><img class="info-icon" src="@/assets/img/icon/money.svg" alt="" /> ¥{{ job.salary }}/时</span>
          </div>
          <div class="job-footer">
            <span class="recruit-num">招聘 {{ job.recruitNum }} 人</span>
            <span class="status-tag" :class="`status-${job.status}`">{{ job.statusText }}</span>
          </div>
        </Card>
      </div>
    </Card>

    <!-- 公告详情弹窗 -->
    <Teleport to="body">
      <div v-if="showNoticeDetail" class="notice-modal-overlay" @click.self="showNoticeDetail = false">
        <div class="notice-modal">
          <div class="notice-modal-header">
            <h3>{{ selectedNotice?.title }}</h3>
            <span class="notice-modal-close" @click="showNoticeDetail = false">✕</span>
          </div>
          <div class="notice-modal-body">
            <p class="notice-detail-content">{{ selectedNotice?.content }}</p>
            <div class="notice-detail-meta">{{ selectedNotice?.date }} · {{ selectedNotice?.publisher }}</div>
          </div>
        </div>
      </div>
    </Teleport>

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
.home-page {
  padding-bottom: 80px;
  @media (min-width: 768px) { padding-bottom: 40px; }
}

// ===== 桌面端顶部导航（统一） =====
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
  .nav-menu {
    display: flex;
    gap: 8px;
    margin: 0 auto;
    padding: 0 32px;
  }
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
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .header-user {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
  }
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

// ===== 轮播图 =====
.banner-section {
  margin: 12px;
  @media (min-width: 768px) { margin: 16px; }
}

// ===== 快捷入口（均匀分布+边框） =====
.quick-entry {}

.entry-list {
  display: flex;
  gap: 12px;
  @media (min-width: 768px) { gap: 16px; }
}

.entry-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 8px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
  &:hover {
    transform: translateY(-2px);
    border-color: #4A90E2;
    background: #f0f7ff;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.15);
  }
  @media (min-width: 768px) {
    padding: 24px 12px;
  }
}

.entry-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 10px;
  @media (min-width: 768px) { width: 36px; height: 36px; }
}

.entry-text {
  font-size: 12px;
  color: #666666;
  white-space: nowrap;
  @media (min-width: 768px) { font-size: 14px; }
}

// ===== 公告栏（蓝色标题背景） =====
.notice-section {
  margin-top: 12px;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #4A90E2;
  margin: -20px -20px 12px -20px;
  padding: 12px 20px;
  border-radius: 8px 8px 0 0;
  @media (min-width: 768px) {
    margin: -24px -24px 16px -24px;
    padding: 14px 24px;
  }
}

.notice-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.notice-list {
  padding-top: 4px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #f8f8f8; }
  &:last-child { border-bottom: none; }
}

.notice-dot {
  color: #4A90E2;
  font-size: 14px;
  margin-right: 8px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-date {
  font-size: 11px;
  color: #999;
  margin-left: 12px;
  flex-shrink: 0;
}

// ===== 推荐岗位（蓝色标题+紧凑布局） =====
.recommend-section {
  margin-top: 12px;
}

.recommend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #4A90E2;
  margin: -20px -20px 12px -20px;
  padding: 12px 20px;
  border-radius: 8px 8px 0 0;
  @media (min-width: 768px) {
    margin: -24px -24px 16px -24px;
    padding: 14px 24px;
  }
}

.recommend-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.recommend-more {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  @media (min-width: 768px) { font-size: 14px; }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 8px;
  @media (min-width: 768px) { padding: 0 24px; }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  @media (min-width: 768px) { font-size: 18px; }
}

.section-more {
  font-size: 12px;
  color: #4A90E2;
  cursor: pointer;
  @media (min-width: 768px) { font-size: 14px; }
}

.job-list {
  display: grid;
  gap: 8px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
}

.job-card {
  cursor: pointer;
  background-color: #f8fafc;
  border: 1px solid #eef2f6;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #4A90E2;
  }
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.job-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (min-width: 768px) { font-size: 15px; }
}

.match-tag {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  flex-shrink: 0;
}

.job-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.info-item {
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 3px;
  &.salary { color: #ff6b35; font-weight: 600; }
  @media (min-width: 768px) { font-size: 12px; }
}

.info-icon {
  width: 12px;
  height: 12px;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}

.recruit-num {
  font-size: 11px;
  color: #999;
}

.status-tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  &.status-recruiting { background-color: #f6ffed; color: #52c41a; }
  &.status-full { background-color: #fff2f0; color: #ff4d4f; }
  &.status-closed { background-color: #f5f5f5; color: #999; }
}

// ===== 加载/错误状态（通用） =====
.section-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  gap: 12px;
}

.loading-spinner-sm {
  width: 28px;
  height: 28px;
  border: 3px solid #e8e8e8;
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: spin-sm 0.8s linear infinite;
}

@keyframes spin-sm {
  to { transform: rotate(360deg); }
}

.loading-text-sm {
  font-size: 13px;
  color: #999;
}

.section-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  gap: 8px;
}

.error-icon {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.error-text {
  font-size: 13px;
  color: #999;
}

.retry-btn {
  margin-top: 4px;
  padding: 4px 16px;
  font-size: 12px;
  color: #4A90E2;
  border: 1px solid #4A90E2;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #4A90E2; color: #fff; }
}

// ===== 全部公告弹窗 =====
.notice-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notice-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.notice-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  h3 { font-size: 16px; font-weight: 600; }
  .notice-modal-close { font-size: 18px; color: #999; cursor: pointer; }
}

.notice-modal-body {
  padding: 16px 20px;
  overflow-y: auto;
}

.notice-detail-item {
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
  &:last-child { border-bottom: none; }
}

.notice-detail-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.notice-detail-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 6px;
}

.notice-detail-meta {
  font-size: 11px;
  color: #999;
}
</style>
