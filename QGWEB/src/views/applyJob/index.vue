<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Card, PageHeader, FormInput, Loading } from '@/components'
import { applicationsApi } from '@/api/applications'
import { useUserStore } from '@/stores/user'
import type { Job } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 岗位ID
const jobId = computed(() => route.params.id as string)

// 岗位信息
const jobInfo = ref<Partial<Job>>({})

// 申请表单
const applyForm = ref({
  name: '',
  studentId: '',
  college: '',
  major: '',
  grade: '',
  phone: '',
  email: '',
  experience: '',
  reason: ''
})

// 时间选择
const selectedTime = ref('')
const timeOptions = [
  '周一上午', '周一下午', '周一晚上',
  '周二上午', '周二下午', '周二晚上',
  '周三上午', '周三下午', '周三晚上',
  '周四上午', '周四下午', '周四晚上',
  '周五上午', '周五下午', '周五晚上',
  '周六上午', '周六下午', '周六晚上',
  '周日上午', '周日下午', '周日晚上'
]

// 文件列表
const fileList = ref<Array<{ name: string; path: string; size: number }>>([])

// 状态
const loading = ref(false)
const submitting = ref(false)

// 加载岗位信息
const loadJobInfo = async () => {
  // TODO: 调用API获取岗位信息
  await new Promise(resolve => setTimeout(resolve, 300))
  
  jobInfo.value = {
    jobId: jobId.value,
    jobName: '图书馆助理',
    department: '图书馆',
    salary: 15
  }
}

// 初始化用户信息
const initUserInfo = () => {
  const userInfo = userStore.userInfo
  if (userInfo) {
    applyForm.value.name = userInfo.name || ''
    applyForm.value.studentId = userInfo.studentId || ''
    applyForm.value.college = userInfo.college || ''
    applyForm.value.major = userInfo.major || ''
    applyForm.value.grade = userInfo.grade || ''
    applyForm.value.phone = userInfo.phone || ''
  }
}

// 上传文件
const handleFileUpload = () => {
  // 模拟文件上传
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = (e: any) => {
    const files = e.target.files
    for (let i = 0; i < files.length; i++) {
      fileList.value.push({
        name: files[i].name,
        path: '',
        size: files[i].size
      })
    }
  }
  input.click()
}

// 删除文件
const removeFile = (index: number) => {
  fileList.value.splice(index, 1)
}

