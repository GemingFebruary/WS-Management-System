<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/Card.vue'
import Modal from '@/components/Modal.vue'
import { useUserStore } from '@/stores/user'
import { applicationsApi } from '@/api/applications'
import { salaryApi } from '@/api/salary'
import { authApi } from '@/api/auth'
import { adminApi } from '@/api/admin'
import { formatDate } from '@/utils/date'

const router = useRouter()
const userStore = useUserStore()

// 用户统计数据
const applyCount = ref(0)
const successCount = ref(0)
const totalSalary = ref(0)

// 退出确认弹窗
const showLogoutModal = ref(false)

// 公告查看弹窗
const showNoticeModal = ref(false)
const noticeList = ref<any[]>([])
const noticeLoading = ref(false)
const showNoticeDetail = ref(false)
const selectedNotice = ref<any>(null)

const loadNotices = async () => {
  noticeLoading.value = true
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
    noticeLoading.value = false
  }
}

const openNoticeList = () => { showNoticeModal.value = true; loadNotices() }
const openNoticeItem = (notice: any) => { selectedNotice.value = notice; showNoticeDetail.value = true }

// 编辑资料弹窗
const showEditModal = ref(false)
const editForm = ref({ phone: '', email: '', freeTime: '', skills: '' })
const editLoading = ref(false)

// 修改密码弹窗
const showPwdModal = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdLoading = ref(false)

// 是否登录
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 是否是管理员
const isAdmin = computed(() => userStore.userRole === 'admin')

// 加载用户统计
const loadUserStats = async () => {
  try {
    const appRes = await applicationsApi.getMyApplications({ pageNum: 1, pageSize: 100 })
    if (appRes.code === 200) {
      const apps = appRes.data?.list || []
      applyCount.value = appRes.data?.total || apps.length
      successCount.value = apps.filter((a: any) => a.status === 'approved').length
    }
    const salaryRes = await salaryApi.querySalary()
    if (salaryRes.code === 200) {
      totalSalary.value = salaryRes.data?.totalSalary || 0
    }
  } catch (err) {
    console.error('加载用户统计失败:', err)
  }
}

// 导航方法
const goToLogin = () => router.push('/login')
const goToMyApplications = () => { if (!isLoggedIn.value) { router.push('/login'); return } router.push('/my-applications') }
const goToSalaryQuery = () => { if (!isLoggedIn.value) { router.push('/login'); return } router.push('/salary-query') }
const goToJobList = () => router.push('/job-list')
const goToAdmin = () => router.push('/admin')

// 编辑资料
const openEditProfile = () => {
  editForm.value = {
    phone: userInfo.value?.phone || '',
    email: userInfo.value?.email || '',
    freeTime: userInfo.value?.freeTime || '',
    skills: userInfo.value?.skills || ''
  }
  showEditModal.value = true
}

const saveProfile = async () => {
  editLoading.value = true
  try {
    const res = await authApi.updateProfile(editForm.value)
    if (res.code === 200) {
      // 更新本地存储的用户信息
      try {
        const stored = JSON.parse(localStorage.getItem('userInfo') || '{}')
        Object.assign(stored, editForm.value)
        localStorage.setItem('userInfo', JSON.stringify(stored))
      } catch {}
      userStore.updateUserInfo?.(editForm.value)
      showEditModal.value = false
      alert('资料更新成功')
    }
  } catch (err) {
    console.error('更新资料失败:', err)
    alert('更新失败，请重试')
  } finally {
    editLoading.value = false
  }
}

// 修改密码
const openChangePwd = () => {
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  showPwdModal.value = true
}

const savePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  if (!oldPassword || !newPassword) { alert('请填写完整'); return }
  if (newPassword !== confirmPassword) { alert('两次密码不一致'); return }
  if (newPassword.length < 6) { alert('新密码至少6位'); return }
  pwdLoading.value = true
  try {
    const res = await authApi.changePassword({ oldPassword, newPassword })
    if (res.code === 200) {
      showPwdModal.value = false
      alert('密码修改成功，请重新登录')
      userStore.logout()
    } else {
      alert(res.message || '修改失败')
    }
  } catch (err) {
    console.error('修改密码失败:', err)
    alert('修改失败，请重试')
  } finally {
    pwdLoading.value = false
  }
}

const contactUs = () => {
  alert('勤工助学管理中心\n电话：010-12345678\n邮箱：qgzx@university.edu.cn')
}

const handleLogout = () => { showLogoutModal.value = true }
const confirmLogout = () => { userStore.logout(); showLogoutModal.value = false }

onMounted(() => { if (isLoggedIn.value) loadUserStats() })
</script>

