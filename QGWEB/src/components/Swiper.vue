<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  list: Array<{
    id: number | string
    imageUrl?: string
    title?: string
  }>
  autoplay?: boolean
  interval?: number
}>()

const currentIndex = ref(0)
const autoplayTimer = ref<number | null>(null)

const startAutoplay = () => {
  if (!props.autoplay || !props.list?.length) return
  
  stopAutoplay()
  autoplayTimer.value = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.list.length
  }, props.interval || 3000)
}

const stopAutoplay = () => {
  if (autoplayTimer.value) {
    clearInterval(autoplayTimer.value)
    autoplayTimer.value = null
  }
}

const goToSlide = (index: number) => {
  currentIndex.value = index
  startAutoplay()
}

// 监听props变化
import { watch, onMounted, onUnmounted } from 'vue'
watch(() => props.autoplay, (val) => {
  if (val) startAutoplay()
  else stopAutoplay()
}, { immediate: true })

onMounted(() => {
  if (props.autoplay) startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<template>
  <div class="swiper" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
    <div class="swiper-wrapper">
      <div 
        v-for="(item, index) in list" 
        :key="item.id"
        class="swiper-slide"
        :class="{ active: index === currentIndex }"
      >
        <img 
          v-if="item.imageUrl" 
          :src="item.imageUrl" 
          :alt="item.title"
          class="swiper-image"
        />
        <div v-else class="swiper-placeholder">
          <span>轮播图 {{ index + 1 }}</span>
        </div>
        <div v-if="item.title" class="swiper-title">{{ item.title }}</div>
      </div>
    </div>
    
    <!-- 指示器 -->
    <div class="swiper-indicators" v-if="list.length > 1">
      <span 
        v-for="(_, index) in list" 
        :key="index"
        class="indicator"
        :class="{ active: index === currentIndex }"
        @click="goToSlide(index)"
      ></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.swiper {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 12px;
  
  @media (min-width: 768px) {
    height: 280px;
    border-radius: 16px;
  }
}

.swiper-wrapper {
  width: 100%;
  height: 100%;
}

.swiper-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
  
  &.active {
    opacity: 1;
  }
}

.swiper-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.swiper-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
}

.swiper-title {
  position: absolute;
  bottom: 20px;
  left: 16px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (min-width: 768px) {
    font-size: 20px;
    bottom: 30px;
    left: 24px;
  }
}

.swiper-indicators {
  position: absolute;
  bottom: 12px;
  right: 16px;
  display: flex;
  gap: 8px;
  
  @media (min-width: 768px) {
    bottom: 16px;
    right: 24px;
  }
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.8);
  }
  
  &.active {
    width: 20px;
    border-radius: 4px;
    background-color: #ffffff;
  }
}
</style>
