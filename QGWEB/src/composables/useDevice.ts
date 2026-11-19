import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 响应式设备检测 Composable
 * 移植自 FLO 项目 useDevice.js，转写为 TypeScript
 */
export function useDevice() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const screenWidth = ref(0)

  const update = () => {
    screenWidth.value = window.innerWidth
    isMobile.value = screenWidth.value < 768
    isTablet.value = screenWidth.value >= 768 && screenWidth.value < 1024
    isDesktop.value = screenWidth.value >= 1024
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isMobile, isTablet, isDesktop, screenWidth }
}