// 提交申请
const handleSubmit = async () => {
  // 表单验证
  if (!applyForm.value.phone) {
    alert('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(applyForm.value.phone)) {
    alert('手机号格式不正确')
    return
  }
  if (!selectedTime.value) {
    alert('请选择可工作时间')
    return
  }
  if (!applyForm.value.reason) {
    alert('请填写申请理由')
    return
  }
  if (applyForm.value.reason.length < 20) {
    alert('申请理由至少20个字')
    return
  }
  
  submitting.value = true
  
  try {
    // TODO: 调用API提交申请
    // const res = await applicationsApi.submitApplication({
    //   jobId: jobId.value,
    //   reason: applyForm.value.reason,
    //   phone: applyForm.value.phone,
    //   email: applyForm.value.email,
    //   availableTime: selectedTime.value,
    //   experience: applyForm.value.experience
    // })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    alert('申请提交成功')
    router.back()
    
  } catch (error: any) {
    alert(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadJobInfo()
  initUserInfo()
})
</script>

<template>
  <div class="apply-job-page">
    <!-- 页面头部 -->
    <PageHeader
      title="申请岗位"
      :show-back="true"
    />

    <!-- 岗位信息摘要 -->
    <Card class="job-summary">
      <h3 class="summary-title">申请岗位</h3>
      <div class="summary-content">
        <span class="job-name">{{ jobInfo.jobName }}</span>
        <span class="job-dept">{{ jobInfo.department }}</span>
        <span class="job-salary">薪资: ¥{{ jobInfo.salary }}/时</span>
      </div>
    </Card>

    <!-- 申请表单 -->
    <Card class="apply-form">
      <h3 class="form-title">申请信息</h3>

      <div class="form-item">
        <label class="form-label">姓名 <span class="required">*</span></label>
        <FormInput v-model="applyForm.name" disabled />
      </div>

      <div class="form-item">
        <label class="form-label">学号 <span class="required">*</span></label>
        <FormInput v-model="applyForm.studentId" disabled />
      </div>

      <div class="form-item">
        <label class="form-label">学院 <span class="required">*</span></label>
        <FormInput v-model="applyForm.college" disabled />
      </div>

      <div class="form-item">
        <label class="form-label">专业 <span class="required">*</span></label>
        <FormInput v-model="applyForm.major" disabled />
      </div>

      <div class="form-item">
        <label class="form-label">年级 <span class="required">*</span></label>
        <FormInput v-model="applyForm.grade" disabled />
      </div>

      <div class="form-item">
        <label class="form-label">手机号 <span class="required">*</span></label>
        <FormInput v-model="applyForm.phone" placeholder="请输入手机号" type="number" maxlength="11" />
      </div>

      <div class="form-item">
        <label class="form-label">邮箱</label>
        <FormInput v-model="applyForm.email" placeholder="请输入邮箱（选填）" />
      </div>

      <div class="form-item">
        <label class="form-label">可工作时间 <span class="required">*</span></label>
        <select v-model="selectedTime" class="form-select">
          <option value="">请选择可工作时间</option>
          <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
        </select>
      </div>

      <div class="form-item">
        <label class="form-label">相关经验</label>
        <textarea
          v-model="applyForm.experience"
          class="form-textarea"
          placeholder="请描述您的相关工作或实践经历（选填）"
          maxlength="300"
        ></textarea>
        <span class="char-count">{{ applyForm.experience.length }}/300</span>
      </div>

      <div class="form-item">
        <label class="form-label">申请理由 <span class="required">*</span></label>
        <textarea
          v-model="applyForm.reason"
          class="form-textarea"
          placeholder="请说明您申请该岗位的原因和优势"
          maxlength="500"
        ></textarea>
        <span class="char-count">{{ applyForm.reason.length }}/500</span>
      </div>

      <div class="form-item">
        <label class="form-label">附件上传</label>
        <div class="upload-area" @click="handleFileUpload">
          <span class="upload-icon">📎</span>
          <span class="upload-text">点击上传简历或证明材料</span>
        </div>
        <div v-if="fileList.length > 0" class="file-list">
          <div v-for="(file, index) in fileList" :key="index" class="file-item">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-remove" @click="removeFile(index)">×</span>
          </div>
        </div>
      </div>
    </Card>

    <!-- 提交按钮 -->
    <div class="submit-section">
      <button class="btn btn-primary btn-block btn-large" @click="handleSubmit" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交申请' }}
      </button>
      <p class="submit-tip">提交后可在"我的申请"中查看进度</p>
    </div>

    <Loading :loading="submitting" />
  </div>
</template>

<style lang="scss" scoped>
.apply-job-page {
  padding-bottom: 40px;
}

// 岗位摘要
.job-summary {
  margin-top: 0;
}

.summary-title {
  font-size: 14px;
  color: #999999;
  margin-bottom: 12px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.job-name {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.job-dept {
  font-size: 14px;
  color: #666666;
}

.job-salary {
  font-size: 14px;
  color: #ff6b35;
  font-weight: 500;
}

// 表单
.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
}

.form-select {
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

.form-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px 16px;
  background-color: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
  resize: vertical;
  border: none;
  
  &:focus {
    background-color: #ffffff;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
  }
  
  &::placeholder {
    color: #999999;
  }
}

.char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

// 上传区域
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: #f8f8f8;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #4A90E2;
    background-color: #f0f7ff;
  }
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #666666;
}

.file-list {
  margin-top: 12px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f8f8;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-name {
  font-size: 13px;
  color: #333333;
}

.file-remove {
  font-size: 18px;
  color: #999999;
  cursor: pointer;
  
  &:hover {
    color: #ff4d4f;
  }
}

// 提交区域
.submit-section {
  padding: 20px 16px;
  
  @media (min-width: 768px) {
    max-width: 500px;
    margin: 0 auto;
  }
}

.submit-tip {
  text-align: center;
  font-size: 12px;
  color: #999999;
  margin-top: 12px;
}
</style>
