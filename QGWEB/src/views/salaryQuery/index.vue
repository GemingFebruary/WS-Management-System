<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Loading from '@/components/Loading.vue'
import { salaryApi } from '@/api/salary'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/date'
import type { SalaryRecord } from '@/types'

const userStore = useUserStore()

// 薪资总览
const totalSalary = ref(0)
const monthSalary = ref(0)
const totalHours = ref(0)
const currentJobCount = ref(0)

// 月份筛选
const monthOptions = (() => {
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
    months.push({ value: val, label })
  }
  return months
})()
const selectedMonth = ref(monthOptions[0].value)

// 月度数据
const monthData = ref({
  shouldPay: 0,
  actualPay: 0,
  workHours: 0,
  payStatus: 'paid',
  payStatusText: '已发放'
})

// 薪资明细
const salaryDetailList = ref<SalaryRecord[]>([])

// 加载状态
const loading = ref(false)

// 月份选择
const onMonthChange = () => {
  loadSalaryData()
}

// 加载薪资数据
const loadSalaryData = async () => {
  loading.value = true

  try {
    const res = await salaryApi.querySalary({
      month: selectedMonth.value
    })

    if (res.code === 200) {
      totalSalary.value = res.data?.totalSalary || 0
      monthSalary.value = res.data?.monthSalary || 0
      totalHours.value = res.data?.totalHours || 0
      currentJobCount.value = res.data?.currentJobCount || 0

      if (res.data?.monthData) {
        monthData.value = {
          shouldPay: res.data.monthData.shouldPay || 0,
          actualPay: res.data.monthData.actualPay || 0,
          workHours: res.data.monthData.workHours || 0,
          payStatus: res.data.monthData.payStatus || 'unpaid',
          payStatusText: res.data.monthData.payStatusText || '待发放'
        }
      }

      salaryDetailList.value = (res.data?.detailList || []).map((item: any) => ({
        ...item,
        payStatusText: item.payStatus === 'paid' ? '已发放' : '待发放'
      }))
    }
  } catch (error) {
    console.error('加载薪资数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    return
  }
  loadSalaryData()
})
</script>

<template>
  <div class="salary-query-page page-content">
    <!-- 页面头部 -->
    <PageHeader
      title="薪资查询"
      :show-back="true"
    />

    <!-- 薪资总览 -->
    <Card class="salary-overview">
      <h3 class="overview-title">薪资总览</h3>
      <div class="overview-amount">
        <span class="amount-label">累计薪资</span>
        <span class="amount-value">¥{{ totalSalary }}</span>
      </div>
      <div class="overview-stats">
        <div class="stat-item">
          <span class="stat-label">本月薪资</span>
          <span class="stat-value">¥{{ monthSalary }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">工作时长</span>
          <span class="stat-value">{{ totalHours }}小时</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">在岗岗位</span>
          <span class="stat-value">{{ currentJobCount }}个</span>
        </div>
      </div>
    </Card>

    <!-- 月份筛选 -->
    <Card class="month-filter">
      <select v-model="selectedMonth" class="month-select" @change="onMonthChange">
        <option v-for="m in monthOptions" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
    </Card>

    <!-- 月度统计 -->
    <Card class="month-summary">
      <div class="summary-row">
        <span class="summary-label">本月应发</span>
        <span class="summary-value income">¥{{ monthData.shouldPay }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">实发工资</span>
        <span class="summary-value actual">¥{{ monthData.actualPay }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">工作时长</span>
        <span class="summary-value">{{ monthData.workHours }}小时</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">发放状态</span>
        <span class="summary-status" :class="`status-${monthData.payStatus}`">{{ monthData.payStatusText }}</span>
      </div>
    </Card>

    <!-- 薪资明细 -->
    <div class="detail-section">
      <h3 class="section-header">薪资明细</h3>

      <Card
        v-for="item in salaryDetailList"
        :key="item.recordId"
        class="detail-card"
      >
        <div class="detail-header">
          <span class="detail-job">{{ item.jobName }}</span>
          <span class="detail-date">{{ formatDate(item.workDate) }}</span>
        </div>
        
        <div class="detail-content">
          <div class="detail-row">
            <span class="row-label">工作时长</span>
            <span class="row-value">{{ item.workHours }}小时</span>
          </div>
          <div class="detail-row">
            <span class="row-label">时薪标准</span>
            <span class="row-value">¥{{ item.hourlyRate }}/时</span>
          </div>
          <div class="detail-row">
            <span class="row-label">本次薪资</span>
            <span class="row-value highlight">¥{{ item.amount }}</span>
          </div>
          <div v-if="item.remark" class="detail-row">
            <span class="row-label">备注</span>
            <span class="row-value remark">{{ item.remark }}</span>
          </div>
        </div>
        
        <div class="detail-footer">
          <span class="pay-status" :class="`status-${item.payStatus}`">{{ item.payStatusText }}</span>
          <span class="pay-date">发放: {{ formatDate(item.payDate) || '待发放' }}</span>
        </div>
      </Card>

      <!-- 空状态 -->
      <div v-if="salaryDetailList.length === 0" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/money.svg" alt="" />
        <span class="empty-text">暂无薪资记录</span>
      </div>
    </div>

    <Loading :loading="loading" />
  </div>
</template>

<style lang="scss" scoped>
.salary-query-page {
  padding-bottom: 40px;
}

// 薪资总览
.salary-overview {
  margin-top: 0;
}

.overview-title {
  font-size: 14px;
  color: #999999;
  margin-bottom: 16px;
}

.overview-amount {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.amount-label {
  display: block;
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 32px;
  font-weight: 700;
  color: #ff6b35;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #999999;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

// 月份筛选
.month-filter {
  padding: 12px 16px !important;
}

.month-select {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background-color: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
  border: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
}

// 月度统计
.month-summary {
  padding: 16px !important;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.summary-label {
  font-size: 14px;
  color: #666666;
}

.summary-value {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  
  &.income {
    color: #ff6b35;
  }
  
  &.actual {
    font-size: 18px;
    font-weight: 600;
    color: #ff6b35;
  }
}

.summary-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  
  &.status-paid {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.status-unpaid {
    background-color: #fffbe6;
    color: #faad14;
  }
}

// 薪资明细
.detail-section {
  padding: 0 12px;
}

.section-header {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  padding: 16px 4px 8px;
}

.detail-card {
  margin-bottom: 12px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-job {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
}

.detail-date {
  font-size: 12px;
  color: #999999;
}

.detail-content {
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.row-label {
  font-size: 13px;
  color: #666666;
}

.row-value {
  font-size: 13px;
  color: #333333;
  
  &.highlight {
    font-weight: 600;
    color: #ff6b35;
  }
  
  &.remark {
    color: #999999;
    font-size: 12px;
  }
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
}

.pay-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  
  &.status-paid {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.status-unpaid {
    background-color: #fffbe6;
    color: #faad14;
  }
}

.pay-date {
  font-size: 12px;
  color: #999999;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #999999;
}
</style>
