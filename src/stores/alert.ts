import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const visible = ref(false)
  const type = ref<'default' | 'warning' | 'no-header'>('default')
  const title = ref('')
  const message = ref('')
  const primaryButtonText = ref('OK')

  function show(opts: {
    message: string
    title?: string
    type?: 'default' | 'warning' | 'no-header'
    primaryButtonText?: string
  }) {
    message.value = opts.message
    title.value = opts.title || ''
    type.value = opts.type || 'default'
    primaryButtonText.value = opts.primaryButtonText || 'OK'
    visible.value = true
  }

  function success(messageStr: string, titleStr = 'Berhasil') {
    show({
      message: messageStr,
      title: titleStr,
      type: 'default',
    })
  }

  function error(messageStr: string, titleStr = 'Terjadi Kesalahan') {
    show({
      message: messageStr,
      title: titleStr,
      type: 'warning',
    })
  }

  function warning(messageStr: string, titleStr = 'Peringatan') {
    show({
      message: messageStr,
      title: titleStr,
      type: 'warning',
    })
  }

  function hide() {
    visible.value = false
  }

  function reset() {
    visible.value = false
    type.value = 'default'
    title.value = ''
    message.value = ''
    primaryButtonText.value = 'OK'
  }

  return {
    visible,
    type,
    title,
    message,
    primaryButtonText,
    show,
    success,
    error,
    warning,
    hide,
    reset,
  }
})
