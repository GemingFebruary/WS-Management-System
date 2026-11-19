<script setup lang="ts">
defineProps<{
  padding?: string
  shadow?: boolean
  radius?: string
}>()
</script>

<template>
  <div 
    class="card" 
    :style="{ 
      padding: padding || '16px',
      borderRadius: radius || '12px',
      boxShadow: shadow ? '0 2px 12px rgba(0, 0, 0, 0.08)' : 'none'
    }"
  >
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.card {
  background-color: #ffffff;
  margin: 12px;
  
  @media (min-width: 768px) {
    margin: 16px;
    padding: 20px;
    border-radius: 16px;
  }
}
</style>
