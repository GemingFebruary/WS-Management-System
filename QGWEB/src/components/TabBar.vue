<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { path: '/home', name: '首页', icon: 'home' },
  { path: '/job-list', name: '岗位', icon: 'job' },
  { path: '/notices', name: '公告', icon: 'notice' },
  { path: '/profile', name: '我的', icon: 'profile' }
]

const currentPath = computed(() => route.path)

const navigateTo = (path: string) => {
  router.push(path)
}

// 图标SVG
const homeIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const jobIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
  <path d="M16 7V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V7" stroke="currentColor" stroke-width="2"/>
  <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" stroke-width="2"/>
  <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" stroke-width="2"/>
</svg>`

const profileIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
</svg>`

const noticeIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`

const getIcon = (icon: string) => {
  switch (icon) {
    case 'home': return homeIcon
    case 'job': return jobIcon
    case 'notice': return noticeIcon
    case 'profile': return profileIcon
    default: return ''
  }
}
</script>

<template>
  <nav class="tab-bar">
    <div 
      v-for="tab in tabs" 
      :key="tab.path"
      class="tab-item"
      :class="{ active: currentPath === tab.path }"
      @click="navigateTo(tab.path)"
    >
      <span class="tab-icon" v-html="getIcon(tab.icon)"></span>
      <span class="tab-text">{{ tab.name }}</span>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  
  // 桌面端隐藏底部导航
  @media (min-width: 768px) {
    display: none;
  }
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #999999;
  
  &:hover {
    color: #4A90E2;
  }
  
  &.active {
    color: #4A90E2;
    
    .tab-icon {
      transform: scale(1.1);
    }
  }
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  transition: transform 0.2s ease;
  
  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.tab-text {
  font-size: 12px;
  font-weight: 500;
}
</style>
