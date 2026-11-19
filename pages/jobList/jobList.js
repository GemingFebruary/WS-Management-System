// pages/jobList/jobList.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    searchKeyword: '',
    filterData: {
      jobType: '',
      department: '',
      status: 'recruiting',
      statusText: '招聘中'
    },
    sortBy: 'default',
    jobList: [],
    totalJobs: 0,
    loading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 6
  },

  onLoad() {
    // 创建防抖的搜索函数
    this.debouncedSearch = util.debounce(this.handleSearch.bind(this), 500)
    this.loadJobList()
  },

  onShow() {
    // 刷新列表
    this.setData({
      pageNum: 1,
      hasMore: true,
      jobList: []
    })
    this.loadJobList()
  },

  // 搜索输入 - 使用防抖
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
    // 调用防抖后的搜索函数
    this.debouncedSearch()
  },

  // 处理搜索
  handleSearch() {
    this.setData({
      pageNum: 1,
      hasMore: true,
      jobList: []
    })
    this.loadJobList()
  },

  // 显示筛选选择器
  showFilterPicker(e) {
    const type = e.currentTarget.dataset.type
    const options = this.getFilterOptions(type)

    wx.showActionSheet({
      itemList: ['全部', ...options.map(o => o.label)],
      success: (res) => {
        const filterData = { ...this.data.filterData }
        if (res.tapIndex === 0) {
          filterData[type] = ''
          if (type === 'status') filterData.statusText = ''
        } else {
          const selected = options[res.tapIndex - 1]
          filterData[type] = selected.value
          if (type === 'status') filterData.statusText = selected.label
        }

        this.setData({
          filterData: filterData,
          pageNum: 1,
          hasMore: true,
          jobList: []
        })
        this.loadJobList()
      }
    })
  },

  // 获取筛选项
  getFilterOptions(type) {
    switch (type) {
      case 'jobType':
        return [
          { label: '校内', value: '校内' },
          { label: '校外', value: '校外' }
        ]
      case 'department':
        return [
          { label: '图书馆', value: '图书馆' },
          { label: '学生处', value: '学生处' },
          { label: '计算机学院', value: '计算机学院' },
          { label: '教务处', value: '教务处' },
          { label: '后勤处', value: '后勤处' }
        ]
      case 'status':
        return [
          { label: '招聘中', value: 'recruiting' },
          { label: '已满员', value: 'full' },
          { label: '已关闭', value: 'closed' }
        ]
      default:
        return []
    }
  },

  // 改变排序
  changeSort(e) {
    const sort = e.currentTarget.dataset.sort
    this.setData({
      sortBy: sort,
      pageNum: 1,
      hasMore: true,
      jobList: []
    })
    this.loadJobList()
  },

  // 加载岗位列表
  async loadJobList() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      // 调用云函数获取岗位列表
      const sortByMap = { 'default': 'publishDate', 'salary': 'salary', 'match': 'match' }
      const result = await wx.cloud.callFunction({
        name: 'jobs',
        data: {
          action: 'list',
          keyword: this.data.searchKeyword,
          jobType: this.data.filterData.jobType,
          department: this.data.filterData.department,
          status: this.data.filterData.status,
          sortBy: sortByMap[this.data.sortBy] || 'publishDate',
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        }
      })

      if (result.result.code === 200) {
        const { total, list } = result.result.data

        // 格式化日期字段
        const formattedList = list.map(job => ({
          ...job,
          publishDate: util.formatCloudDate(job.publishDate)
        }))

        let jobList = []
        if (this.data.pageNum === 1) {
          jobList = formattedList
        } else {
          jobList = [...this.data.jobList, ...formattedList]
        }

        this.setData({
          jobList: jobList,
          totalJobs: total,
          loading: false,
          hasMore: jobList.length < total,
          pageNum: this.data.pageNum + 1
        })
      } else {
        this.setData({ loading: false })
        util.showError(result.result.message || '加载失败')
      }
    } catch (err) {
      this.setData({ loading: false })
      // 使用统一的错误处理函数
      util.handleCloudError(err, '加载岗位列表失败')
    }
  },

  // 跳转到岗位详情
  goToJobDetail(e) {
    const jobId = e.currentTarget.dataset.jobId
    wx.navigateTo({
      url: `/pages/jobDetail/jobDetail?jobId=${jobId}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hasMore: true,
      jobList: []
    })
    this.loadJobList()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadJobList()
  }
})
