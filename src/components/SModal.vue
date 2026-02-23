<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  title: string
}>()

const emit = defineEmits(['update:visible', 'close'])

function close() {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-box">
        
        <div class="modal-header">
          <h5>{{ title }}</h5>
          <button class="modal-close" @click="close" aria-label="Tutup">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <slot></slot>
        </div>

        <div v-if="$slots.actions" class="modal-actions">
          <slot name="actions"></slot>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-box {
  width: 572px;
  border-radius: 16px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  background: var(--color-general-white, #FFF);
  box-shadow: 0px 0px 10px 0px rgba(159, 160, 206, 0.50);
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
}

.modal-header {
  display: flex;
  height: 91px;
  padding: 28px 148px;
  align-items: center;
  justify-content: center;
  gap: 71px;
  border-radius: 16px 16px 0 0;
  background: var(--color-blue-50, #EAEAF4);
  border-bottom: 1px solid var(--color-general-border, #D9D9D9);
  position: relative;
}

.modal-header h5 {
  text-align: center;
  font-family: var(--font-be-vietnam);
  font-size: 24px;
  font-style: normal;
  font-weight: 800;
  line-height: 32px;
  color: var(--color-blue-500, #2E3094);
  margin: 0;
  flex: 1 0 0;
}

.modal-close {
  position: absolute;
  right: 32px;
  top: 32px;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  z-index: 10;
}

.modal-body {
  display: flex;
  padding: 32px 32px 24px 32px;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
}

.modal-actions {
  display: flex;
  padding: 0 32px 32px 32px;
  justify-content: center;
  align-items: center;
  gap: 29px;
  align-self: stretch;
}

.modal-actions :deep(button) {
  display: flex;
  padding: 16px 20px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
  border-radius: 8px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 16px;
  font-weight: 600;
}
</style>