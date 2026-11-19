import { ref, onMounted, onUnmounted, nextTick, type Ref } from 'vue'

interface InfiniteScrollOptions {
  pageSize?: number
  threshold?: number
}

interface InfiniteScrollResult<T> {
  items: Ref<T[]>
  loading: Ref<boolean>
  hasMore: Ref<boolean>
  load: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * 无限滚动 Composable
 * 移植自 FLO 项目 useInfiniteScroll.js，转写为 TypeScript
 *
 * @param fetchFn 获取数据的函数，接收 { pageNum, pageSize }，返回 { records, total }
 * @param options pageSize: 每页条数(默认6), threshold: 触发距离(默认50px)
 */
export function useInfiniteScroll<T = any>(
  fetchFn: (params: { pageNum: number; pageSize: number }) => Promise<{ records: T[]; total: number } | null>,
  options: InfiniteScrollOptions = {}
): InfiniteScrollResult<T> {
  const { pageSize = 6, threshold = 50 } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const hasMore = ref(true)
  const pageNum = ref(1)

  const load = async () => {
    if (loading.value || !hasMore.value) return
    loading.value = true
    try {
      const result = await fetchFn({ pageNum: pageNum.value, pageSize })
      if (result && result.records) {
        items.value = [...items.value, ...result.records]
        hasMore.value = items.value.length < result.total
        pageNum.value++
      } else {
        hasMore.value = false
      }
    } catch (err) {
      console.error('[useInfiniteScroll] 加载失败:', err)
    } finally {
      loading.value = false
    }
  }

  const refresh = async () => {
    pageNum.value = 1
    items.value = []
    hasMore.value = true
    loading.value = true
    try {
      const result = await fetchFn({ pageNum: 1, pageSize })
      if (result && result.records) {
        items.value = result.records
        hasMore.value = items.value.length < result.total
        pageNum.value = 2
      } else {
        hasMore.value = false
      }
    } catch (err) {
      console.error('[useInfiniteScroll] 刷新失败:', err)
    } finally {
      loading.value = false
    }
  }

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const clientHeight = window.innerHeight
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      load()
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    // 初次加载
    load().then(() => {
      nextTick(() => {
        // 如果内容不足以填满页面，自动加载下一页
        if (document.documentElement.scrollHeight <= window.innerHeight && hasMore.value) {
          load()
        }
      })
    })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return { items, loading, hasMore, load, refresh }
}
