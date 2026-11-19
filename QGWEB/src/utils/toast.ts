import { createApp, h, ref } from 'vue'
import ToastComponent from '@/components/Toast.vue'

/**
 * Toast 程序式 API
 * 用法: showToast('操作成功', 'success')
 */
export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    setup() {
      const visible = ref(true)
      return () =>
        h(ToastComponent, {
          message,
          type,
          visible: visible.value
        })
    }
  })

  app.mount(container)

  setTimeout(() => {
    app.unmount()
    container.remove()
  }, duration)
}

export const showSuccess = (msg: string) => showToast(msg, 'success')
export const showError = (msg: string) => showToast(msg, 'error')
export const showWarning = (msg: string) => showToast(msg, 'warning')
export const showInfo = (msg: string) => showToast(msg, 'info')
