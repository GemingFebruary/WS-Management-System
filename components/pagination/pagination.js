// components/pagination/pagination.js
Component({
  properties: {
    current: { type: Number, value: 1 },
    pageSize: { type: Number, value: 10 },
    total: { type: Number, value: 0 }
  },
  data: { totalPages: 1 },
  observers: {
    'total, pageSize': function (total, pageSize) {
      const size = pageSize > 0 ? pageSize : 10
      this.setData({ totalPages: Math.max(1, Math.ceil(total / size)) })
    }
  },
  methods: {
    prev() {
      if (this.data.current > 1) this.triggerEvent('change', { pageNum: this.data.current - 1 })
    },
    next() {
      if (this.data.current < this.data.totalPages) this.triggerEvent('change', { pageNum: this.data.current + 1 })
    }
  }
})
