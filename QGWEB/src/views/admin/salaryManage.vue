<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Loading from '@/components/Loading.vue'
import Modal from '@/components/Modal.vue'
import { salaryApi } from '@/api/salary'
import { adminApi } from '@/api/admin'
import { formatDate } from '@/utils/date'

// 列表数据
const salaryList = ref<any[]>([])
const totalRecords = ref(0)
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)

// 筛选
const monthFilter = ref(getCurrentMonth())
const statusFilter = ref('')
const searchKeyword = ref('')

// 月度汇总
const summary = ref<any>(null)
const summaryLoading = ref(false)

// 录入弹窗
const showRecordModal = ref(false)
const recordForm = ref({
  studentId: '',
  jobId: '',
  jobName: '',
  workDate: '',
  workHours: 4,
  hourlyRate: 15,
  remark: ''
})

// 编辑弹窗
const showEditModal = ref(false)
const editForm = ref({
  recordId: '',
  workDate: '',
  workHours: 0,
  hourlyRate: 0,
  jobName: '',
  remark: ''
})

// 删除确认
const showDeleteModal = ref(false)
const deleteTarget = ref<any>(null)

// 发放确认
const showPayModal = ref(false)
const payTarget = ref<any>(null)

// 批量发放
const selectedIds = ref<string[]>([])
const showBatchPayModal = ref(false)

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// 生成近 6 个月选项
const monthOptions = (() => {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
    months.push({ value: val, label })
  }
  return months
})()

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待发放', value: 'unpaid' },
  { label: '已发放', value: 'paid' }
]

