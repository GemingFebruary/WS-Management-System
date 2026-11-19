<script setup lang="ts">
defineProps({
  title: { type: String, default: '加载失败' },
  message: { type: String, default: '请检查网络后重试' },
  retryText: { type: String, default: '重试' }
})
defineEmits(['retry'])
</script>

<template>
  <div class="error-state-container">
    <svg class="error-state-icon" viewBox="0 0 1024 1024" width="48" height="48" fill="currentColor">
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
      <path d="M512 304c-114.9 0-208 93.1-208 208s93.1 208 208 208 208-93.1 208-208-93.1-208-208-208zm0 380c-94.7 0-172-77.3-172-172s77.3-172 172-172 172 77.3 172 172-77.3 172-172 172z"/>
      <path d="M512 400c-17.7 0-32 14.3-32 32v128c0 17.7 14.3 32 32 32s32-14.3 32-32V432c0-17.7-14.3-32-32-32z"/>
      <circle cx="512" cy="640" r="32"/>
    </svg>
    <h3 class="error-state-title">{{ title }}</h3>
    <p class="error-state-message">{{ message }}</p>
    <button class="flo-btn flo-btn--secondary flo-btn--sm" @click="$emit('retry')">
      {{ retryText }}
    </button>
  </div>
</template>

<style scoped>
.error-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
}
.error-state-icon {
  color: var(--danger);
  margin-bottom: 12px;
  opacity: 0.7;
}
.error-state-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.error-state-message {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}
</style>
