<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader } from '@/components'
</script>

<template>
  <div class="application-review-page page-content">
    <PageHeader title="申请审核" :show-back="true" />
    
    <div class="placeholder">
      <p>申请审核页面开发中...</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.application-review-page {
  padding-bottom: 40px;
}

.placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #999999;
}
</style>