// 加载薪资列表
const loadSalaryList = async () => {
  loading.value = true
  try {
    const res = await salaryApi.getSalaryList({
      month: monthFilter.value || undefined,
      studentId: searchKeyword.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      let list = res.data?.list || []
      // 客户端状态筛选
      if (statusFilter.value) {
        list = list.filter((r: any) => r.payStatus === statusFilter.value)
      }
      salaryList.value = list
      totalRecords.value = res.data?.total || 0
    }
  } catch (err) {
    console.error('加载薪资列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 加载月度汇总
const loadSummary = async () => {
  if (!monthFilter.value) return
  summaryLoading.value = true
  try {
    const res = await salaryApi.calculateSalary(monthFilter.value)
    if (res.code === 200) {
      summary.value = res.data
    }
  } catch (err) {
    console.error('加载汇总失败:', err)
  } finally {
    summaryLoading.value = false
  }
}

// 筛选变化
const onFilterChange = () => {
  pageNum.value = 1
  selectedIds.value = []
  loadSalaryList()
  loadSummary()
}

// 搜索
const doSearch = () => {
  pageNum.value = 1
  loadSalaryList()
}

// 打开录入弹窗
const openRecordModal = () => {
  recordForm.value = {
    studentId: '',
    jobId: '',
    jobName: '',
    workDate: new Date().toISOString().slice(0, 10),
    workHours: 4,
    hourlyRate: 15,
    remark: ''
  }
  showRecordModal.value = true
}

// 提交录入
const submitRecord = async () => {
  const f = recordForm.value
  if (!f.studentId || !f.jobId || !f.workDate) {
    alert('请填写学生ID、岗位ID和工作日期')
    return
  }
  try {
    const res = await salaryApi.recordWork({
      studentId: f.studentId,
      jobId: f.jobId,
      workDate: f.workDate,
      workHours: f.workHours,
      hourlyRate: f.hourlyRate,
      jobName: f.jobName
    })
    if (res.code === 200) {
      showRecordModal.value = false
      loadSalaryList()
      loadSummary()
    } else {
      alert(res.message || '录入失败')
    }
  } catch (err) {
    alert('录入失败')
  }
}

// 打开编辑弹窗
const openEditModal = (item: any) => {
  editForm.value = {
    recordId: item._id || item.recordId,
    workDate: item.workDate || '',
    workHours: item.workHours || 0,
    hourlyRate: item.hourlyRate || 0,
    jobName: item.jobName || '',
    remark: item.remark || ''
  }
  showEditModal.value = true
}

// 提交编辑
const submitEdit = async () => {
  const f = editForm.value
  try {
    const res = await salaryApi.updateSalary({
      recordId: f.recordId,
      workDate: f.workDate,
      workHours: f.workHours,
      hourlyRate: f.hourlyRate,
      jobName: f.jobName,
      remark: f.remark
    })
    if (res.code === 200) {
      showEditModal.value = false
      loadSalaryList()
      loadSummary()
    } else {
      alert(res.message || '更新失败')
    }
  } catch (err) {
    alert('更新失败')
  }
}

// 确认删除
const confirmDelete = (item: any) => {
  deleteTarget.value = item
  showDeleteModal.value = true
}

// 执行删除
const doDelete = async () => {
  if (!deleteTarget.value) return
  try {
    const res = await salaryApi.deleteSalary(deleteTarget.value._id || deleteTarget.value.recordId)
    if (res.code === 200) {
      showDeleteModal.value = false
      deleteTarget.value = null
      loadSalaryList()
      loadSummary()
    } else {
      alert(res.message || '删除失败')
    }
  } catch (err) {
    alert('删除失败')
  }
}

// 单条发放
const confirmPay = (item: any) => {
  payTarget.value = item
  showPayModal.value = true
}

const doPay = async () => {
  if (!payTarget.value) return
  try {
    const res = await salaryApi.paySalary({
      recordIds: [payTarget.value._id || payTarget.value.recordId]
    })
    if (res.code === 200) {
      showPayModal.value = false
      payTarget.value = null
      loadSalaryList()
      loadSummary()
    } else {
      alert(res.message || '发放失败')
    }
  } catch (err) {
    alert('发放失败')
  }
}

// 切换选中
const toggleSelect = (id: string) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  const unpaidItems = salaryList.value.filter(r => r.payStatus !== 'paid')
  if (selectedIds.value.length === unpaidItems.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = unpaidItems.map(r => r._id || r.recordId)
  }
}

// 批量发放
const confirmBatchPay = () => {
  if (selectedIds.value.length === 0) {
    alert('请先选择要发放的记录')
    return
  }
  showBatchPayModal.value = true
}

const doBatchPay = async () => {
  try {
    const res = await salaryApi.paySalary({ recordIds: selectedIds.value })
    if (res.code === 200) {
      showBatchPayModal.value = false
      selectedIds.value = []
      loadSalaryList()
      loadSummary()
    } else {
      alert(res.message || '发放失败')
    }
  } catch (err) {
    alert('发放失败')
  }
}

// 按月批量发放
const doPayByMonth = async () => {
  if (!monthFilter.value) {
    alert('请先选择月份')
    return
  }
  try {
    const res = await salaryApi.paySalary({ month: monthFilter.value })
    if (res.code === 200) {
      loadSalaryList()
      loadSummary()
      alert(`已发放 ${monthFilter.value} 月份全部待发放薪资`)
    } else {
      alert(res.message || '发放失败')
    }
  } catch (err) {
    alert('发放失败')
  }
}

onMounted(() => {
  loadSalaryList()
  loadSummary()
})
</script>

<template>
  <div class="salary-manage-page page-content">
    <PageHeader title="薪资管理" :show-back="true" />

    <!-- 筛选区域 -->
    <Card class="filter-card">
      <div class="filter-row">
        <select v-model="monthFilter" class="filter-select" @change="onFilterChange">
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="filter-row">
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="输入学号搜索..."
          @keyup.enter="doSearch"
        />
        <button class="btn-search" @click="doSearch">搜索</button>
      </div>
      <div class="filter-actions">
        <button class="btn-primary" @click="openRecordModal">+ 录入工时</button>
        <button class="btn-success" @click="doPayByMonth">按月发放</button>
        <button
          class="btn-warning"
          :disabled="selectedIds.length === 0"
          @click="confirmBatchPay"
        >
          批量发放{{ selectedIds.length > 0 ? `(${selectedIds.length})` : '' }}
        </button>
      </div>
    </Card>

    <!-- 月度汇总卡片 -->
    <Card v-if="summary && summary.summary" class="summary-card">
      <h3 class="summary-title">{{ monthFilter }} 薪资汇总</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-value">{{ summary.summary.totalStudents }}</span>
          <span class="summary-label">学生数</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ summary.summary.totalHours }}h</span>
          <span class="summary-label">总工时</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">¥{{ summary.summary.totalAmount }}</span>
          <span class="summary-label">应发总额</span>
        </div>
        <div class="summary-item paid">
          <span class="summary-value">¥{{ summary.summary.paidAmount }}</span>
          <span class="summary-label">已发放</span>
        </div>
        <div class="summary-item unpaid">
          <span class="summary-value">¥{{ summary.summary.unpaidAmount }}</span>
          <span class="summary-label">待发放</span>
        </div>
      </div>
    </Card>

    <!-- 薪资记录列表 -->
    <Card class="list-card">
      <div class="list-header">
        <span class="list-count">共 {{ totalRecords }} 条记录</span>
      </div>

      <Loading :loading="loading" />

      <div v-if="!loading && salaryList.length === 0" class="empty-state">
        <img src="@/assets/img/icon/money.svg" alt="" class="empty-icon" />
        <p>暂无薪资记录</p>
      </div>

      <div v-if="!loading && salaryList.length > 0" class="salary-table">
        <div class="table-header">
          <label class="col-check" v-if="statusFilter !== 'paid'">
            <input type="checkbox" :checked="selectedIds.length > 0 && selectedIds.length === salaryList.filter(r => r.payStatus !== 'paid').length" @change="toggleSelectAll" />
          </label>
          <span class="col-student">学生</span>
          <span class="col-job">岗位</span>
          <span class="col-date">日期</span>
          <span class="col-hours">工时</span>
          <span class="col-rate">时薪</span>
          <span class="col-amount">金额</span>
          <span class="col-status">状态</span>
          <span class="col-actions">操作</span>
        </div>
        <div v-for="item in salaryList" :key="item._id" class="table-row">
          <label class="col-check" v-if="statusFilter !== 'paid'">
            <input
              v-if="item.payStatus !== 'paid'"
              type="checkbox"
              :checked="selectedIds.includes(item._id || item.recordId)"
              @change="toggleSelect(item._id || item.recordId)"
            />
          </label>
          <span class="col-student" :title="item.studentId">{{ item.studentId }}</span>
          <span class="col-job" :title="item.jobName">{{ item.jobName || '-' }}</span>
          <span class="col-date">{{ item.workDate || '-' }}</span>
          <span class="col-hours">{{ item.workHours }}h</span>
          <span class="col-rate">¥{{ item.hourlyRate }}</span>
          <span class="col-amount">¥{{ item.amount }}</span>
          <span class="col-status">
            <span :class="['status-tag', item.payStatus === 'paid' ? 'paid' : 'unpaid']">
              {{ item.payStatus === 'paid' ? '已发放' : '待发放' }}
            </span>
          </span>
          <span class="col-actions">
            <button v-if="item.payStatus !== 'paid'" class="btn-link edit" @click="openEditModal(item)">编辑</button>
            <button v-if="item.payStatus !== 'paid'" class="btn-link delete" @click="confirmDelete(item)">删除</button>
            <button v-if="item.payStatus !== 'paid'" class="btn-link pay" @click="confirmPay(item)">发放</button>
            <span v-if="item.payStatus === 'paid'" class="text-muted">-</span>
          </span>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalRecords > pageSize" class="pagination">
        <button :disabled="pageNum <= 1" @click="pageNum--; loadSalaryList()">上一页</button>
        <span>第 {{ pageNum }} 页</span>
        <button :disabled="pageNum * pageSize >= totalRecords" @click="pageNum++; loadSalaryList()">下一页</button>
      </div>
    </Card>

    <!-- 录入弹窗 -->
    <Modal v-if="showRecordModal" @close="showRecordModal = false">
      <template #header>录入工时</template>
      <div class="form-grid">
        <div class="form-group">
          <label>学生ID <span class="required">*</span></label>
          <input v-model="recordForm.studentId" placeholder="如 js2380001" />
        </div>
        <div class="form-group">
          <label>岗位ID <span class="required">*</span></label>
          <input v-model="recordForm.jobId" placeholder="如 JOB001" />
        </div>
        <div class="form-group">
          <label>岗位名称</label>
          <input v-model="recordForm.jobName" placeholder="如 图书馆管理员" />
        </div>
        <div class="form-group">
          <label>工作日期 <span class="required">*</span></label>
          <input type="date" v-model="recordForm.workDate" />
        </div>
        <div class="form-group half">
          <label>工作时长（小时）</label>
          <input type="number" v-model.number="recordForm.workHours" min="0.5" max="24" step="0.5" />
        </div>
        <div class="form-group half">
          <label>时薪（元/小时）</label>
          <input type="number" v-model.number="recordForm.hourlyRate" min="1" max="500" step="0.5" />
        </div>
        <div class="form-group full">
          <label>备注</label>
          <input v-model="recordForm.remark" placeholder="可选" />
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="showRecordModal = false">取消</button>
        <button class="btn-primary" @click="submitRecord">确认录入</button>
      </template>
    </Modal>

    <!-- 编辑弹窗 -->
    <Modal v-if="showEditModal" @close="showEditModal = false">
      <template #header>编辑薪资记录</template>
      <div class="form-grid">
        <div class="form-group">
          <label>工作日期</label>
          <input type="date" v-model="editForm.workDate" />
        </div>
        <div class="form-group half">
          <label>工作时长（小时）</label>
          <input type="number" v-model.number="editForm.workHours" min="0.5" max="24" step="0.5" />
        </div>
        <div class="form-group half">
          <label>时薪（元/小时）</label>
          <input type="number" v-model.number="editForm.hourlyRate" min="1" max="500" step="0.5" />
        </div>
        <div class="form-group">
          <label>岗位名称</label>
          <input v-model="editForm.jobName" />
        </div>
        <div class="form-group">
          <label>备注</label>
          <input v-model="editForm.remark" />
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="showEditModal = false">取消</button>
        <button class="btn-primary" @click="submitEdit">保存修改</button>
      </template>
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #header>确认删除</template>
      <p class="confirm-text">
        确定要删除该条薪资记录吗？<br />
        学生：{{ deleteTarget?.studentId }}<br />
        金额：¥{{ deleteTarget?.amount }}<br />
        <strong>此操作不可撤销。</strong>
      </p>
      <template #footer>
        <button class="btn-cancel" @click="showDeleteModal = false">取消</button>
        <button class="btn-danger" @click="doDelete">确认删除</button>
      </template>
    </Modal>

    <!-- 单条发放确认弹窗 -->
    <Modal v-if="showPayModal" @close="showPayModal = false">
      <template #header>确认发放</template>
      <p class="confirm-text">
        确定要发放该条薪资吗？<br />
        学生：{{ payTarget?.studentId }}<br />
        金额：¥{{ payTarget?.amount }}
      </p>
      <template #footer>
        <button class="btn-cancel" @click="showPayModal = false">取消</button>
        <button class="btn-success" @click="doPay">确认发放</button>
      </template>
    </Modal>

    <!-- 批量发放确认弹窗 -->
    <Modal v-if="showBatchPayModal" @close="showBatchPayModal = false">
      <template #header>批量发放确认</template>
      <p class="confirm-text">
        确定要发放选中的 {{ selectedIds.length }} 条薪资记录吗？
      </p>
      <template #footer>
        <button class="btn-cancel" @click="showBatchPayModal = false">取消</button>
        <button class="btn-success" @click="doBatchPay">确认发放</button>
      </template>
    </Modal>
  </div>
</template>

<style lang="scss" scoped>
.salary-manage-page { padding-bottom: 40px; }

.filter-card { margin-top: 0; }
.filter-row {
  display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;
}
.filter-select {
  flex: 1; min-width: 120px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; background: #fff;
}
.search-input {
  flex: 2; min-width: 150px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;
}
.btn-search {
  padding: 8px 20px; background: #4A90E2; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer;
  &:hover { background: #357ABD; }
}
.filter-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.btn-primary {
  padding: 8px 16px; background: #4A90E2; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer;
  &:hover { background: #357ABD; }
}
.btn-success {
  padding: 8px 16px; background: #52c41a; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer;
  &:hover { background: #389e0d; } &:disabled { background: #ccc; cursor: not-allowed; }
}
.btn-warning {
  padding: 8px 16px; background: #faad14; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer;
  &:hover { background: #d48806; } &:disabled { background: #ccc; cursor: not-allowed; }
}
.btn-danger {
  padding: 8px 16px; background: #ff4d4f; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer;
  &:hover { background: #cf1322; }
}
.btn-cancel {
  padding: 8px 16px; background: #f5f5f5; color: #666; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; cursor: pointer;
}

/* 汇总卡片 */
.summary-card { margin-top: 12px; }
.summary-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; }
.summary-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
}
.summary-item {
  text-align: center; padding: 10px 4px; background: #f8fafc; border-radius: 8px;
  &.paid .summary-value { color: #52c41a; }
  &.unpaid .summary-value { color: #faad14; }
}
.summary-value { display: block; font-size: 18px; font-weight: 700; color: #333; }
.summary-label { display: block; font-size: 11px; color: #999; margin-top: 2px; }

/* 列表 */
.list-card { margin-top: 12px; }
.list-header { margin-bottom: 12px; }
.list-count { font-size: 13px; color: #999; }

.empty-state {
  text-align: center; padding: 40px 0; color: #999;
  .empty-icon { width: 48px; height: 48px; opacity: 0.3; margin-bottom: 8px; }
  p { font-size: 14px; }
}

.salary-table { overflow-x: auto; }
.table-header, .table-row {
  display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; min-width: 700px;
}
.table-header { font-weight: 600; color: #666; font-size: 12px; background: #fafafa; padding: 8px 4px; }
.table-row { &:hover { background: #f8fafc; } }
.col-check { width: 32px; text-align: center; flex-shrink: 0; }
.col-student { width: 90px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-job { width: 100px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-date { width: 90px; flex-shrink: 0; }
.col-hours { width: 55px; flex-shrink: 0; text-align: right; }
.col-rate { width: 60px; flex-shrink: 0; text-align: right; }
.col-amount { width: 70px; flex-shrink: 0; text-align: right; font-weight: 600; color: #333; }
.col-status { width: 70px; flex-shrink: 0; text-align: center; }
.col-actions { flex: 1; min-width: 130px; text-align: right; flex-shrink: 0; }

.status-tag {
  display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px;
  &.paid { background: #f6ffed; color: #52c41a; }
  &.unpaid { background: #fffbe6; color: #faad14; }
}

.btn-link {
  background: none; border: none; cursor: pointer; font-size: 12px; padding: 2px 6px; text-decoration: underline;
  &.edit { color: #4A90E2; }
  &.delete { color: #ff4d4f; }
  &.pay { color: #52c41a; }
}

.text-muted { color: #ccc; font-size: 12px; }

.pagination {
  display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 16px;
  button {
    padding: 6px 16px; background: #fff; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; cursor: pointer;
    &:hover { border-color: #4A90E2; color: #4A90E2; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
  span { font-size: 13px; color: #666; }
}

/* 弹窗表单 */
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.form-group {
  display: flex; flex-direction: column; gap: 4px;
  &.half { grid-column: span 1; }
  &.full { grid-column: span 2; }
  label { font-size: 12px; color: #666; .required { color: #ff4d4f; } }
  input, select {
    padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;
    &:focus { border-color: #4A90E2; outline: none; }
  }
}

.confirm-text { font-size: 14px; color: #333; line-height: 1.8; }

/* 响应式 */
@media (max-width: 768px) {
  .summary-grid { grid-template-columns: repeat(3, 1fr); }
  .form-grid { grid-template-columns: 1fr; .form-group.full { grid-column: span 1; } }
  .filter-actions { flex-direction: column;
    button { width: 100%; }
  }
}

@media (max-width: 480px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .filter-row { flex-direction: column; }
}
</style>
