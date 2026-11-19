<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/Card.vue'
import PageHeader from '@/components/PageHeader.vue'
import Loading from '@/components/Loading.vue'
import { adminApi } from '@/api/admin'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()

interface Notice {
  _id?: string
  title: string
  content: string
  publishDate?: string
  publisher?: string
}

const noticeList = ref<Notice[]>([])
const loading = ref(false)

// 编辑弹窗
const showEditModal = ref(false)
const isEdit = ref(false)
const editForm = ref({ noticeId: '', title: '', content: '' })

// 删除确认
const showDeleteModal = ref(false)
const deleteTarget = ref<Notice | null>(null)

const loadNotices = async () => {
  loading.value = true
  try {
    const res = await adminApi.getNotices()
    if (res.code === 200) {
      noticeList.value = res.data?.list || []
    }
  } catch (err) {
    console.error('加载公告列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 打开创建弹窗
const openCreate = () => {
  isEdit.value = false
  editForm.value = { noticeId: '', title: '', content: '' }
  showEditModal.value = true
}

// 打开编辑弹窗
const openEdit = (notice: Notice) => {
  isEdit.value = true
  editForm.value = {
    noticeId: notice._id || '',
    title: notice.title || '',
    content: notice.content || ''
  }
  showEditModal.value = true
}

// 提交
const submitNotice = async () => {
  const f = editForm.value
  if (!f.title.trim() || !f.content.trim()) {
    alert('请填写标题和内容')
    return
  }
  try {
    if (isEdit.value) {
      await adminApi.updateNotice(f.noticeId, { title: f.title, content: f.content })
    } else {
      await adminApi.publishNotice({ title: f.title, content: f.content })
    }
    showEditModal.value = false
    loadNotices()
  } catch (err) {
    console.error('操作失败:', err)
    alert('操作失败，请重试')
  }
}

// 删除
const confirmDelete = (notice: Notice) => {
  deleteTarget.value = notice
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!deleteTarget.value?._id) return
  try {
    await adminApi.deleteNotice(deleteTarget.value._id)
    showDeleteModal.value = false
    loadNotices()
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败，请重试')
  }
}

onMounted(() => {
  loadNotices()
  // 从管理首页跳转过来时自动打开发布弹窗
  if (route.query.action === 'create') {
    openCreate()
  }
})
</script>

<template>
  <div class="notice-manage-page page-content">
    <PageHeader title="公告管理" :show-back="true" />

    <!-- 操作栏 -->
    <Card class="action-bar">
      <div class="action-row">
        <span class="total-text">共 {{ noticeList.length }} 条公告</span>
        <button class="btn-create" @click="openCreate">+ 发布公告</button>
      </div>
    </Card>

    <!-- 公告列表 -->
    <div class="notice-list">
      <Card v-for="notice in noticeList" :key="notice._id" class="notice-item">
        <div class="notice-top">
          <span class="notice-title">{{ notice.title }}</span>
          <span class="notice-date">{{ formatDate(notice.publishDate) }}</span>
        </div>
        <div class="notice-content">{{ notice.content }}</div>
        <div class="notice-publisher" v-if="notice.publisher">发布者: {{ notice.publisher }}</div>
        <div class="notice-actions">
          <button class="act-btn act-edit" @click="openEdit(notice)">编辑</button>
          <button class="act-btn act-delete" @click="confirmDelete(notice)">删除</button>
        </div>
      </Card>

      <div v-if="noticeList.length === 0 && !loading" class="empty-state">
        <img class="empty-icon" src="@/assets/img/icon/empty-box.svg" alt="" />
        <span class="empty-text">暂无公告</span>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ isEdit ? '编辑公告' : '发布公告' }}</h3>
            <span class="modal-close" @click="showEditModal = false">✕</span>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>公告标题</label>
              <input v-model="editForm.title" placeholder="请输入公告标题" />
            </div>
            <div class="form-group">
              <label>公告内容</label>
              <textarea v-model="editForm.content" rows="5" placeholder="请输入公告内容"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showEditModal = false">取消</button>
            <button class="btn-confirm" @click="submitNotice">{{ isEdit ? '保存' : '发布' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认 -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-box modal-sm">
          <div class="modal-header">
            <h3>确认删除</h3>
            <span class="modal-close" @click="showDeleteModal = false">✕</span>
          </div>
          <div class="modal-body">
            <p>确定要删除公告「{{ deleteTarget?.title }}」吗？</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showDeleteModal = false">取消</button>
            <button class="btn-danger" @click="doDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Loading :loading="loading && noticeList.length === 0" />
  </div>
</template>

<style lang="scss" scoped>
.notice-manage-page { padding-bottom: 40px; }

.action-bar { padding: 12px 16px !important; }
.action-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.total-text { font-size: 12px; color: #999; white-space: nowrap; }
.btn-create { padding: 6px 16px; background: #52c41a; color: #fff; border-radius: 6px; font-size: 13px; border: none; cursor: pointer; white-space: nowrap; }

.notice-list { margin-top: 10px; }
.notice-item { margin-bottom: 8px; }
.notice-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.notice-title { font-size: 15px; font-weight: 600; color: #333; }
.notice-date { font-size: 12px; color: #999; white-space: nowrap; }
.notice-content { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 6px; word-break: break-all; }
.notice-publisher { font-size: 12px; color: #999; margin-bottom: 8px; }
.notice-actions { display: flex; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 10px; }
.act-btn { padding: 4px 14px; border-radius: 4px; font-size: 12px; cursor: pointer; border: 1px solid; transition: all 0.2s; }
.act-edit { color: #4A90E2; border-color: #4A90E2; background: transparent; &:hover { background: #4A90E2; color: #fff; } }
.act-delete { color: #ff4d4f; border-color: #ff4d4f; background: transparent; &:hover { background: #ff4d4f; color: #fff; } }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #999; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 92%; max-width: 480px; display: flex; flex-direction: column; }
.modal-sm { max-width: 380px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; h3 { font-size: 16px; font-weight: 600; } .modal-close { font-size: 18px; color: #999; cursor: pointer; } }
.modal-body { padding: 16px 20px; p { font-size: 14px; color: #333; } }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 20px; border-top: 1px solid #f0f0f0; }
.btn-cancel { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 14px; }
.btn-confirm { padding: 8px 20px; border: none; border-radius: 6px; background: #4A90E2; color: #fff; font-size: 14px; }
.btn-danger { padding: 8px 20px; border: none; border-radius: 6px; background: #ff4d4f; color: #fff; font-size: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; label { font-size: 12px; color: #666; } input, textarea { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; &:focus { border-color: #4A90E2; outline: none; } } textarea { resize: vertical; font-family: inherit; } }
</style>
