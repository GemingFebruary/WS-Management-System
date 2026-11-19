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
const statusFilter = ref('')
const sortByTime = ref(true)

// 详情弹窗
const showDetailModal = ref(false)
const detailTarget = ref<Application | null>(null)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已取消', value: 'cancelled' }
]

const statusTextMap: Record<string, string> = {
  pending: '待审核', approved: '已通过', rejected: '已驳回', cancelled: '已取消'
}

// 日期转时间戳（兼容 {$date: ms}、ISO 字符串、时间戳数字）
const toTimestamp = (val: any): number => {
  if (!val) return 0
  if (typeof val === 'object' && val.$date) return val.$date
  if (typeof val === 'number') return val
  const t = new Date(val).getTime()
  return isNaN(t) ? 0 : t
}

const loadApps = async () => {
  loading.value = true
  try {
    const res = await applicationsApi.getAdminApplicationList({
      status: statusFilter.value || undefined,
      pageNum: 1,
      pageSize: 100
    })
    if (res.code === 200) {
      let list = (res.data?.list || []).map((a: any) => ({
        ...a,
        statusText: statusTextMap[a.status] || a.status
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
    console.error('加载申请列表失败:', err)
  } finally {
    loading.value = false
  }
}

const onStatusChange = (val: string) => { statusFilter.value = val; loadApps() }
const toggleSort = () => { sortByTime.value = !sortByTime.value; loadApps() }
const openDetail = (app: Application) => { detailTarget.value = app; showDetailModal.value = true }

onMounted(() => { loadApps() })
</script>

<template>
  <div class="all-apps-page page-content">
    <PageHeader title="全部申请" :show-back="true" />

    <!-- 筛选栏 -->
    <Card class="filter-bar">
      <div class="filter-row">
        <select class="filter-select" :value="statusFilter" @change="onStatusChange(($event.target as HTMLSelectElement).value)">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button class="btn-sort" @click="toggleSort">
          {{ sortByTime ? '时间降序 ↑' : '时间升序 ↓' }}
        </button>
        <span class="total-text">共 {{ totalApps }} 条</span>
      </div>
    </Card>

    <!-- 申请列表 -->
    <div class="app-list">
      <Card v-for="app in appList" :key="app.applyId || app._id" class="app-item">
        <div class="app-top">
          <div class="app-info">
            <span class="app-job">{{ app.jobName }}</span>
            <span class="status-tag" :class="`status-${app.status}`">{{ app.statusText }}</span>
          </div>
          <span class="app-student">{{ app.studentName || app.studentId }}</span>
        </div>
        <div class="app-meta">
          <span>{{ app.department }}</span>
          <span>{{ formatDate(app.applyTime) }}</span>
          <span v-if="app.reviewTime">审核: {{ formatDate(app.reviewTime) }}</span>
        </div>
        <div v-if="app.rejectReason" class="reject-reason">驳回: {{ app.rejectReason }}</div>
        <div class="app-actions">
          <button class="act-btn act-student" @click="router.push({ path: '/admin/student-manage', query: { studentId: app.studentId } })">查看学生</button>
          <button class="act-btn act-job" @click="router.push({ path: '/admin/job-manage', query: { jobId: app.jobId } })">查看岗位</button>
          <button class="act-btn act-detail" @click="openDetail(app)">详情</button>
        </div>
      </Card>

      <div v-if="appList.length === 0 && !loading" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="empty-text">暂无申请记录</span>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>申请详情</h3>
            <span class="modal-close" @click="showDetailModal = false">✕</span>
          </div>
          <div class="modal-body" v-if="detailTarget">
            <div class="detail-grid">
              <div class="detail-item"><span class="dl">学生</span><span class="dv">{{ detailTarget.studentName || detailTarget.studentId }}</span></div>
              <div class="detail-item"><span class="dl">岗位</span><span class="dv">{{ detailTarget.jobName }}</span></div>
              <div class="detail-item"><span class="dl">部门</span><span class="dv">{{ detailTarget.department }}</span></div>
              <div class="detail-item"><span class="dl">状态</span><span class="dv"><span class="status-tag" :class="`status-${detailTarget.status}`">{{ statusTextMap[detailTarget.status!] }}</span></span></div>
              <div class="detail-item"><span class="dl">申请时间</span><span class="dv">{{ formatDate(detailTarget.applyTime) }}</span></div>
              <div v-if="detailTarget.reviewTime" class="detail-item"><span class="dl">审核时间</span><span class="dv">{{ formatDate(detailTarget.reviewTime) }}</span></div>
            </div>
            <div class="detail-section"><span class="dl">申请理由</span><p class="dv-block">{{ detailTarget.reason || '无' }}</p></div>
            <div v-if="detailTarget.rejectReason" class="detail-section"><span class="dl">驳回原因</span><p class="dv-block reject">{{ detailTarget.rejectReason }}</p></div>
          </div>
          <div class="modal-footer"><button class="btn-cancel" @click="showDetailModal = false">关闭</button></div>
        </div>
      </div>
    </Teleport>

    <Loading :loading="loading && appList.length === 0" />
  </div>
</template>

<style lang="scss" scoped>
.all-apps-page { padding-bottom: 40px; }
.filter-bar { padding: 12px 16px !important; }
.filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-select { appearance: none; padding: 6px 28px 6px 10px; font-size: 13px; border: 1px solid #ddd; border-radius: 6px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E") no-repeat right 8px center; cursor: pointer; max-width: 100%; box-sizing: border-box; }
.btn-sort { padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 12px; cursor: pointer; &:hover { border-color: #4A90E2; color: #4A90E2; } }
.total-text { font-size: 12px; color: #999; margin-left: auto; }

.app-list { margin-top: 10px; }
.app-item { margin-bottom: 8px; }
.app-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.app-info { display: flex; align-items: center; gap: 8px; }
.app-job { font-size: 15px; font-weight: 600; color: #333; }
.app-student { font-size: 12px; color: #666; }
.app-meta { display: flex; gap: 14px; font-size: 12px; color: #666; margin-bottom: 6px; }
.reject-reason { font-size: 12px; color: #ff4d4f; padding: 6px 10px; background: #fff2f0; border-radius: 4px; margin-bottom: 8px; }
.app-actions { border-top: 1px solid #f0f0f0; padding-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.act-btn { padding: 4px 14px; border-radius: 4px; font-size: 12px; cursor: pointer; border: 1px solid #ddd; background: transparent; color: #666; white-space: nowrap; &:hover { background: #f5f5f5; } }
.act-student { color: #1890ff; border-color: #1890ff; &:hover { background: #1890ff; color: #fff; } }
.act-job { color: #fa8c16; border-color: #fa8c16; &:hover { background: #fa8c16; color: #fff; } }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.status-pending { background: #fff7e6; color: #faad14; }
.status-approved { background: #f6ffed; color: #52c41a; }
.status-rejected { background: #fff2f0; color: #ff4d4f; }
.status-cancelled { background: #f5f5f5; color: #999; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #999; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 92%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; h3 { font-size: 16px; font-weight: 600; } .modal-close { font-size: 18px; color: #999; cursor: pointer; } }
.modal-body { padding: 16px 20px; overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.btn-cancel { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.dl { font-size: 12px; color: #999; }
.dv { font-size: 14px; color: #333; }
.detail-section { margin-bottom: 12px; .dl { display: block; margin-bottom: 4px; } }
.dv-block { font-size: 14px; color: #333; line-height: 1.6; padding: 10px; background: #f8f8f8; border-radius: 6px; &.reject { color: #ff4d4f; background: #fff2f0; } }
</style>
