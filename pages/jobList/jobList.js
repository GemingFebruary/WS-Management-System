// pages/jobList/jobList.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    searchKeyword: '',
    filterData: {
      jobType: '',
      department: '',
      status: 'recruiting'
    },
    sortBy: 'publishDate',
    jobList: [],
    totalJobs: 0,
    loading: false,
    hasMore: true,
    pageNum: 1,
    pageSize: 10
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
      itemList: ['全部', ...options],
      success: (res) => {
        const value = res.tapIndex === 0 ? '' : options[res.tapIndex - 1]
        const filterData = { ...this.data.filterData }
        filterData[type] = value

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
        return ['校内', '校外']
      case 'department':
        return ['图书馆', '学生处', '计算机学院', '教务处', '后勤处']
      case 'status':
        return ['招聘中', '已满员', '已关闭']
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
      const result = await wx.cloud.callFunction({
        name: 'jobs',
        data: {
          action: 'list',
          keyword: this.data.searchKeyword,
          jobType: this.data.filterData.jobType,
          department: this.data.filterData.department,
          status: this.data.filterData.status,
          sortBy: this.data.sortBy,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        }
      })

      if (result.result.code === 200) {
        const { total, list } = result.result.data

        let jobList = []
        if (this.data.pageNum === 1) {
          jobList = list
        } else {
          jobList = [...this.data.jobList, ...list]
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
