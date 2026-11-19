<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/home')
}
</script>

<template>
  <div class="not-found-page">
    <div class="content">
      <h1 class="error-code">404</h1>
      <p class="error-text">页面不存在</p>
      <button class="btn btn-primary" @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.content {
  text-align: center;
  padding: 40px;
}

.error-code {
  font-size: 80px;
  font-weight: 700;
  color: #4A90E2;
  margin-bottom: 16px;
  
  @media (min-width: 768px) {
    font-size: 120px;
  }
}

.error-text {
  font-size: 18px;
  color: #666666;
  margin-bottom: 32px;
}
</style>
