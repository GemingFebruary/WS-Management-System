<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, Swiper } from '@/components'
import { useUserStore } from '@/stores/user'
import type { Job, Notice } from '@/types'

const router = useRouter()
const userStore = useUserStore()

// 轮播图数据
const bannerList = ref([
  { id: 1, title: '2026年春季勤工助学岗位开始申请', imageUrl: '' },
  { id: 2, title: '图书馆助理岗位火热招聘中', imageUrl: '' },
  { id: 3, title: '勤工助学薪资发放通知', imageUrl: '' }
])

// 推荐岗位数据
const recommendJobs = ref<Job[]>([])

// 公告数据
const noticeList = ref<Notice[]>([
  { noticeId: 1, content: '2026年春季勤工助学岗位开始申请', date: '2026-04-15' },
  { noticeId: 2, content: '图书馆助理岗位新增20个名额', date: '2026-04-14' },
  { noticeId: 3, content: '关于规范勤工助学薪资发放的通知', date: '2026-04-10' }
])

// 加载状态
const loading = ref(false)

// 加载推荐岗位
const loadRecommendJobs = async () => {
  loading.value = true
  // TODO: 调用API获取推荐岗位
  // 模拟数据
  setTimeout(() => {
    recommendJobs.value = [
      {
        _id: '1',
        jobId: '1',
        jobName: '图书馆助理',
        department: '图书馆',
        jobType: '校内',
        workTime: '周一至周五下午',
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
      }
    ]
    loading.value = false
  }, 500)
}

// 导航方法
const goToJobList = () => {
  router.push('/job-list')
}

const goToJobDetail = (jobId: string) => {
  router.push(`/job-detail/${jobId}`)
}

const goToMyApplications = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/my-applications')
}

const goToSalaryQuery = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/salary-query')
}

const goToProfile = () => {
  router.push('/profile')
}

// 快捷入口
const quickEntries = [
  { icon: '📋', text: '岗位查询', action: goToJobList },
  { icon: '📝', text: '我的申请', action: goToMyApplications },
  { icon: '💰', text: '薪资查询', action: goToSalaryQuery },
  { icon: '👤', text: '个人中心', action: goToProfile }
]

onMounted(() => {
  loadRecommendJobs()
})
</script>

<template>
  <div class="home-page page-content">
    <!-- 桌面端顶部导航 -->
    <header class="desktop-header hide-mobile">
      <div class="header-content">
        <h1 class="logo">勤工助学岗位匹配系统</h1>
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item active">首页</router-link>
          <router-link to="/job-list" class="nav-item">岗位列表</router-link>
          <router-link to="/profile" class="nav-item">个人中心</router-link>
        </nav>
        <div class="header-actions">
          <template v-if="userStore.isLoggedIn">
            <span class="user-name">{{ userStore.userInfo?.name }}</span>
            <button class="btn btn-secondary btn-small" @click="userStore.logout()">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-primary btn-small">登录</router-link>
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
      <h3 class="section-title">快捷服务</h3>
      <div class="entry-list">
        <div 
          v-for="(entry, index) in quickEntries" 
          :key="index"
          class="entry-item"
          @click="entry.action"
        >
          <span class="entry-icon">{{ entry.icon }}</span>
          <span class="entry-text">{{ entry.text }}</span>
        </div>
      </div>
    </Card>

    <!-- 推荐岗位 -->
    <section class="recommend-section">
      <div class="section-header">
        <h3 class="section-title">推荐岗位</h3>
        <span class="section-more" @click="goToJobList">查看更多 &gt;</span>
      </div>
      
      <div class="job-list">
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
            <span class="info-item">📍 {{ job.department }}</span>
            <span class="info-item">💼 {{ job.jobType }}</span>
          </div>
          <div class="job-info">
            <span class="info-item">⏰ {{ job.workTime }}</span>
            <span class="info-item salary">💰 ¥{{ job.salary }}/时</span>
          </div>
          <div class="job-footer">
            <span class="recruit-num">招聘 {{ job.recruitNum }} 人</span>
            <span class="status-tag" :class="`status-${job.status}`">{{ job.statusText }}</span>
          </div>
        </Card>
      </div>
    </section>

    <!-- 公告栏 -->
    <Card class="notice-section">
      <h3 class="section-title">最新公告</h3>
      <div class="notice-list">
        <div v-for="notice in noticeList" :key="notice.noticeId" class="notice-item">
          <span class="notice-dot">•</span>
          <span class="notice-content">{{ notice.content }}</span>
          <span class="notice-date">{{ notice.date }}</span>
        </div>
      </div>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
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

// 轮播图
.banner-section {
  margin: 12px;
  
  @media (min-width: 768px) {
    margin: 16px;
  }
}

// 快捷入口
.quick-entry {
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 16px;
  }
}

.entry-list {
  display: flex;
  justify-content: space-around;
}

.entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.entry-icon {
  font-size: 28px;
  margin-bottom: 8px;
  
  @media (min-width: 768px) {
    font-size: 32px;
  }
}

.entry-text {
  font-size: 12px;
  color: #666666;
  
  @media (min-width: 768px) {
    font-size: 14px;
  }
}

// 推荐岗位
.recommend-section {
  margin-top: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 8px;
  
  @media (min-width: 768px) {
    padding: 0 24px;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  
  @media (min-width: 768px) {
    font-size: 18px;
  }
}

.section-more {
  font-size: 12px;
  color: #4A90E2;
  cursor: pointer;
  
  @media (min-width: 768px) {
    font-size: 14px;
  }
}

.job-list {
  display: grid;
  gap: 12px;
  
  @media (min-width: 768px) {
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
  margin-bottom: 12px;
}

.job-name {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  
  @media (min-width: 768px) {
    font-size: 16px;
  }
}

.match-tag {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  
  @media (min-width: 768px) {
    font-size: 12px;
  }
}

.job-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item {
  font-size: 12px;
  color: #666666;
  
  @media (min-width: 768px) {
    font-size: 13px;
  }
  
  &.salary {
    color: #ff6b35;
    font-weight: 600;
  }
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.recruit-num {
  font-size: 12px;
  color: #999999;
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

// 公告栏
.notice-section {
  margin-top: 16px;
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 12px;
  }
}

.notice-list {
  padding-top: 8px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.notice-dot {
  color: #4A90E2;
  font-size: 14px;
  margin-right: 8px;
}

.notice-content {
  flex: 1;
  font-size: 13px;
  color: #666666;
}

.notice-date {
  font-size: 11px;
  color: #999999;
  margin-left: 12px;
}
</style>
