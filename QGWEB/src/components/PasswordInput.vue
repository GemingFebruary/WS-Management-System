<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  maxlength?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const showPassword = ref(false)
const inputType = computed(() => showPassword.value ? 'text' : 'password')

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="password-input-wrapper">
    <input
      class="password-input"
      :type="inputType"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button class="toggle-btn" type="button" @click="togglePassword">
      <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.password-input-wrapper {
  position: relative;
  width: 100%;
  height: 44px;
  background-color: #f8f8f8;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:focus-within {
    background-color: #ffffff;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
  }
}

.password-input {
  width: 100%;
  height: 100%;
  padding: 0 44px 0 16px;
  font-size: 14px;
  color: #333333;
  background: transparent;
  
  &::placeholder {
    color: #999999;
  }
}

.toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  color: #999999;
  transition: color 0.2s ease;
  
  &:hover {
    color: #4A90E2;
  }
  
  svg {
    width: 100%;
    height: 100%;
  }
}
</style>
