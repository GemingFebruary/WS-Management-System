<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Card from '@/components/Card.vue'
import FormInput from '@/components/FormInput.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import Loading from '@/components/Loading.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单数据
const account = ref('')
const password = ref('')
const userRole = ref<'student' | 'admin'>('student')

// 状态
const loading = ref(false)
const errorMessage = ref('')

// 选择角色
const selectRole = (role: 'student' | 'admin') => {
  userRole.value = role
}

// 处理登录
const handleLogin = async () => {
  // 表单验证
  if (!account.value) {
    errorMessage.value = '请输入账号'
    return
  }
  if (!password.value) {
    errorMessage.value = '请输入密码'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const res = await userStore.login(account.value, password.value, userRole.value)
    
    if (res.code === 200) {
      // 登录成功，跳转到之前的页面或首页
      const redirect = route.query.redirect as string
      router.push(redirect || '/home')
    } else {
      errorMessage.value = res.message || '登录失败'
    }
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

// 跳转到注册页
const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-page">
    <!-- 桌面端顶部导航 -->
    <header class="desktop-header hide-mobile">
      <div class="header-content">
        <router-link to="/home" class="logo">勤工助学岗位匹配系统</router-link>
        <div class="header-actions">
          <span class="tip">还没有账号？</span>
          <button class="btn btn-secondary btn-small" @click="goToRegister">立即注册</button>
        </div>
      </div>
    </header>

    <div class="login-container">
      <!-- 头部 -->
      <div class="login-header">
        <h1 class="app-title">勤工助学岗位匹配系统</h1>
        <p class="app-subtitle">让工作学习更轻松</p>
      </div>

      <!-- 登录表单 -->
      <Card class="login-form">
        <!-- 账号输入 -->
        <div class="form-item">
          <label class="form-label">
            <img class="label-icon" src="@/assets/img/icon/user.svg" alt="" />
            <span>账号</span>
          </label>
          <FormInput
            v-model="account"
            placeholder="请输入学号/工号"
            @confirm="handleLogin"
          />
        </div>

        <!-- 密码输入 -->
        <div class="form-item">
          <label class="form-label">
            <img class="label-icon" src="@/assets/img/icon/lock.svg" alt="" />
            <span>密码</span>
          </label>
          <PasswordInput
            v-model="password"
            placeholder="请输入密码"
          />
        </div>

        <!-- 角色选择 -->
        <div class="form-item role-select">
          <label class="form-label">
            <img class="label-icon" src="@/assets/img/icon/target.svg" alt="" />
            <span>角色</span>
          </label>
          <div class="role-options">
            <div
              class="role-option"
              :class="{ active: userRole === 'student' }"
              @click="selectRole('student')"
            >
              学生
            </div>
            <div
              class="role-option"
              :class="{ active: userRole === 'admin' }"
              @click="selectRole('admin')"
            >
              管理员
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 登录按钮 -->
        <button class="btn btn-primary btn-block btn-large login-btn" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <!-- 底部链接 -->
        <div class="login-footer">
          <span class="register-link" @click="goToRegister">还没有账号？立即注册</span>
        </div>
      </Card>
    </div>

    <Loading :loading="loading" />
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #4A90E2 0%, #f5f5f5 40%);
}

// 桌面端顶部导航
.desktop-header {
  background-color: transparent;
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

.login-container {
  padding: 60px 16px 40px;
  max-width: 400px;
  margin: 0 auto;
  
  @media (min-width: 768px) {
    padding-top: 80px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.app-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
  
  @media (min-width: 768px) {
    font-size: 28px;
  }
}

.app-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.login-form {
  padding: 24px;
  
  @media (min-width: 768px) {
    padding: 32px;
  }
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333333;
}

.label-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.role-select {
  margin-top: 24px;
}

.role-options {
  display: flex;
  gap: 12px;
}

.role-option {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.error-message {
  padding: 12px;
  background-color: #fff2f0;
  border-radius: 8px;
  font-size: 13px;
  color: #ff4d4f;
  margin-bottom: 16px;
}

.login-btn {
  margin-top: 24px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.register-link {
  font-size: 13px;
  color: #4A90E2;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}
</style>
