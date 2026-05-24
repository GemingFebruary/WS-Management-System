<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader } from '@/components'
</script>

<template>
  <div class="job-manage-page page-content">
    <PageHeader title="岗位管理" :show-back="true" />
    
    <div class="placeholder">
      <p>岗位管理页面开发中...</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.job-manage-page {
  padding-bottom: 40px;
}

.placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #999999;
}
</style>
