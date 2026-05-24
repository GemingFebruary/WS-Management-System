<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue?: boolean
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
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
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
        <div class="modal-content">
          <div v-if="title" class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
          </div>
          <div class="modal-body">
            <slot>{{ content }}</slot>
          </div>
          <div class="modal-footer">
            <button 
              v-if="showCancel" 
              class="btn btn-secondary" 
              @click="handleCancel"
            >
              {{ cancelText || '取消' }}
            </button>
            <button class="btn btn-primary" @click="handleConfirm">
              {{ confirmText || '确定' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal-overlay {
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

.modal-content {
  width: 90%;
  max-width: 400px;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  padding: 20px 20px 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  text-align: center;
}

.modal-body {
  padding: 20px;
  font-size: 14px;
  color: #666666;
  text-align: center;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
  
  .btn {
    flex: 1;
    height: 48px;
    border-radius: 0;
    font-size: 16px;
    
    &:first-child {
      border-right: 1px solid #f0f0f0;
    }
  }
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
  
  .modal-content {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .modal-content {
    transform: scale(0.9);
  }
}
</style>
