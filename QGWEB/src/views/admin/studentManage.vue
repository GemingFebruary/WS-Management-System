<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Loading from '@/components/Loading.vue'
import Modal from '@/components/Modal.vue'
import { adminApi } from '@/api/admin'
import type { UserInfo } from '@/types'

const studentList = ref<UserInfo[]>([])
const totalStudents = ref(0)
const loading = ref(false)
const searchKeyword = ref('')

// 编辑弹窗
const showEditModal = ref(false)
const editForm = ref<Record<string, any>>({})
const editTargetId = ref('')

// 重置密码确认
const showResetModal = ref(false)
const resetTarget = ref<UserInfo | null>(null)

const statusMap: Record<string, string> = { active: '正常', disabled: '已禁用' }

// 加载学生列表
const loadStudents = async () => {
  loading.value = true
  try {
    const res = await adminApi.getStudentList({ keyword: searchKeyword.value || undefined, pageNum: 1, pageSize: 100 })
    if (res.code === 200) {
      studentList.value = res.data?.list || []
      totalStudents.value = res.data?.total || 0
    }
  } catch (err) {
    console.error('加载学生列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => loadStudents()

// 打开编辑
const openEdit = (s: UserInfo) => {
  editTargetId.value = s.userId || ''
  editForm.value = {
    name: s.name || '',
    gender: s.gender || '',
    college: s.college || '',
    major: s.major || '',
    grade: s.grade || '',
    phone: s.phone || '',
    email: s.email || '',
    gpa: s.gpa || 0,
    familyType: s.familyType || '',
    familyDesc: s.familyDesc || '',
    status: s.status || 'active'
  }
  showEditModal.value = true
}

// 保存编辑
const saveEdit = async () => {
  try {
    await adminApi.updateStudent({ userId: editTargetId.value, ...editForm.value })
    showEditModal.value = false
    loadStudents()
  } catch (err) {
    console.error('更新失败:', err)
    alert('更新失败，请重试')
  }
}

// 切换状态
const toggleStatus = async (s: UserInfo) => {
  const next = s.status === 'active' ? 'disabled' : 'active'
  try {
    await adminApi.updateStudent({ userId: s.userId!, status: next })
    loadStudents()
  } catch (err) {
    console.error('切换状态失败:', err)
  }
}

// 重置密码
const confirmResetPwd = (s: UserInfo) => { resetTarget.value = s; showResetModal.value = true }
const doResetPwd = async () => {
  if (!resetTarget.value) return
  try {
    // 重置密码为学号（通过更新 password 字段）
    await adminApi.updateStudent({ userId: resetTarget.value.userId!, password: resetTarget.value.studentId })
    showResetModal.value = false
    alert(`已将 ${resetTarget.value.name} 的密码重置为学号: ${resetTarget.value.studentId}`)
  } catch (err) {
    console.error('重置密码失败:', err)
    alert('重置失败，请重试')
  }
}

const route = useRoute()

onMounted(async () => {
  await loadStudents()
  // 从申请审核页面跳转过来时，自动打开对应学生的编辑弹窗
  const targetId = route.query.studentId as string
  if (targetId) {
    const target = studentList.value.find((s: any) => s.studentId === targetId || s.userId === targetId)
    if (target) openEdit(target)
  }
})
</script>

<template>
  <div class="student-manage-page page-content">
    <PageHeader title="学生管理" :show-back="true" />

    <!-- 搜索栏 -->
    <Card class="search-bar">
      <div class="search-row">
        <input v-model="searchKeyword" class="search-input" placeholder="搜索姓名/学号/学院" @keyup.enter="handleSearch" />
        <button class="btn-search" @click="handleSearch">搜索</button>
        <span class="total-text">共 {{ totalStudents }} 名学生</span>
      </div>
    </Card>

    <!-- 学生列表 -->
    <div class="student-list">
      <Card v-for="s in studentList" :key="s.userId" class="student-item">
        <div class="s-top">
          <div class="s-info">
            <span class="s-name">{{ s.name }}</span>
            <span class="s-status" :class="s.status">{{ statusMap[s.status!] || s.status }}</span>
          </div>
          <span class="s-id">{{ s.studentId }}</span>
        </div>
        <div class="s-meta">
          <span>{{ s.college }}</span>
          <span>{{ s.major }}</span>
          <span>{{ s.grade }}</span>
          <span v-if="s.gpa">GPA {{ s.gpa }}</span>
        </div>
        <div class="s-contact">
          <span v-if="s.phone">  {{ s.phone }}</span>
          <span v-if="s.email">  {{ s.email }}</span>
        </div>
        <div class="s-actions">
          <button class="act-btn act-edit" @click="openEdit(s)">编辑</button>
          <button class="act-btn act-reset" @click="confirmResetPwd(s)">重置密码</button>
          <button class="act-btn" :class="s.status === 'active' ? 'act-disable' : 'act-enable'" @click="toggleStatus(s)">
            {{ s.status === 'active' ? '禁用' : '启用' }}
          </button>
        </div>
      </Card>

      <div v-if="studentList.length === 0 && !loading" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="empty-text">暂无学生数据</span>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>编辑学生信息</h3>
            <span class="modal-close" @click="showEditModal = false">✕</span>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group"><label>姓名</label><input v-model="editForm.name" /></div>
              <div class="form-group"><label>性别</label><select v-model="editForm.gender"><option>男</option><option>女</option></select></div>
              <div class="form-group"><label>学院</label><input v-model="editForm.college" /></div>
              <div class="form-group"><label>专业</label><input v-model="editForm.major" /></div>
              <div class="form-group"><label>年级</label><input v-model="editForm.grade" /></div>
              <div class="form-group"><label>GPA</label><input v-model.number="editForm.gpa" type="number" step="0.1" /></div>
              <div class="form-group"><label>电话</label><input v-model="editForm.phone" /></div>
              <div class="form-group"><label>邮箱</label><input v-model="editForm.email" /></div>
              <div class="form-group"><label>家庭类型</label><select v-model="editForm.familyType"><option>一般</option><option>困难</option><option>特别困难</option></select></div>
              <div class="form-group"><label>状态</label><select v-model="editForm.status"><option value="active">正常</option><option value="disabled">禁用</option></select></div>
            </div>
            <div class="form-group full">
              <label>家庭状况</label>
              <textarea v-model="editForm.familyDesc" rows="3" placeholder="描述家庭经济状况..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showEditModal = false">取消</button>
            <button class="btn-confirm" @click="saveEdit">保存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 重置密码确认 -->
    <Modal
      v-model="showResetModal"
      title="重置密码"
      :content="`确定将「${resetTarget?.name}」的密码重置为学号（${resetTarget?.studentId}）？`"
      :show-cancel="true"
      @confirm="doResetPwd"
    />

    <Loading :loading="loading && studentList.length === 0" />
  </div>
</template>

<style lang="scss" scoped>
.student-manage-page { padding-bottom: 40px; }
.search-bar { padding: 12px 16px !important; }
.search-row { display: flex; gap: 8px; align-items: center; }
.search-input { flex: 1; min-width: 0; height: 36px; padding: 0 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box; &:focus { border-color: #4A90E2; outline: none; } }
.btn-search { padding: 0 14px; background: #4A90E2; color: #fff; border-radius: 6px; font-size: 13px; white-space: nowrap; flex-shrink: 0; }
.total-text { font-size: 12px; color: #999; white-space: nowrap; }

.student-list { margin-top: 10px; }
.student-item { margin-bottom: 8px; }
.s-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.s-info { display: flex; align-items: center; gap: 8px; }
.s-name { font-size: 15px; font-weight: 600; color: #333; }
.s-status { padding: 2px 8px; border-radius: 4px; font-size: 11px; &.active { background: #f6ffed; color: #52c41a; } &.disabled { background: #f5f5f5; color: #999; } }
.s-id { font-size: 12px; color: #999; }
.s-meta { display: flex; gap: 12px; font-size: 12px; color: #666; margin-bottom: 4px; flex-wrap: wrap; }
.s-contact { display: flex; gap: 16px; font-size: 12px; color: #666; margin-bottom: 8px; flex-wrap: wrap; }
.s-actions { display: flex; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 8px; flex-wrap: wrap; }
.act-btn { padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; border: 1px solid; transition: all 0.2s; white-space: nowrap; }
.act-edit { color: #4A90E2; border-color: #4A90E2; background: transparent; &:hover { background: #4A90E2; color: #fff; } }
.act-reset { color: #faad14; border-color: #faad14; background: transparent; &:hover { background: #faad14; color: #fff; } }
.act-disable { color: #ff4d4f; border-color: #ff4d4f; background: transparent; &:hover { background: #ff4d4f; color: #fff; } }
.act-enable { color: #52c41a; border-color: #52c41a; background: transparent; &:hover { background: #52c41a; color: #fff; } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #999; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 92%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; h3 { font-size: 16px; font-weight: 600; } .modal-close { font-size: 18px; color: #999; cursor: pointer; } }
.modal-body { padding: 16px 20px; overflow-y: auto; max-height: 65vh; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.btn-cancel { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; }
.btn-confirm { padding: 8px 20px; border: none; border-radius: 6px; background: #4A90E2; color: #fff; font-size: 14px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; @media (max-width: 480px) { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 4px; label { font-size: 12px; color: #666; } input, select, textarea { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; &:focus { border-color: #4A90E2; outline: none; } } textarea { resize: vertical; font-family: inherit; } &.full { grid-column: 1 / -1; margin-top: 4px; } }
</style>
