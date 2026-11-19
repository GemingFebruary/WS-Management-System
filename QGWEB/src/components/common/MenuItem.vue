<script setup lang="ts">
defineProps({
  icon: { type: String, default: '' },
  iconBg: { type: String, default: 'var(--primary-light)' },
  iconColor: { type: String, default: 'var(--primary)' },
  label: { type: String, required: true },
  labelColor: { type: String, default: 'var(--text-primary)' },
  to: { type: String, default: '' }
})
defineEmits(['click'])

const ArrowSvg = `<svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M686.1 350.5L346.2 4.8C306.8-4.3 264.3 13.5 244 50.2c-5.1 9.2-7.7 19.4-7.7 29.6v909.8c0 10.2 2.6 20.4 7.7 29.6 20.3 36.7 62.8 54.5 102.2 45.4l339.9-345.7c32.4-32.9 32.4-85.4 0-118.4z"/></svg>`
</script>

<template>
  <router-link v-if="to" :to="to" class="flo-menu-item" @click="$emit('click')">
    <div class="menu-item-left">
      <span v-if="icon" class="menu-item-icon" :style="{ background: iconBg, color: iconColor }" v-html="icon"></span>
      <span class="menu-item-label" :style="{ color: labelColor }">{{ label }}</span>
    </div>
    <div class="menu-item-right">
      <slot name="right"></slot>
      <span class="menu-item-arrow" v-html="ArrowSvg"></span>
    </div>
  </router-link>
  <div v-else class="flo-menu-item" @click="$emit('click')">
    <div class="menu-item-left">
      <span v-if="icon" class="menu-item-icon" :style="{ background: iconBg, color: iconColor }" v-html="icon"></span>
      <span class="menu-item-label" :style="{ color: labelColor }">{{ label }}</span>
    </div>
    <div class="menu-item-right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style scoped>
.menu-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-item-icon {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.menu-item-icon :deep(svg) {
  width: 18px;
  height: 18px;
}
.menu-item-label {
  font-size: 15px;
  font-weight: 500;
}
.menu-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.menu-item-arrow {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}
</style>
