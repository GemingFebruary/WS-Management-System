<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Loading from '@/components/Loading.vue'
import Modal from '@/components/Modal.vue'
import { applicationsApi } from '@/api/applications'
import { formatDate } from '@/utils/date'
import type { Application } from '@/types'

const router = useRouter()
const appList = ref<Application[]>([])
const totalApps = ref(0)
const loading = ref(false)
const sortByTime = ref(true) // true = 按时间降序

// 日期转时间戳（兼容 {$date: ms}、ISO 字符串、时间戳数字）
const toTimestamp = (val: any): number => {
  if (!val) return 0
  if (typeof val === 'object' && val.$date) return val.$date
  if (typeof val === 'number') return val
  const t = new Date(val).getTime()
  return isNaN(t) ? 0 : t
}

// 审核弹窗
const showReviewModal = ref(false)
const reviewTarget = ref<Application | null>(null)
const reviewAction = ref<'approve' | 'reject'>('approve')
const rejectReason = ref('')

// 加载待审核申请
const loadPending = async () => {
  loading.value = true
  try {
    const res = await applicationsApi.getAdminApplicationList({
      status: 'pending',
      pageNum: 1,
      pageSize: 100
    })
    if (res.code === 200) {
      let list = (res.data?.list || []).map((a: any) => ({
        ...a,
        statusText: '待审核'
      }))
      if (sortByTime.value) {
        list.sort((a: any, b: any) => {
          const ta = toTimestamp(a.applyTime)
          const tb = toTimestamp(b.applyTime)
          return tb - ta
        })
      }
      appList.value = list
      totalApps.value = res.data?.total || 0
    }
  } catch (err) {
    console.error('加载待审核申请失败:', err)
  } finally {
    loading.value = false
  }
}

const toggleSort = () => { sortByTime.value = !sortByTime.value; loadPending() }

// 打开审核弹窗
const openReview = (app: Application, action: 'approve' | 'reject') => {
  reviewTarget.value = app
  reviewAction.value = action
  rejectReason.value = ''
  showReviewModal.value = true
}

// 提交审核
const submitReview = async () => {
  if (!reviewTarget.value) return
  if (reviewAction.value === 'reject' && !rejectReason.value.trim()) {
    alert('请填写驳回原因')
    return
  }
  try {
    await applicationsApi.reviewApplication({
      applyId: reviewTarget.value.applyId || reviewTarget.value._id,
      action: reviewAction.value,
      rejectReason: reviewAction.value === 'reject' ? rejectReason.value : undefined
    })
    showReviewModal.value = false
    loadPending()
  } catch (err) {
    console.error('审核失败:', err)
    alert('审核操作失败，请重试')
  }
}

onMounted(() => { loadPending() })
</script>

