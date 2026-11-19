<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, required: true },
  size: { type: [Number, String], default: 20 }
})

const iconHtml = computed(() => {
  if (!props.icon) return ''
  const s = typeof props.size === 'number' ? `${props.size}` : props.size
  // 替换外层 svg 标签，注入统一的 width/height/fill
  return props.icon
    .replace(/<svg([^>]*)>/, (_, attrs) => {
      // 去掉原始的 width/height/class
      let clean = attrs
        .replace(/\s*width="[^"]*"/, '')
        .replace(/\s*height="[^"]*"/, '')
        .replace(/\s*class="[^"]*"/, '')
      return `<svg${clean} width="${s}" height="${s}" fill="currentColor">`
    })
    .replace(/fill="(?!currentColor)[^"]*"/g, 'fill="currentColor"')
})
</script>

<template>
  <span class="app-icon-wrapper" :style="{ width: typeof size === 'number' ? size + 'px' : size, height: typeof size === 'number' ? size + 'px' : size }">
    <span v-html="iconHtml"></span>
  </span>
</template>

<style scoped>
.app-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}
.app-icon-wrapper :deep(svg) {
  display: block;
}
</style>
