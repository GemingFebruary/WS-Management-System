<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  loading?: boolean
  text?: string
}>()

const show = ref(props.loading ?? false)

// 监听 prop 变化
watch(() => props.loading, (val) => {
  show.value = val ?? false
})

// 暴露方法
defineExpose({
  show: () => { show.value = true },
  hide: () => { show.value = false }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="qg-loading">
      <div v-if="show" class="qg-loading-overlay">
        <div class="qg-loading-spinner">
          <div class="qg-loading-circle"></div>
          <span class="qg-loading-text">{{ text || '加载中...' }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<!--
  不使用 scoped —— Teleport 到 body 后 scoped 的 data-v 属性不会传递，
  导致所有 scoped 样式失效，文字随 spinner 旋转。
  改用 .qg-loading 前缀避免全局命名冲突。
-->
<style lang="scss">
.qg-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}

.qg-loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qg-loading-circle {
  width: 36px;
  height: 36px;
  border: 3px solid #e8e8e8;
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: qg-spin 0.8s linear infinite;
}

.qg-loading-text {
  font-size: 14px;
  color: #666666;
  transform: none !important;
  animation: none !important;
}

@keyframes qg-spin {
  to {
    transform: rotate(360deg);
  }
}

// 过渡动画
.qg-loading-enter-active,
.qg-loading-leave-active {
  transition: opacity 0.2s ease;
}

.qg-loading-enter-from,
.qg-loading-leave-to {
  opacity: 0;
}
</style>
