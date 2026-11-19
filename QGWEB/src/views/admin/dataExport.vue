<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import { adminApi } from '@/api/admin'

const exportType = ref('applications')
const exporting = ref(false)
const lastResult = ref('')

// 发薪清单月份
const payrollMonth = ref(getCurrentMonth())

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

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

const exportOptions = [
  { value: 'applications', label: '申请记录', icon: '  ' },
  { value: 'students', label: '学生信息', icon: ' ‍ ' },
  { value: 'salary', label: '薪资记录', icon: ' ' },
  { value: 'payroll', label: '发薪清单', icon: ' ' }
]

const isPayroll = computed(() => exportType.value === 'payroll')

const doExport = async () => {
  exporting.value = true
  lastResult.value = ''
  try {
    if (isPayroll.value) {
      // 发薪清单导出
      if (!payrollMonth.value) {
        lastResult.value = '请选择月份'
        exporting.value = false
        return
      }
      const res = await adminApi.exportPayroll({ month: payrollMonth.value })
      if (res.code === 200) {
        const data = res.data
        const records = data?.records || []
        lastResult.value = `导出成功：${data?.totalStudents || 0} 名学生，总额 ¥${data?.totalAmount || 0}`

        // 生成 CSV
        const headers = ['序号', '学号', '姓名', '学院', '总工时(h)', '平均时薪(元/h)', '应发金额(元)', '已发金额(元)', '待发金额(元)', '记录数', '发放状态']
        const rows = records.map((r: any, i: number) => [
          i + 1,
          r.studentId,
          r.name,
          r.college,
          r.totalHours,
          r.hourlyRate,
          r.totalAmount,
          r.paidAmount,
          r.unpaidAmount,
          r.recordCount,
          r.payStatus
        ])
        const csvContent = '﻿' + [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `发薪清单_${payrollMonth.value}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        lastResult.value = res.message || '导出失败'
      }
    } else {
      // 常规导出
      const res = await adminApi.exportData({ type: exportType.value as any })
      if (res.code === 200) {
        const data = res.data?.data || []
        const count = res.data?.count || 0
        lastResult.value = `导出成功：共 ${count} 条${exportOptions.find(o => o.value === exportType.value)?.label || ''}记录`

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${exportType.value}_export_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
  } catch (err) {
    console.error('导出失败:', err)
    lastResult.value = '导出失败，请重试'
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="export-page page-content">
    <PageHeader title="数据导出" :show-back="true" />

    <Card class="export-card">
      <h3 class="card-title">选择导出类型</h3>
      <div class="export-options">
        <div
          v-for="opt in exportOptions"
          :key="opt.value"
          class="export-option"
          :class="{ active: exportType === opt.value }"
          @click="exportType = opt.value"
        >
          <span class="opt-icon">{{ opt.icon }}</span>
          <span class="opt-label">{{ opt.label }}</span>
        </div>
      </div>

      <!-- 发薪清单月份选择 -->
      <div v-if="isPayroll" class="payroll-month">
        <label>选择月份：</label>
        <select v-model="payrollMonth" class="month-select">
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <button class="btn-export" :disabled="exporting" @click="doExport">
        {{ exporting ? '导出中...' : '开始导出' }}
      </button>
      <p v-if="lastResult" class="export-result" :class="{ error: lastResult.includes('失败') }">
        {{ lastResult }}
      </p>
    </Card>

    <Card class="info-card">
      <h3 class="card-title">说明</h3>
      <ul class="info-list">
        <li>申请记录/学生信息/薪资记录导出为 JSON 格式</li>
        <li><strong>发薪清单</strong>导出为 CSV 格式，可直接用 Excel 打开</li>
        <li>发薪清单包含每名学生的汇总金额和明细</li>
        <li>学生信息不包含密码等敏感字段</li>
        <li>薪资记录包含工时、时薪、发放状态</li>
      </ul>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.export-page { padding-bottom: 40px; }
.export-card { margin-top: 0; }
.card-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 16px; }
.export-options { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.export-option {
  flex: 1; min-width: 80px; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 12px; border: 2px solid #e8e8e8; border-radius: 10px; cursor: pointer;
  transition: all 0.2s;
  &.active { border-color: #4A90E2; background: #f0f7ff; }
  &:hover:not(.active) { border-color: #ccc; }
}
.opt-icon { font-size: 28px; }
.opt-label { font-size: 13px; color: #333; font-weight: 500; }

.payroll-month {
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px;
  label { font-size: 13px; color: #666; white-space: nowrap; }
  .month-select { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; background: #fff; }
}

.btn-export { width: 100%; padding: 12px; background: #4A90E2; color: #fff; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; transition: background 0.2s; &:hover { background: #357ABD; } &:disabled { background: #ccc; cursor: not-allowed; } }
.export-result { margin-top: 12px; font-size: 13px; color: #52c41a; text-align: center; &.error { color: #ff4d4f; } }
.info-card { margin-top: 12px; }
.info-list { padding-left: 20px; li { font-size: 13px; color: #666; line-height: 2; } }
</style>
