<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  loading?: boolean
}>()

const show = ref(props.loading)

onMounted(() => {
  show.value = props.loading
})

// 暴露方法
defineExpose({
  show: () => { show.value = true },
  hide: () => { show.value = false }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="loading">
      <div v-if="show" class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span class="loading-text">加载中...</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #666666;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 过渡动画
.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.2s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}
</style>
