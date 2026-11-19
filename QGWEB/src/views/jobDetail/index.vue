<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Modal from '@/components/Modal.vue'
import Loading from '@/components/Loading.vue'
import { jobsApi } from '@/api/jobs'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/date'
import type { Job } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 岗位ID
const jobId = computed(() => route.params.id as string)

// 岗位信息
const jobInfo = ref<Job | null>(null)
const loading = ref(true)
const hasApplied = ref(false)

// 申请确认弹窗
const showApplyModal = ref(false)

// 申请弹窗内容（避免模板中中文引号导致解析错误）
const applyModalContent = computed(() => {
  return `确定要申请「${jobInfo.value?.jobName || ''}」岗位吗？`
})

// 加载岗位详情
const loadJobDetail = async () => {
  loading.value = true
  try {
    const res = await jobsApi.getJobDetail(jobId.value)
    if (res.code === 200) {
      jobInfo.value = {
        ...res.data,
        statusText: res.data.status === 'recruiting' ? '招聘中' : res.data.status === 'full' ? '已满员' : '已关闭'
      }
    }
  } catch (err) {
    console.error('加载岗位详情失败:', err)
  } finally {
    loading.value = false
  }
}

// 检查申请状态
const checkApplyStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await jobsApi.getJobDetail(jobId.value)
    // 如果用户已申请，后端会在详情中返回相关状态
    // 此处简化处理：通过申请列表检查
  } catch (err) {
    // 静默失败
  }
}

// 处理申请
const handleApply = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  if (hasApplied.value) {
    alert('您已申请过该岗位')
    return
  }
  
  showApplyModal.value = true
}

// 确认申请
const confirmApply = () => {
  showApplyModal.value = false
  router.push(`/apply-job/${jobId.value}`)
}

onMounted(() => {
  loadJobDetail()
})
</script>

