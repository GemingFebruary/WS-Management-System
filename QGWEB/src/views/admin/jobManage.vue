<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Loading from '@/components/Loading.vue'
import Modal from '@/components/Modal.vue'
import { jobsApi } from '@/api/jobs'
import { formatDate } from '@/utils/date'
import type { Job } from '@/types'

// 岗位列表
const jobList = ref<Job[]>([])
const totalJobs = ref(0)
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)

// 搜索/筛选
const searchKeyword = ref('')
const statusFilter = ref('')

// 新建/编辑弹窗
const showJobModal = ref(false)
const isEdit = ref(false)
const jobForm = ref({
  jobId: '',
  jobName: '',
  department: '',
  jobType: '校内',
  workTime: '',
  salary: 15,
  recruitNum: 1,
  requirement: '',
  jobContent: '',
  requiredMajor: '',
  requiredGrade: '',
  minGpa: 0,
  contactPerson: '',
  contactPhone: '',
  contactEmail: ''
})

// 删除确认
const showDeleteModal = ref(false)
const deleteTarget = ref<Job | null>(null)

// 状态下拉选择
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '招聘中', value: 'recruiting' },
  { label: '已满员', value: 'full' },
  { label: '已关闭', value: 'closed' }
]

// 岗位状态切换选项（不含"全部状态"）
const jobStatusOptions = [
  { label: '招聘中', value: 'recruiting' },
  { label: '已满员', value: 'full' },
  { label: '已关闭', value: 'closed' }
]

const statusTextMap: Record<string, string> = {
  recruiting: '招聘中', full: '已满员', closed: '已关闭'
}

