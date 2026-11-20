// components/form-input/form-input.js
Component({
  properties: {
    label: { type: String, value: '' },
    value: { type: String, value: '' },
    type: { type: String, value: 'text' },
    placeholder: { type: String, value: '' },
    field: { type: String, value: '' },
    required: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    error: { type: String, value: '' }
  },
  methods: {
    onInput(e) {
      this.triggerEvent('input', { value: e.detail.value, field: this.data.field })
    }
  }
})
