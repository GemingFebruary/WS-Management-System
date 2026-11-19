<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  message: { type: String, required: true },
  type: { type: String as () => 'success' | 'error' | 'warning' | 'info', default: 'info' },
  duration: { type: Number, default: 3000 },
  visible: { type: Boolean, default: true }
})

const show = ref(props.visible)
let timer: ReturnType<typeof setTimeout> | null = null

const startTimer = () => {
  if (timer) clearTimeout(timer)
  if (props.duration > 0) {
    timer = setTimeout(() => { show.value = false }, props.duration)
  }
}

watch(() => props.visible, (val) => {
  show.value = val
  if (val) startTimer()
}, { immediate: true })

onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div v-if="show" class="qg-toast" :class="type">
        <span class="qg-toast-icon">
          <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </span>
        <span class="qg-toast-message">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* 非 scoped —— Teleport 到 body */
.qg-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: var(--card-bg, #ffffff);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-lg, 0 4px 20px rgba(0, 0, 0, 0.15));
  z-index: 1000;
}
.qg-toast.success .qg-toast-icon { color: var(--success, #52c41a); }
.qg-toast.error .qg-toast-icon { color: var(--danger, #ff4d4f); }
.qg-toast.warning .qg-toast-icon { color: var(--warning, #faad14); }
.qg-toast.info .qg-toast-icon { color: var(--primary, #4A90E2); }

.qg-toast-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qg-toast-icon svg {
  width: 100%;
  height: 100%;
}
.qg-toast-message {
  font-size: 14px;
  color: var(--text-primary, #333333);
}

/* 过渡 */
.toast-slide-enter-active, .toast-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