// 加载岗位列表
const loadJobList = async () => {
  loading.value = true
  try {
    const res = await jobsApi.getJobList({
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      jobList.value = (res.data?.list || []).map((j: any) => ({
        ...j,
        statusText: statusTextMap[j.status] || j.status
      }))
      totalJobs.value = res.data?.total || 0
    }
  } catch (err) {
    console.error('加载岗位列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pageNum.value = 1; loadJobList() }
const onStatusChange = (val: string) => { statusFilter.value = val; pageNum.value = 1; loadJobList() }

// 打开新建弹窗
const openCreate = () => {
  isEdit.value = false
  jobForm.value = {
    jobId: '', jobName: '', department: '', jobType: '校内', workTime: '',
    salary: 15, recruitNum: 1, requirement: '', jobContent: '',
    requiredMajor: '', requiredGrade: '', minGpa: 0,
    contactPerson: '', contactPhone: '', contactEmail: ''
  }
  showJobModal.value = true
}

// 打开编辑弹窗
const openEdit = (job: Job) => {
  isEdit.value = true
  jobForm.value = {
    jobId: job.jobId || '',
    jobName: job.jobName || '',
    department: job.department || '',
    jobType: job.jobType || '校内',
    workTime: job.workTime || '',
    salary: job.salary || 15,
    recruitNum: job.recruitNum || 1,
    requirement: job.requirement || '',
    jobContent: job.jobContent || '',
    requiredMajor: job.requiredMajor || '',
    requiredGrade: job.requiredGrade || '',
    minGpa: job.minGpa || 0,
    contactPerson: job.contactPerson || '',
    contactPhone: job.contactPhone || '',
    contactEmail: job.contactEmail || ''
  }
  showJobModal.value = true
}

// 提交岗位表单
const submitJob = async () => {
  const f = jobForm.value
  if (!f.jobName.trim() || !f.department.trim()) {
    alert('请填写岗位名称和所属部门')
    return
  }
  try {
    if (isEdit.value) {
      await jobsApi.updateJob({ jobId: f.jobId, ...f })
    } else {
      await jobsApi.createJob(f)
    }
    showJobModal.value = false
    loadJobList()
  } catch (err) {
    console.error('保存岗位失败:', err)
    alert('保存失败，请重试')
  }
}

// 删除岗位
const confirmDelete = (job: Job) => { deleteTarget.value = job; showDeleteModal.value = true }
const doDelete = async () => {
  if (!deleteTarget.value) return
  try {
    await jobsApi.deleteJob(deleteTarget.value.jobId!)
    showDeleteModal.value = false
    loadJobList()
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败，请重试')
  }
}

// 切换状态（直接调用）
const changeStatus = async (job: Job, newStatus: string) => {
  if (job.status === newStatus) return
  try {
    await jobsApi.toggleJobStatus(job.jobId!, newStatus)
    loadJobList()
  } catch (err) {
    console.error('切换状态失败:', err)
    alert('操作失败，请重试')
  }
}

const route = useRoute()

onMounted(async () => {
  await loadJobList()
  // 从管理首页跳转过来时自动打开创建弹窗
  if (route.query.action === 'create') {
    openCreate()
  }
  // 从申请页面跳转过来时自动打开对应岗位的编辑弹窗
  if (route.query.jobId) {
    const target = jobList.value.find((j: any) => j.jobId === route.query.jobId || j._id === route.query.jobId)
    if (target) openEdit(target)
  }
})
</script>

<template>
  <div class="job-manage-page page-content">
    <PageHeader title="岗位管理" :show-back="true" />

    <!-- 操作栏 -->
    <Card class="action-bar">
      <div class="action-top">
        <div class="search-box">
          <input v-model="searchKeyword" class="search-input" placeholder="搜索岗位名称/部门" @keyup.enter="handleSearch" />
          <button class="btn-search" @click="handleSearch">搜索</button>
        </div>
        <button class="btn-create" @click="openCreate">+ 发布岗位</button>
      </div>
      <div class="filter-row">
        <select class="filter-select" :value="statusFilter" @change="onStatusChange(($event.target as HTMLSelectElement).value)">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <span class="total-text">共 {{ totalJobs }} 个岗位</span>
      </div>
    </Card>

    <!-- 岗位列表 -->
    <div class="job-list">
      <Card v-for="job in jobList" :key="job.jobId" class="job-item">
        <div class="job-top">
          <div class="job-info">
            <span class="job-name">{{ job.jobName }}</span>
            <span class="status-tag" :class="`status-${job.status}`">{{ job.statusText }}</span>
          </div>
          <span class="job-dept">{{ job.department }}</span>
        </div>
        <div class="job-meta">
          <span>{{ job.jobType }}</span>
          <span>招聘 {{ job.recruitNum }} 人</span>
          <span>¥{{ job.salary }}/时</span>
          <span>{{ formatDate(job.publishDate) }}</span>
        </div>
        <div class="job-actions">
          <button class="act-btn act-edit" @click="openEdit(job)">编辑</button>
          <select class="status-select" :value="job.status" @change="changeStatus(job, ($event.target as HTMLSelectElement).value)">
            <option v-for="opt in jobStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button class="act-btn act-delete" @click="confirmDelete(job)">删除</button>
        </div>
      </Card>

      <div v-if="jobList.length === 0 && !loading" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="empty-text">暂无岗位</span>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showJobModal" class="modal-overlay" @click.self="showJobModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ isEdit ? '编辑岗位' : '发布新岗位' }}</h3>
            <span class="modal-close" @click="showJobModal = false">✕</span>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label>岗位名称 *</label>
                <input v-model="jobForm.jobName" placeholder="如：图书馆助理" />
              </div>
              <div class="form-group">
                <label>所属部门 *</label>
                <input v-model="jobForm.department" placeholder="如：图书馆" />
              </div>
              <div class="form-group">
                <label>岗位类型</label>
                <select v-model="jobForm.jobType">
                  <option>校内</option><option>校外</option>
                </select>
              </div>
              <div class="form-group">
                <label>招聘人数</label>
                <input v-model.number="jobForm.recruitNum" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>薪资（元/时）</label>
                <input v-model.number="jobForm.salary" type="number" min="1" />
              </div>
              <div class="form-group">
                <label>工作时间</label>
                <input v-model="jobForm.workTime" placeholder="如：周一至周五下午 14:00-17:00" />
              </div>
            </div>
            <div class="form-group full">
              <label>岗位要求</label>
              <textarea v-model="jobForm.requirement" rows="3" placeholder="填写岗位要求..."></textarea>
            </div>
            <div class="form-group full">
              <label>工作内容</label>
              <textarea v-model="jobForm.jobContent" rows="3" placeholder="填写工作内容..."></textarea>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>专业要求</label>
                <input v-model="jobForm.requiredMajor" placeholder="不限则留空" />
              </div>
              <div class="form-group">
                <label>年级要求</label>
                <input v-model="jobForm.requiredGrade" placeholder="不限则留空" />
              </div>
              <div class="form-group">
                <label>最低GPA</label>
                <input v-model.number="jobForm.minGpa" type="number" min="0" step="0.1" />
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>联系人</label>
                <input v-model="jobForm.contactPerson" />
              </div>
              <div class="form-group">
                <label>联系电话</label>
                <input v-model="jobForm.contactPhone" />
              </div>
              <div class="form-group">
                <label>联系邮箱</label>
                <input v-model="jobForm.contactEmail" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showJobModal = false">取消</button>
            <button class="btn-confirm" @click="submitJob">{{ isEdit ? '保存' : '发布' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认 -->
    <Modal v-model="showDeleteModal" title="确认删除" :content="`确定要删除岗位「${deleteTarget?.jobName}」吗？此操作不可撤销。`" :show-cancel="true" @confirm="doDelete" />

    <Loading :loading="loading && jobList.length === 0" />
  </div>
</template>

<style lang="scss" scoped>
.job-manage-page { padding-bottom: 40px; }

.action-bar { padding: 12px 16px !important; }
.action-top { display: flex; gap: 10px; margin-bottom: 10px; @media (max-width: 480px) { flex-direction: column; } }
.search-box { flex: 1; display: flex; gap: 6px; min-width: 0; }
.search-input { flex: 1; min-width: 0; height: 36px; padding: 0 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box; &:focus { border-color: #4A90E2; outline: none; } }
.btn-search { padding: 0 14px; background: #4A90E2; color: #fff; border-radius: 6px; font-size: 13px; white-space: nowrap; flex-shrink: 0; }
.btn-create { padding: 0 16px; background: #52c41a; color: #fff; border-radius: 6px; font-size: 13px; white-space: nowrap; @media (max-width: 480px) { width: 100%; text-align: center; } }
.filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-select { appearance: none; padding: 6px 28px 6px 10px; font-size: 13px; border: 1px solid #ddd; border-radius: 6px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E") no-repeat right 8px center; cursor: pointer; max-width: 100%; box-sizing: border-box; }
.total-text { font-size: 12px; color: #999; margin-left: auto; white-space: nowrap; }

.job-list { margin-top: 10px; }
.job-item { margin-bottom: 8px; }
.job-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.job-info { display: flex; align-items: center; gap: 8px; }
.job-name { font-size: 15px; font-weight: 600; color: #333; }
.job-dept { font-size: 12px; color: #999; }
.job-meta { display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 10px; }
.job-actions { display: flex; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 10px; }
.act-btn { padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; border: 1px solid; transition: all 0.2s; }
.act-edit { color: #4A90E2; border-color: #4A90E2; background: transparent; &:hover { background: #4A90E2; color: #fff; } }
.act-status { color: #faad14; border-color: #faad14; background: transparent; &:hover { background: #faad14; color: #fff; } }
.act-delete { color: #ff4d4f; border-color: #ff4d4f; background: transparent; &:hover { background: #ff4d4f; color: #fff; } }
.status-select { appearance: none; padding: 4px 24px 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; cursor: pointer; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E") no-repeat right 6px center; &:focus { border-color: #4A90E2; outline: none; } }

.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.status-recruiting { background: #f6ffed; color: #52c41a; }
.status-full { background: #fff2f0; color: #ff4d4f; }
.status-closed { background: #f5f5f5; color: #999; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #999; }

// 弹窗
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 92%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; h3 { font-size: 16px; font-weight: 600; } .modal-close { font-size: 18px; color: #999; cursor: pointer; } }
.modal-body { padding: 16px 20px; overflow-y: auto; max-height: 65vh; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.btn-cancel { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; }
.btn-confirm { padding: 8px 20px; border: none; border-radius: 6px; background: #4A90E2; color: #fff; font-size: 14px; }

.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 12px; }
.form-group { display: flex; flex-direction: column; gap: 4px; label { font-size: 12px; color: #666; } input, select, textarea { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; &:focus { border-color: #4A90E2; outline: none; } } textarea { resize: vertical; font-family: inherit; } &.full { margin-bottom: 12px; } }
</style>
