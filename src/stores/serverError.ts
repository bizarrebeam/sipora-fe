import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useServerErrorStore = defineStore('serverError', () => {
  const visible = ref(false)
  const message = ref('Server sedang mengalami perbaikan. Tenang, SIPORA akan segera kembali')

  function show(msg?: string) {
    if (msg) message.value = msg
    visible.value = true
  }

  function hide() {
    visible.value = false
  }

  function reset() {
    hide()
    message.value = 'Server sedang mengalami perbaikan. Tenang, SIPORA akan segera kembali'
  }

  return { visible, message, show, hide, reset }
})
