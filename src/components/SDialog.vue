<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible: boolean
  variant?: 'primary' | 'plain' | 'danger'
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}>(), {
  variant: 'primary',
  confirmLabel: 'Konfirmasi',
  cancelLabel: 'Batal'
})

const emit = defineEmits(['update:visible', 'close', 'confirm', 'cancel'])

function close() {
  emit('update:visible', false)
  emit('close')
}

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <Transition name="dialog-fade">
    <div v-if="visible" class="dialog-overlay" @click.self="close">
      <div class="dialog-box">
        
        <button class="dialog-close" @click="close" aria-label="Tutup">
          <svg v-if="variant === 'plain'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 1L1 13M1 1L13 13" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div v-if="variant !== 'plain'" class="dialog-header" :class="`header-${variant}`">
          <slot name="header">
            <h5 :class="{'text-primary': variant === 'primary', 'text-danger': variant === 'danger'}">
              {{ title }}
            </h5>
          </slot>
        </div>

        <div class="dialog-body" :class="{'body-plain': variant === 'plain'}">
          <div class="dialog-content">
            <slot>
              <p class="dialog-message">{{ message }}</p>
            </slot>
          </div>

          <div class="dialog-actions">
            <slot name="actions">
              <button v-if="cancelLabel" class="btn-dialog btn-cancel" :class="`cancel-${variant}`" @click="cancel">
                {{ cancelLabel }}
              </button>
              <button v-if="confirmLabel" class="btn-dialog btn-confirm" :class="`confirm-${variant}`" @click="confirm">
                {{ confirmLabel }}
              </button>
            </slot>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-box,
.dialog-fade-leave-active .dialog-box {
  transition: transform 0.2s ease;
}

.dialog-fade-enter-from .dialog-box,
.dialog-fade-leave-to .dialog-box {
  transform: scale(0.95);
}

.dialog-box {
  width: 90%;
  max-width: 572px;
  margin: 16px;
  border-radius: 16px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  background: var(--color-general-white, #FFF);
  box-shadow: 0px 0px 10px 0px rgba(159, 160, 206, 0.50);
  display: flex;
  flex-direction: column;
  position: relative;
}

.dialog-close {
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

.dialog-header {
  display: flex;
  width: 100%;
  min-height: 80px;
  height: auto;
  padding: 20px 48px;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid var(--color-general-border, #D9D9D9);
}

.header-primary {
  background: var(--color-blue-50, #EAEAF4);
}

.header-danger {
  background: var(--color-red-50, #FFE4E5);
}

.dialog-header h5 {
  text-align: center;
  font-family: var(--font-be-vietnam);
  font-size: 20px;
  font-style: normal;
  font-weight: 800;
  line-height: 28px;
  margin: 0;
  flex: 1 0 0;
}

.text-primary { color: var(--color-blue-500, #2E3094); }
.text-danger { color: var(--color-general-red, #FC6668); }

.dialog-body {
  display: flex;
  padding: 32px;
  flex-direction: column;
  align-items: flex-end;
  gap: 24px;
}

.body-plain {
  min-height: 240px;
  height: auto;
  justify-content: center;
  align-items: center;
  gap: 36px;
}

.dialog-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 29px;
  align-self: stretch;
}

.dialog-message {
  width: 100%;
  color: var(--color-general-black, #333);
  text-align: center;
  font-family: var(--font-be-vietnam);
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  margin: 0;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 29px;
  align-self: stretch;
}

.btn-dialog {
  display: flex;
  padding: 12px 16px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
  border-radius: 8px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-dialog:hover { opacity: 0.9; }

/* Variants Button */
.confirm-primary {
  background: var(--color-blue-500, #2E3094);
  color: white;
  border: none;
}
.cancel-primary {
  background: transparent;
  border: 1px solid var(--color-blue-500, #2E3094);
  color: var(--color-blue-500, #2E3094);
}

.confirm-danger {
  background: var(--color-general-red, #FC6668);
  color: white;
  border: none;
}
.cancel-danger {
  background: transparent;
  border: 1px solid var(--color-general-black, #333);
  color: var(--color-general-black, #333);
}

.confirm-plain {
  background: var(--color-blue-500, #2E3094);
  color: white;
  border: none;
}
.cancel-plain {
  background: transparent;
  border: 1px solid var(--color-general-black, #333);
  color: var(--color-general-black, #333);
}

@media (min-width: 640px) {
  .dialog-header h5 {
    font-size: 24px;
    line-height: 32px;
  }
  .dialog-message {
    font-size: 20px;
    line-height: 28px;
  }
  .btn-dialog {
    padding: 16px 20px;
    font-size: 16px;
  }
}
</style>