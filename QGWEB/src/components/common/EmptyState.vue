<script setup lang="ts">
defineProps({
  icon: { type: String, default: '' },
  text: { type: String, default: '暂无数据' },
  actionText: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<template>
  <div class="empty-state-container">
    <div v-if="icon" class="empty-state-icon" v-html="icon"></div>
    <svg v-else class="empty-state-icon" viewBox="0 0 1024 1024" width="48" height="48" fill="currentColor">
      <path d="M854.6 289.1c-17.5-38.3-43-70.5-75.5-95.2C739.4 159.3 682.3 140 620 140c-62.3 0-119.4 19.3-159.1 53.9-32.5 24.7-58 56.9-75.5 95.2-18.3 39.9-27.6 82.8-27.6 127.3 0 44.5 9.3 87.4 27.6 127.3 17.5 38.3 43 70.5 75.5 95.2 39.7 34.6 96.8 53.9 159.1 53.9 62.3 0 119.4-19.3 159.1-53.9 32.5-24.7 58-56.9 75.5-95.2 18.3-39.9 27.6-82.8 27.6-127.3 0-44.5-9.3-87.4-27.6-127.3zM620 760c-115.9 0-210-94.1-210-210s94.1-210 210-210 210 94.1 210 210-94.1 210-210 210z"/>
      <path d="M620 400c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50zm-140 0c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50zm280 0c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50z"/>
    </svg>
    <p class="empty-state-text">{{ text }}</p>
    <button v-if="actionText" class="flo-btn flo-btn--primary flo-btn--sm" @click="$emit('action')">
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
}
.empty-state-icon {
  color: var(--text-muted);
  margin-bottom: 12px;
  opacity: 0.6;
}
.empty-state-text {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 16px;
}
</style>
