// components/ec-canvas/ec-canvas.js
const echarts = require('./echarts.js')
Component({
  properties: {
    canvasId: { type: String, value: 'ec-canvas' },
    ec: { type: Object, value: {} }
  },
  data: {},
  ready() { this.initChart() },
  observers: {
    'ec.option': function (option) {
      if (option && this.chart) this.chart.setOption(option)
    }
  },
  methods: {
    initChart() {
      const id = this.properties.canvasId
      const query = this.createSelectorQuery()
      query.select('#' + id).node().exec((res) => {
        if (!res || !res[0]) return
        const canvas = res[0].node
        echarts.setCanvasCreator(() => canvas)
        const chart = echarts.init(canvas, null, { width: res[0].width, height: res[0].height, devicePixelRatio: 1 })
        this.chart = chart
        const opt = this.properties.ec && this.properties.ec.option
        if (opt) chart.setOption(opt)
      })
    },
    setOption(option) { if (this.chart) this.chart.setOption(option) }
  }
})
