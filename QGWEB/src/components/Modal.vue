<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  showCancel: { type: Boolean, default: true },
  size: { type: String as () => 'sm' | 'md' | 'lg', default: 'md' }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

const maxWidth = computed(() => {
  switch (props.size) {
    case 'sm': return '320px'
    case 'lg': return '600px'
    default: return '400px'
  }
})

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  emit('confirm')
  close()
}

const handleCancel = () => {
  emit('cancel')
  close()
}

// Escape 键关闭
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && visible.value) handleCancel()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="qg-modal-overlay" @click.self="handleCancel">
        <div class="qg-modal-content" :style="{ maxWidth }">
          <div v-if="title" class="qg-modal-header">
            <h3 class="qg-modal-title">{{ title }}</h3>
          </div>
          <div class="qg-modal-body">
            <slot>{{ content }}</slot>
          </div>
          <slot name="footer">
            <div class="qg-modal-footer">
              <button
                v-if="showCancel"
                class="qg-modal-btn qg-modal-btn--cancel"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button class="qg-modal-btn qg-modal-btn--confirm" @click="handleConfirm">
                {{ confirmText }}
              </button>
            </div>
          </slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* 非 scoped —— Teleport 到 body 后 scoped 不生效，使用 .qg-modal- 前缀 */
.qg-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.qg-modal-content {
  width: 90%;
  background-color: var(--card-bg, #ffffff);
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  box-shadow: var(--shadow-lg, 0 4px 20px rgba(0, 0, 0, 0.12));
}

.qg-modal-header {
  padding: 20px 20px 0;
}

.qg-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333333);
  text-align: center;
}

.qg-modal-body {
  padding: 20px;
  font-size: 14px;
  color: var(--text-secondary, #666666);
  text-align: center;
  line-height: 1.6;
}

.qg-modal-footer {
  display: flex;
  border-top: 1px solid var(--border, #e8e8e8);
}

.qg-modal-btn {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 0;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.qg-modal-btn--cancel {
  background: var(--card-bg, #ffffff);
  color: var(--text-secondary, #666666);
  border-right: 1px solid var(--border, #e8e8e8);
}
.qg-modal-btn--cancel:hover {
  background: var(--muted, #f5f5f5);
}

.qg-modal-btn--confirm {
  background: linear-gradient(135deg, var(--primary, #4A90E2) 0%, var(--primary-hover, #357ABD) 100%);
  color: var(--primary-foreground, #ffffff);
}
.qg-modal-btn--confirm:hover {
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.35);
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .qg-modal-content,
.modal-leave-active .qg-modal-content {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .qg-modal-content,
.modal-leave-to .qg-modal-content {
  transform: scale(0.9);
}
</style>
