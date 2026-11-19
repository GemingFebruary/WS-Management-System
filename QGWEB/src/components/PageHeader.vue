<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const props = defineProps<{
  title?: string
  showBack?: boolean
  backUrl?: string
  rightText?: string
}>()

const emit = defineEmits<{
  (e: 'click-right'): void
}>()

const router = useRouter()

const handleBack = () => {
  if (props.backUrl) {
    router.push(props.backUrl)
  } else {
    router.back()
  }
}

const handleRightClick = () => {
  emit('click-right')
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <button v-if="showBack" class="back-btn" @click="handleBack">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    
    <h1 class="header-title">{{ title }}</h1>
    
    <div class="header-right">
      <button v-if="rightText" class="right-btn" @click="handleRightClick">
        {{ rightText }}
      </button>
      <slot name="right"></slot>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #4A90E2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 50;
  
  @media (min-width: 768px) {
    height: 64px;
    padding: 0 24px;
  }
}

.header-left,
.header-right {
  width: 60px;
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (min-width: 768px) {
    font-size: 20px;
  }
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
}

.right-btn {
  font-size: 14px;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
