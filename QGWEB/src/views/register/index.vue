<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, FormInput, PasswordInput, Loading } from '@/components'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const studentInfo = ref({
  studentId: '',
  name: '',
  gender: '男',
  college: '',
  major: '',
  grade: '',
  phone: '',
  email: '',
  familyType: '一般',
  familyDesc: ''
})

const password = ref('')
const confirmPassword = ref('')

// 选项数据
const genderList = ['男', '女']
const genderIndex = ref(0)
const gradeList = ['2023级', '2024级', '2025级', '2026级']
const gradeIndex = ref(0)
const familyTypeList = ['困难', '特别困难', '一般']
const familyTypeIndex = ref(2)

// 状态
const loading = ref(false)
const errorMessage = ref('')

// 性别选择
const onGenderChange = (index: number) => {
  genderIndex.value = index
  studentInfo.value.gender = genderList[index]
}

// 年级选择
const onGradeChange = (index: number) => {
  gradeIndex.value = index
  studentInfo.value.grade = gradeList[index]
}

// 家庭类型选择
const onFamilyTypeChange = (index: number) => {
  familyTypeIndex.value = index
  studentInfo.value.familyType = familyTypeList[index]
}

// 处理注册
const handleRegister = async () => {
  // 表单验证
  if (!studentInfo.value.studentId) {
    errorMessage.value = '请输入学号'
    return
  }
  if (!studentInfo.value.name) {
    errorMessage.value = '请输入姓名'
    return
  }
  if (!studentInfo.value.college) {
    errorMessage.value = '请输入学院'
    return
  }
  if (!studentInfo.value.major) {
    errorMessage.value = '请输入专业'
    return
  }
  if (!studentInfo.value.grade) {
    errorMessage.value = '请选择年级'
    return
  }
  if (!studentInfo.value.phone) {
    errorMessage.value = '请输入手机号'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(studentInfo.value.phone)) {
    errorMessage.value = '手机号格式不正确'
    return
  }
  if (!password.value) {
    errorMessage.value = '请设置密码'
    return
  }
  if (password.value.length < 6 || password.value.length > 20) {
    errorMessage.value = '密码长度为6-20位'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const res = await userStore.register({
      ...studentInfo.value,
      password: password.value
    })
    
    if (res.code === 200) {
      alert('注册成功，请登录')
      router.push('/login')
    } else {
      errorMessage.value = res.message || '注册失败'
    }
  } catch (error: any) {
    errorMessage.value = error.message || '注册失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
    <!-- 桌面端顶部导航 -->
    <header class="desktop-header hide-mobile">
      <div class="header-content">
        <router-link to="/home" class="logo">勤工助学岗位匹配系统</router-link>
        <div class="header-actions">
          <span class="tip">已有账号？</span>
          <button class="btn btn-secondary btn-small" @click="goToLogin">立即登录</button>
        </div>
      </div>
    </header>

    <div class="register-container">
      <!-- 头部 -->
      <div class="register-header">
        <h1 class="page-title">用户注册</h1>
        <p class="page-subtitle">请填写您的个人信息</p>
      </div>

      <!-- 注册表单 -->
      <Card class="register-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          
          <div class="form-item">
            <label class="form-label">学号 <span class="required">*</span></label>
            <FormInput v-model="studentInfo.studentId" placeholder="请输入学号" />
          </div>

          <div class="form-item">
            <label class="form-label">姓名 <span class="required">*</span></label>
            <FormInput v-model="studentInfo.name" placeholder="请输入姓名" />
          </div>

          <div class="form-item">
            <label class="form-label">性别</label>
            <div class="select-options">
              <div
                v-for="(item, index) in genderList"
                :key="item"
                class="select-option"
                :class="{ active: genderIndex === index }"
                @click="onGenderChange(index)"
              >
                {{ item }}
              </div>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">学院 <span class="required">*</span></label>
            <FormInput v-model="studentInfo.college" placeholder="请输入所在学院" />
          </div>

          <div class="form-item">
            <label class="form-label">专业 <span class="required">*</span></label>
            <FormInput v-model="studentInfo.major" placeholder="请输入专业" />
          </div>

          <div class="form-item">
            <label class="form-label">年级 <span class="required">*</span></label>
            <div class="select-options">
              <div
                v-for="(item, index) in gradeList"
                :key="item"
                class="select-option"
                :class="{ active: gradeIndex === index }"
                @click="onGradeChange(index)"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <!-- 联系信息 -->
        <div class="form-section">
          <h3 class="section-title">联系信息</h3>
          
          <div class="form-item">
            <label class="form-label">手机号 <span class="required">*</span></label>
            <FormInput v-model="studentInfo.phone" placeholder="请输入手机号" type="number" maxlength="11" />
          </div>

          <div class="form-item">
            <label class="form-label">邮箱</label>
            <FormInput v-model="studentInfo.email" placeholder="请输入邮箱（选填）" />
          </div>
        </div>

        <!-- 家庭情况 -->
        <div class="form-section">
          <h3 class="section-title">家庭情况</h3>
          
          <div class="form-item">
            <label class="form-label">家庭类型</label>
            <div class="select-options">
              <div
                v-for="(item, index) in familyTypeList"
                :key="item"
                class="select-option"
                :class="{ active: familyTypeIndex === index }"
                @click="onFamilyTypeChange(index)"
              >
                {{ item }}
              </div>
            </div>
          </div>

          <div class="form-item">
            <label class="form-label">家庭经济情况说明</label>
            <textarea
              v-model="studentInfo.familyDesc"
              class="form-textarea"
              placeholder="请简要说明家庭经济情况（选填）"
              maxlength="200"
            ></textarea>
          </div>
        </div>

        <!-- 账户信息 -->
        <div class="form-section">
          <h3 class="section-title">账户信息</h3>
          
          <div class="form-item">
            <label class="form-label">密码 <span class="required">*</span></label>
            <PasswordInput v-model="password" placeholder="请设置密码（6-20位）" />
          </div>

          <div class="form-item">
            <label class="form-label">确认密码 <span class="required">*</span></label>
            <PasswordInput v-model="confirmPassword" placeholder="请再次输入密码" />
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 注册按钮 -->
        <button class="btn btn-primary btn-block btn-large register-btn" @click="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>

        <!-- 底部链接 -->
        <div class="register-footer">
          <span class="login-link" @click="goToLogin">已有账号？立即登录</span>
        </div>
      </Card>
    </div>

    <Loading :loading="loading" />
  </div>
</template>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

// 桌面端顶部导航
.desktop-header {
  background-color: #4A90E2;
  padding: 0 24px;
  
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
    color: #ffffff;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .tip {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.register-container {
  padding: 20px 16px 40px;
  max-width: 500px;
  margin: 0 auto;
  
  @media (min-width: 768px) {
    padding: 40px 24px;
    max-width: 600px;
  }
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #666666;
}

.register-form {
  padding: 20px;
  
  @media (min-width: 768px) {
    padding: 32px;
  }
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-of-type {
    border-bottom: none;
    margin-bottom: 16px;
    padding-bottom: 0;
  }
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
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
  margin-left: 2px;
}

.select-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.select-option {
  padding: 10px 16px;
  background-color: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &.active {
    background-color: #e6f7ff;
    color: #4A90E2;
    border-color: #4A90E2;
  }
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  background-color: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
  color: #333333;
  resize: vertical;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  
  &:focus {
    background-color: #ffffff;
    border-color: #4A90E2;
  }
  
  &::placeholder {
    color: #999999;
  }
}

.error-message {
  padding: 12px;
  background-color: #fff2f0;
  border-radius: 8px;
  font-size: 13px;
  color: #ff4d4f;
  margin-bottom: 16px;
}

.register-btn {
  margin-top: 8px;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
}

.login-link {
  font-size: 13px;
  color: #4A90E2;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}
</style>
