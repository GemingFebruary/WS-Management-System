<script setup lang="ts">
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '确定要执行此操作吗？' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  danger: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel', 'update:visible'])

const onConfirm = () => emit('confirm')
const onCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

// Escape 键关闭
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') onCancel()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="confirm-overlay"
        @click.self="onCancel"
        @keydown="onKeydown"
      >
        <div class="confirm-dialog">
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button class="confirm-btn confirm-btn--cancel" @click="onCancel">
              {{ cancelText }}
            </button>
            <button
              class="confirm-btn"
              :class="danger ? 'confirm-btn--danger' : 'confirm-btn--primary'"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* 非 scoped —— 因为 Teleport 到 body，scoped 不生效 */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 550;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}
.confirm-dialog {
  background: var(--card-bg);
  border-radius: var(--radius-xl);
  width: 80%;
  max-width: 320px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}
.confirm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.confirm-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.5;
}
.confirm-actions {
  display: flex;
  gap: 12px;
}
.confirm-btn {
  flex: 1;
  height: 40px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.confirm-btn--cancel {
  background: var(--background);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.confirm-btn--cancel:hover {
  background: var(--muted);
}
.confirm-btn--primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
  color: var(--primary-foreground);
}
.confirm-btn--primary:hover {
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.35);
}
.confirm-btn--danger {
  background: var(--danger);
  color: #ffffff;
}
.confirm-btn--danger:hover {
  opacity: 0.9;
}
</style>