<template>
  <div class="review-page page-content">
    <PageHeader title="申请审核" :show-back="true" />

    <!-- 工具栏 -->
    <Card class="toolbar">
      <div class="toolbar-row">
        <span class="pending-count">待审核: {{ totalApps }} 条</span>
        <button class="btn-sort" @click="toggleSort">
          {{ sortByTime ? '按时间降序 ↑' : '按时间升序 ↓' }}
        </button>
      </div>
    </Card>

    <!-- 待审核列表 -->
    <div class="app-list">
      <Card v-for="app in appList" :key="app.applyId || app._id" class="app-item">
        <div class="app-top">
          <span class="app-job">{{ app.jobName }}</span>
          <span class="app-student">{{ app.studentName || app.studentId }}</span>
        </div>
        <div class="app-dept">{{ app.department }}</div>
        <div class="app-meta">
          <span>申请时间: {{ formatDate(app.applyTime) }}</span>
        </div>
        <div v-if="app.reason" class="app-reason">申请理由: {{ app.reason }}</div>
        <div class="app-actions">
          <button class="act-btn act-student" @click="router.push({ path: '/admin/student-manage', query: { studentId: app.studentId } })">查看学生</button>
          <button class="act-btn act-job" @click="router.push({ path: '/admin/job-manage', query: { jobId: app.jobId } })">查看岗位</button>
          <button class="act-btn act-approve" @click="openReview(app, 'approve')">通过</button>
          <button class="act-btn act-reject" @click="openReview(app, 'reject')">驳回</button>
        </div>
      </Card>

      <div v-if="appList.length === 0 && !loading" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="empty-text">暂无待审核申请</span>
      </div>
    </div>

    <!-- 审核弹窗 -->
    <Teleport to="body">
      <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ reviewAction === 'approve' ? '确认通过' : '确认驳回' }}</h3>
            <span class="modal-close" @click="showReviewModal = false">✕</span>
          </div>
          <div class="modal-body">
            <p class="review-info">
              学生: <strong>{{ reviewTarget?.studentName || reviewTarget?.studentId }}</strong><br />
              岗位: <strong>{{ reviewTarget?.jobName }}</strong>
            </p>
            <div v-if="reviewAction === 'reject'" class="form-group">
              <label>驳回原因 *</label>
              <textarea v-model="rejectReason" rows="3" placeholder="请填写驳回原因..."></textarea>
            </div>
            <p v-else class="confirm-text">确定通过该申请？</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showReviewModal = false">取消</button>
            <button :class="reviewAction === 'approve' ? 'btn-approve' : 'btn-reject'" @click="submitReview">
              {{ reviewAction === 'approve' ? '确认通过' : '确认驳回' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Loading :loading="loading && appList.length === 0" />
  </div>
</template>

<style lang="scss" scoped>
.review-page { padding-bottom: 40px; }
.toolbar { padding: 12px 16px !important; }
.toolbar-row { display: flex; justify-content: space-between; align-items: center; }
.pending-count { font-size: 14px; font-weight: 600; color: #ff6b35; }
.btn-sort { padding: 6px 14px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 12px; cursor: pointer; transition: all 0.2s; &:hover { border-color: #4A90E2; color: #4A90E2; } }

.app-list { margin-top: 10px; }
.app-item { margin-bottom: 8px; border-left: 3px solid #faad14; }
.app-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.app-job { font-size: 15px; font-weight: 600; color: #333; }
.app-student { font-size: 12px; color: #666; }
.app-dept { font-size: 12px; color: #999; margin-bottom: 4px; }
.app-meta { font-size: 12px; color: #666; margin-bottom: 6px; }
.app-reason { font-size: 12px; color: #555; padding: 8px 10px; background: #f8f8f8; border-radius: 6px; margin-bottom: 8px; line-height: 1.5; }
.app-actions { display: flex; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 10px; flex-wrap: wrap; }
.act-btn { padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap; @media (max-width: 480px) { padding: 6px 12px; font-size: 11px; } }
.act-student { background: #e6f7ff; color: #1890ff; &:hover { background: #1890ff; color: #fff; } }
.act-job { background: #fff7e6; color: #fa8c16; &:hover { background: #fa8c16; color: #fff; } }
.act-approve { background: #52c41a; color: #fff; &:hover { background: #389e0d; } }
.act-reject { background: #ff4d4f; color: #fff; &:hover { background: #cf1322; } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #999; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 92%; max-width: 420px; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; h3 { font-size: 16px; font-weight: 600; } .modal-close { font-size: 18px; color: #999; cursor: pointer; } }
.modal-body { padding: 16px 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.review-info { font-size: 14px; color: #333; line-height: 1.8; margin-bottom: 8px; }
.confirm-text { font-size: 14px; color: #333; }
.btn-cancel { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; }
.btn-approve { padding: 8px 20px; border: none; border-radius: 6px; background: #52c41a; color: #fff; font-size: 14px; }
.btn-reject { padding: 8px 20px; border: none; border-radius: 6px; background: #ff4d4f; color: #fff; font-size: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; label { font-size: 12px; color: #666; } textarea { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; resize: vertical; font-family: inherit; &:focus { border-color: #4A90E2; outline: none; } } }
</style>
