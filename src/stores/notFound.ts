import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotFoundStore = defineStore('notFound', () => {
  const visible = ref(false)
  const message = ref('')

  function show(msg = 'Halaman yang kamu cari tidak ditemukan.') {
    message.value = msg
    visible.value = true
  }

  function hide() {
    visible.value = false
    message.value = ''
  }

  function reset() {
    hide()
  }

  return { visible, message, show, hide, reset }
})
