<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/Card.vue'
import Loading from '@/components/Loading.vue'
import Modal from '@/components/Modal.vue'
import { adminApi } from '@/api/admin'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/date'

const router = useRouter()
const userStore = useUserStore()

// 退出确认
const showLogoutModal = ref(false)
const handleLogout = () => { showLogoutModal.value = true }
const confirmLogout = () => { userStore.logout(); showLogoutModal.value = false }

interface Notice {
  _id: string
  title: string
  content: string
  date: string
  publisher: string
}

const noticeList = ref<Notice[]>([])
const loading = ref(false)
const showDetail = ref(false)
const selected = ref<Notice | null>(null)

const loadNotices = async () => {
  loading.value = true
  try {
    const res = await adminApi.getNotices()
    if (res.code === 200) {
      const d = res.data as any
      const raw = Array.isArray(d) ? d : (d?.list || [])
      noticeList.value = raw.map((n: any) => ({
        _id: n._id || '',
        title: n.title || '无标题',
        content: n.content || '',
        date: formatDate(n.publishDate),
        publisher: n.publisher || ''
      }))
    }
  } catch (err) {
    console.error('加载公告失败:', err)
  } finally {
    loading.value = false
  }
}

const openDetail = (notice: Notice) => { selected.value = notice; showDetail.value = true }

onMounted(() => loadNotices())
</script>

<template>
  <div class="notices-page page-content">
    <!-- 移动端顶部导航 -->
    <header class="mobile-header hide-desktop">
      <span class="mobile-header-title">全部公告</span>
    </header>

    <!-- 桌面端顶部导航 -->
    <header class="desktop-header hide-mobile">
      <div class="header-content">
        <router-link to="/home" class="logo">
          <img src="@/assets/QG.png" alt="" class="logo-img" />
          <span class="logo-text">勤工助学岗位匹配系统</span>
        </router-link>
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item" active-class="active" exact>首页</router-link>
          <router-link to="/job-list" class="nav-item" active-class="active">岗位列表</router-link>
          <router-link to="/notices" class="nav-item" active-class="active">全部公告</router-link>
          <router-link to="/profile" class="nav-item" active-class="active">个人中心</router-link>
        </nav>
        <div class="header-right">
          <template v-if="userStore.isLoggedIn">
            <span class="header-user">{{ userStore.userInfo?.name }}</span>
            <button class="header-btn" @click="handleLogout">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="header-btn">登录</router-link>
          </template>
        </div>
      </div>
    </header>

    <div class="notice-list">
      <Card v-for="n in noticeList" :key="n._id" class="notice-card" @click="openDetail(n)">
        <div class="notice-top">
          <span class="notice-title">{{ n.title }}</span>
          <span class="notice-date">{{ n.date }}</span>
        </div>
        <div class="notice-preview">{{ n.content }}</div>
        <div class="notice-meta" v-if="n.publisher">发布者: {{ n.publisher }}</div>
      </Card>

      <div v-if="noticeList.length === 0 && !loading" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="empty-text">暂无公告</span>
      </div>
    </div>

    <!-- 公告详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ selected?.title }}</h3>
            <span class="modal-close" @click="showDetail = false">✕</span>
          </div>
          <div class="modal-body">
            <p class="detail-content">{{ selected?.content }}</p>
            <div class="detail-meta">{{ selected?.date }} · {{ selected?.publisher }}</div>
          </div>
          <div class="modal-footer"><button class="btn-close" @click="showDetail = false">关闭</button></div>
        </div>
      </div>
    </Teleport>

    <Loading :loading="loading && noticeList.length === 0" />

    <!-- 退出确认弹窗 -->
    <Modal
      v-model="showLogoutModal"
      title="提示"
      content="确定要退出登录吗？"
      :show-cancel="true"
      @confirm="confirmLogout"
    />
  </div>
</template>

<style lang="scss" scoped>
.notices-page { padding-bottom: 80px; @media (min-width: 768px) { padding-bottom: 40px; } }

// 桌面端导航
.desktop-header {
  background-color: #4A90E2; color: #fff; position: sticky; top: 0; z-index: 100;
  .header-content { width: 100%; height: 56px; padding: 0 48px; display: flex; align-items: center; justify-content: space-between; }
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .logo-img { width: 32px; height: 32px; border-radius: 6px; }
  .logo-text { font-size: 18px; font-weight: 600; color: #ffffff; }
  .nav-menu { display: flex; gap: 8px; margin: 0 auto; padding: 0 32px; }
  .nav-item { color: rgba(255,255,255,0.75); font-size: 14px; text-decoration: none; padding: 6px 16px; border-radius: 6px; transition: all 0.2s; white-space: nowrap; &:hover { color: #fff; background: rgba(255,255,255,0.1); } &.active { color: #fff; background: rgba(255,255,255,0.18); font-weight: 500; } }
  .header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .header-user { font-size: 13px; color: rgba(255, 255, 255, 0.85); }
  .header-btn { font-size: 13px; color: #ffffff; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px; padding: 4px 14px; cursor: pointer; text-decoration: none; transition: all 0.2s; &:hover { background: rgba(255, 255, 255, 0.25); } }
}

.notice-list { margin-top: 10px; }
.notice-card { margin-bottom: 8px; cursor: pointer; transition: all 0.15s; &:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); } }
.notice-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.notice-title { font-size: 15px; font-weight: 600; color: #333; flex: 1; }
.notice-date { font-size: 12px; color: #999; white-space: nowrap; margin-left: 12px; }
.notice-preview { font-size: 13px; color: #666; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 6px; }
.notice-meta { font-size: 12px; color: #999; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #999; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 90%; max-width: 500px; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; h3 { font-size: 16px; font-weight: 600; } .modal-close { font-size: 18px; color: #999; cursor: pointer; } }
.modal-body { padding: 16px 20px; }
.detail-content { font-size: 14px; color: #333; line-height: 1.8; margin-bottom: 12px; }
.detail-meta { font-size: 12px; color: #999; }
.modal-footer { display: flex; justify-content: flex-end; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.btn-close { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; cursor: pointer; }
</style>