<template>
  <div class="job-detail-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="jobInfo?.jobName || '岗位详情'"
      :show-back="true"
    />

    <div v-if="loading" class="loading-container">
      <Loading :loading="true" />
    </div>

    <template v-else-if="jobInfo">
      <!-- 岗位基本信息 -->
      <Card class="job-header-card">
        <div class="header-top">
          <h1 class="job-name">{{ jobInfo.jobName }}</h1>
          <div v-if="jobInfo.matchScore && jobInfo.matchScore > 0" class="match-badge">
            <span class="match-label">匹配度</span>
            <span class="match-value">{{ jobInfo.matchScore }}%</span>
          </div>
        </div>
        
        <div class="job-department">
          <img class="dept-icon" src="@/assets/img/icon/office-building.svg" alt="" />
          <span>{{ jobInfo.department }}</span>
        </div>
        
        <div class="job-status">
          <span class="status-tag" :class="`status-${jobInfo.status}`">{{ jobInfo.statusText }}</span>
          <span class="publish-info">发布于 {{ formatDate(jobInfo.publishDate) }}</span>
        </div>
      </Card>

      <!-- 岗位详细信息 -->
      <Card class="job-detail-section">
        <h3 class="section-title">
          <img class="title-icon" src="@/assets/img/icon/document.svg" alt="" />
          <span>岗位信息</span>
        </h3>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">岗位类型</span>
            <span class="info-value">{{ jobInfo.jobType }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">招聘人数</span>
            <span class="info-value">{{ jobInfo.recruitNum }}人</span>
          </div>
          <div class="info-item">
            <span class="info-label">工作时间</span>
            <span class="info-value">{{ jobInfo.workTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">薪资标准</span>
            <span class="info-value salary">¥{{ jobInfo.salary }}/时</span>
          </div>
        </div>
      </Card>

      <!-- 岗位要求 -->
      <Card class="job-requirement">
        <h3 class="section-title">
          <img class="title-icon" src="@/assets/img/icon/edit-pen.svg" alt="" />
          <span>岗位要求</span>
        </h3>
        
        <div class="requirement-content">
          <pre class="req-text">{{ jobInfo.requirement }}</pre>
        </div>
        
        <div v-if="jobInfo.requiredMajor || jobInfo.requiredGrade || jobInfo.minGpa" class="require-tags">
          <span v-if="jobInfo.requiredMajor" class="req-tag">专业: {{ jobInfo.requiredMajor }}</span>
          <span v-if="jobInfo.requiredGrade" class="req-tag">年级: {{ jobInfo.requiredGrade }}</span>
          <span v-if="jobInfo.minGpa" class="req-tag">最低GPA: {{ jobInfo.minGpa }}</span>
        </div>
      </Card>

      <!-- 工作内容 -->
      <Card class="job-content">
        <h3 class="section-title">
          <img class="title-icon" src="@/assets/img/icon/briefcase.svg" alt="" />
          <span>工作内容</span>
        </h3>
        
        <div class="content-text">
          <pre>{{ jobInfo.jobContent }}</pre>
        </div>
      </Card>

      <!-- 联系方式 -->
      <Card class="contact-info">
        <h3 class="section-title">
          <img class="title-icon" src="@/assets/img/icon/phone.svg" alt="" />
          <span>联系方式</span>
        </h3>
        
        <div class="contact-item">
          <span class="contact-label">联系人：</span>
          <span class="contact-value">{{ jobInfo.contactPerson }}</span>
        </div>
        <div class="contact-item">
          <span class="contact-label">联系电话：</span>
          <span class="contact-value">{{ jobInfo.contactPhone }}</span>
        </div>
        <div v-if="jobInfo.contactEmail" class="contact-item">
          <span class="contact-label">邮箱：</span>
          <span class="contact-value">{{ jobInfo.contactEmail }}</span>
        </div>
      </Card>

      <!-- 底部操作栏 -->
      <div class="bottom-bar">
        <div class="bar-left">
          <div class="salary-display">
            <span class="salary-label">薪资</span>
            <span class="salary-value">¥{{ jobInfo.salary }}/时</span>
          </div>
        </div>
        <div class="bar-right">
          <button
            v-if="jobInfo.status === 'recruiting'"
            class="btn btn-primary btn-large apply-btn"
            @click="handleApply"
          >
            立即申请
          </button>
          <button v-else class="btn btn-secondary btn-large" disabled>
            {{ jobInfo.statusText }}
          </button>
        </div>
      </div>
    </template>

    <!-- 申请确认弹窗 -->
    <Modal
      v-model="showApplyModal"
      title="确认申请"
      :content="applyModalContent"
      :show-cancel="true"
      @confirm="confirmApply"
    />
  </div>
</template>

<style lang="scss" scoped>
.job-detail-page {
  padding-bottom: 80px;
  
  @media (min-width: 768px) {
    padding-bottom: 40px;
  }
}

.loading-container {
  padding: 100px 0;
}

// 岗位头部
.job-header-card {
  margin-top: 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.job-name {
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  
  @media (min-width: 768px) {
    font-size: 24px;
  }
}

.match-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  padding: 8px 12px;
  border-radius: 8px;
}

.match-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.match-value {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.job-department {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666666;
  margin-bottom: 12px;
}

.dept-icon {
  width: 16px;
  height: 16px;
}

.job-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  
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

.publish-info {
  font-size: 12px;
  color: #999999;
}

// 区块标题
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
}

.title-icon {
  width: 18px;
  height: 18px;
}

// 信息网格
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999999;
}

.info-value {
  font-size: 14px;
  color: #333333;
  font-weight: 500;
  
  &.salary {
    color: #ff6b35;
    font-weight: 600;
  }
}

// 岗位要求
.requirement-content {
  margin-bottom: 12px;
}

.req-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.8;
  white-space: pre-wrap;
  font-family: inherit;
}

.require-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.req-tag {
  padding: 4px 12px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666666;
}

// 工作内容
.content-text {
  pre {
    font-size: 14px;
    color: #666666;
    line-height: 1.8;
    white-space: pre-wrap;
    font-family: inherit;
  }
}

// 联系方式
.contact-item {
  display: flex;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.contact-label {
  font-size: 14px;
  color: #999999;
  width: 80px;
}

.contact-value {
  font-size: 14px;
  color: #333333;
}

// 底部操作栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 50;
  
  @media (min-width: 768px) {
    position: static;
    max-width: 600px;
    margin: 24px auto;
    border-radius: 12px;
    padding: 16px 24px;
  }
}

.bar-left {
  display: flex;
  align-items: center;
}

.salary-display {
  display: flex;
  flex-direction: column;
}

.salary-label {
  font-size: 12px;
  color: #999999;
}

.salary-value {
  font-size: 18px;
  font-weight: 600;
  color: #ff6b35;
}

.bar-right {
  display: flex;
  gap: 12px;
}

.apply-btn {
  min-width: 120px;
}
</style>
