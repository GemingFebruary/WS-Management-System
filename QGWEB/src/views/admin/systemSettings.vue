<script setup lang="ts">
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const systemInfo = [
  { label: '系统名称', value: '勤工助学岗位匹配管理系统' },
  { label: '版本号', value: 'v1.0.0' },
  { label: '前端框架', value: 'Vue 3 + TypeScript + Vite' },
  { label: '后端框架', value: 'Python Flask + 微信云开发' },
  { label: '数据库', value: '微信云数据库 (MongoDB)' },
  { label: '云环境ID', value: 'cloud1-d7g94p70f23bf5769' }
]
</script>

<template>
  <div class="settings-page page-content">
    <PageHeader title="系统设置" :show-back="true" />

    <!-- 数据管理 -->
    <Card class="settings-group">
      <h3 class="group-title">数据管理</h3>
      <div class="setting-item" @click="router.push('/admin/data-export')">
        <div class="item-left">
          <img class="item-icon" src="@/assets/img/icon/download.svg" alt="" />
          <span class="item-text">数据导出</span>
        </div>
        <span class="item-arrow">&gt;</span>
      </div>
    </Card>

    <!-- 系统信息 -->
    <Card class="settings-group">
      <h3 class="group-title">系统信息</h3>
      <div v-for="info in systemInfo" :key="info.label" class="info-row">
        <span class="info-label">{{ info.label }}</span>
        <span class="info-value">{{ info.value }}</span>
      </div>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.settings-page { padding-bottom: 40px; }
.settings-group { margin-bottom: 12px; padding: 0 !important; }
.group-title { font-size: 14px; font-weight: 600; color: #333; padding: 14px 16px 8px; }
.setting-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; cursor: pointer; transition: background 0.2s;
  &:hover { background: #fafafa; }
}
.item-left { display: flex; align-items: center; gap: 12px; }
.item-icon { width: 18px; height: 18px; }
.item-text { font-size: 14px; color: #333; }
.item-arrow { font-size: 14px; color: #999; }

.info-row { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f5f5f5; &:last-child { border-bottom: none; } }
.info-label { font-size: 13px; color: #999; }
.info-value { font-size: 13px; color: #333; }
</style>
