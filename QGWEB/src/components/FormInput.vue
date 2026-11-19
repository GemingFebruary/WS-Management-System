<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  type?: string
  maxlength?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
  (e: 'confirm'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

const handleInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  emit('input', value)
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <div class="form-input-wrapper" :class="{ focused: isFocused, disabled }">
    <input
      ref="inputRef"
      class="form-input"
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keyup.enter="handleConfirm"
    />
  </div>
</template>

<style lang="scss" scoped>
.form-input-wrapper {
  width: 100%;
  height: 44px;
  background-color: #f8f8f8;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  
  &.focused {
    background-color: #ffffff;
    border-color: #4A90E2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
  }
  
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.form-input {
  width: 100%;
  height: 100%;
  padding: 0 16px;
  font-size: 14px;
  color: #333333;
  background: transparent;
  
  &::placeholder {
    color: #999999;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
}
</style>