<template>
  <div class="profile-page page-content">
    <!-- 移动端顶部导航 -->
    <header class="mobile-header hide-desktop">
      <span class="mobile-header-title">个人中心</span>
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

    <!-- 用户信息卡片 -->
    <Card class="user-card">
      <div class="user-header">
        <div class="user-avatar">
          <span v-if="userInfo?.name">{{ userInfo.name.charAt(0) }}</span>
          <span v-else>?</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ userInfo?.name || '未登录' }}</span>
          <span class="user-detail">{{ userInfo?.studentId || '' }}</span>
          <span class="user-detail">{{ userInfo?.major || '' }} {{ userInfo?.grade || '' }}</span>
        </div>
      </div>
      
      <div v-if="isLoggedIn" class="user-stats">
        <div class="stat-item">
          <span class="stat-value">{{ applyCount }}</span>
          <span class="stat-label">申请次数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ successCount }}</span>
          <span class="stat-label">成功上岗</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">¥{{ totalSalary }}</span>
          <span class="stat-label">累计薪资</span>
        </div>
      </div>
      
      <button v-if="!isLoggedIn" class="btn btn-primary btn-block login-action" @click="goToLogin">
        立即登录
      </button>
    </Card>

    <!-- 功能菜单 -->
    <div v-if="isLoggedIn" class="menu-section">
      <Card class="menu-group">
        <div class="menu-item" @click="openNoticeList">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/document.svg" alt="" />
            <span class="menu-text">查看公告</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="goToMyApplications">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/edit-pen.svg" alt="" />
            <span class="menu-text">我的申请</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="goToJobList">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/document.svg" alt="" />
            <span class="menu-text">岗位列表</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
        <div class="menu-item" @click="goToSalaryQuery">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/money.svg" alt="" />
            <span class="menu-text">薪资查询</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <Card class="menu-group">
        <div class="menu-item" @click="openEditProfile">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/edit-pen.svg" alt="" />
            <span class="menu-text">编辑资料</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>

        <div class="menu-item" @click="contactUs">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/phone.svg" alt="" />
            <span class="menu-text">联系我们</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <!-- 管理员入口 -->
      <Card v-if="isAdmin" class="menu-group">
        <div class="menu-item admin-entry" @click="goToAdmin">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/setting.svg" alt="" />
            <span class="menu-text">管理后台</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>

      <Card class="menu-group">
        <div class="menu-item" @click="handleLogout">
          <div class="menu-left">
            <img class="menu-icon" src="@/assets/img/icon/switch-button.svg" alt="" />
            <span class="menu-text text-danger">退出登录</span>
          </div>
          <span class="menu-arrow">&gt;</span>
        </div>
      </Card>
    </div>

    <!-- 未登录提示 -->
    <Card v-if="!isLoggedIn" class="login-tip">
      <p class="tip-text">登录后可以享受更多服务</p>
      <p class="tip-text">查看岗位、提交申请、查询薪资</p>
    </Card>

    <!-- 退出确认弹窗 -->
    <Modal
      v-model="showLogoutModal"
      title="提示"
      content="确定要退出登录吗？"
      :show-cancel="true"
      @confirm="confirmLogout"
    />

    <!-- 编辑资料弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>编辑资料</h3>
            <span class="modal-close" @click="showEditModal = false">✕</span>
          </div>
          <div class="modal-body">
            <div class="form-group"><label>手机号</label><input v-model="editForm.phone" placeholder="请输入手机号" /></div>
            <div class="form-group"><label>邮箱</label><input v-model="editForm.email" placeholder="请输入邮箱" /></div>
            <div class="form-group"><label>空闲时间</label><input v-model="editForm.freeTime" placeholder="如：周一至周五下午" /></div>
            <div class="form-group"><label>个人技能</label><textarea v-model="editForm.skills" rows="3" placeholder="描述您的技能特长..."></textarea></div>
            <div class="form-group"><label class="link-label" @click="showEditModal = false; openChangePwd()">修改密码 &gt;</label></div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showEditModal = false">取消</button>
            <button class="btn-confirm" :disabled="editLoading" @click="saveProfile">{{ editLoading ? '保存中...' : '保存' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 修改密码弹窗 -->
    <Teleport to="body">
      <div v-if="showPwdModal" class="modal-overlay" @click.self="showPwdModal = false">
        <div class="modal-box modal-sm">
          <div class="modal-header">
            <h3>修改密码</h3>
            <span class="modal-close" @click="showPwdModal = false">✕</span>
          </div>
          <div class="modal-body">
            <div class="form-group"><label>当前密码</label><input v-model="pwdForm.oldPassword" type="password" placeholder="请输入当前密码" /></div>
            <div class="form-group"><label>新密码</label><input v-model="pwdForm.newPassword" type="password" placeholder="至少6位" /></div>
            <div class="form-group"><label>确认新密码</label><input v-model="pwdForm.confirmPassword" type="password" placeholder="再次输入新密码" /></div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showPwdModal = false">取消</button>
            <button class="btn-confirm" :disabled="pwdLoading" @click="savePassword">{{ pwdLoading ? '修改中...' : '确认修改' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 公告列表弹窗 -->
    <Teleport to="body">
      <div v-if="showNoticeModal" class="modal-overlay" @click.self="showNoticeModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>全部公告</h3>
            <span class="modal-close" @click="showNoticeModal = false">✕</span>
          </div>
          <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
            <div v-if="noticeLoading" style="text-align: center; padding: 32px 0; color: #999;">加载中...</div>
            <div v-else-if="noticeList.length === 0" style="text-align: center; padding: 32px 0; color: #999;">暂无公告</div>
            <div v-else>
              <div v-for="n in noticeList" :key="n._id" class="notice-row" @click="openNoticeItem(n)">
                <div class="notice-row-title">{{ n.title }}</div>
                <div class="notice-row-date">{{ n.date }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn-cancel" @click="showNoticeModal = false">关闭</button></div>
        </div>
      </div>
    </Teleport>

    <!-- 公告详情弹窗 -->
    <Teleport to="body">
      <div v-if="showNoticeDetail" class="modal-overlay" @click.self="showNoticeDetail = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ selectedNotice?.title }}</h3>
            <span class="modal-close" @click="showNoticeDetail = false">✕</span>
          </div>
          <div class="modal-body">
            <p style="font-size: 14px; color: #333; line-height: 1.8; margin-bottom: 12px;">{{ selectedNotice?.content }}</p>
            <div style="font-size: 12px; color: #999;">{{ selectedNotice?.date }} · {{ selectedNotice?.publisher }}</div>
          </div>
          <div class="modal-footer"><button class="btn-cancel" @click="showNoticeDetail = false">关闭</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  padding-bottom: 80px;
  
  @media (min-width: 768px) {
    padding-bottom: 40px;
  }
}

// 桌面端顶部导航（统一）
.desktop-header {
  background-color: #4A90E2;
  color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-content {
    width: 100%;
    height: 56px;
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
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
  .nav-item {
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
    text-decoration: none;
    padding: 6px 16px;
    border-radius: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.1); }
    &.active { color: #ffffff; background: rgba(255, 255, 255, 0.18); font-weight: 500; }
  }
  .header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .header-user { font-size: 13px; color: rgba(255, 255, 255, 0.85); }
  .header-btn {
    font-size: 13px;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 4px 14px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    &:hover { background: rgba(255, 255, 255, 0.25); }
  }
}

// 用户卡片
.user-card {
  margin-top: 16px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  
  @media (min-width: 768px) {
    gap: 20px;
  }
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  
  @media (min-width: 768px) {
    width: 72px;
    height: 72px;
    font-size: 28px;
  }
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
  
  @media (min-width: 768px) {
    font-size: 20px;
  }
}

.user-detail {
  display: block;
  font-size: 13px;
  color: #666666;
  margin-top: 2px;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 4px;
  
  @media (min-width: 768px) {
    font-size: 24px;
  }
}

.stat-label {
  font-size: 12px;
  color: #999999;
}

.login-action {
  margin-top: 16px;
}

// 菜单
.menu-section {
  margin-top: 16px;
}

.menu-group {
  padding: 0 !important;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #fafafa;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 20px;
  height: 20px;
}

.menu-text {
  font-size: 15px;
  color: #333333;
  
  &.text-danger {
    color: #ff4d4f;
  }
}

.menu-arrow {
  font-size: 14px;
  color: #999999;
}

.admin-entry {
  .menu-text {
    color: #4A90E2;
    font-weight: 500;
  }
}

// 未登录提示
.login-tip {
  text-align: center;
  padding: 32px 16px !important;
}

.tip-text {
  font-size: 14px;
  color: #999999;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

// 弹窗
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 92%; max-width: 500px; display: flex; flex-direction: column; &.modal-sm { max-width: 400px; } }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; h3 { font-size: 16px; font-weight: 600; } .modal-close { font-size: 18px; color: #999; cursor: pointer; } }
.modal-body { padding: 16px 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.btn-cancel { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; }
.btn-confirm { padding: 8px 20px; border: none; border-radius: 6px; background: #4A90E2; color: #fff; font-size: 14px; &:disabled { background: #ccc; } }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; label { font-size: 13px; color: #555; } input, textarea { padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; &:focus { border-color: #4A90E2; outline: none; } } textarea { resize: vertical; font-family: inherit; } }
.link-label { color: #4A90E2; cursor: pointer; font-size: 13px; &:hover { text-decoration: underline; } }

// 公告列表行
.notice-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  &:hover { background: #f8f8f8; }
  &:last-child { border-bottom: none; }
}
.notice-row-title { font-size: 14px; color: #333; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notice-row-date { font-size: 12px; color: #999; margin-left: 12px; white-space: nowrap; }
</style>
