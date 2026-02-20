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
      <div class="dialog-box" :class="[`variant-${variant}`]">
        
        <button class="dialog-close" @click="close" aria-label="Tutup">
          <svg v-if="variant === 'plain'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 1L1 13M1 1L13 13" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div v-if="variant !== 'plain'" class="dialog-header">
          <slot name="header">
            <h5 v-if="title">{{ title }}</h5>
          </slot>
        </div>

        <div class="dialog-body">
          <div class="dialog-content">
            <slot>
              <p class="dialog-message">{{ message }}</p>
            </slot>
          </div>

          <div class="dialog-actions">
            <slot name="actions">
              <button v-if="cancelLabel" class="btn-dialog btn-cancel" @click="cancel">
                {{ cancelLabel }}
              </button>
              <button v-if="confirmLabel" class="btn-dialog btn-confirm" @click="confirm">
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
/* Overlay & Transition */
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
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Base Dialog Box */
.dialog-box {
  width: 100%;
  max-width: 572px;
  min-height: 287px;
  border-radius: 16px;
  border: 1px solid var(--color-general-border);
  background: var(--color-general-white);
  box-shadow: 0px 0px 10px 0px rgba(159, 160, 206, 0.50);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Close Icon */
.dialog-close {
  position: absolute;
  right: 32px;
  top: 22px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
  z-index: 10;
}

.dialog-close:hover {
  background: var(--color-general-frame);
}

/* Header Area (Variant 1 & 3) */
.dialog-header {
  display: flex;
  width: 100%;
  min-height: 91px;
  padding: 28px 48px;
  justify-content: center;
  align-items: center;
  gap: 71px;
}

.dialog-header h5 {
  text-align: center;
  font-family: var(--font-be-vietnam);
  font-size: 24px;
  font-weight: 800;
  line-height: 32px;
  margin: 0;
}

.variant-primary .dialog-header h5 { color: var(--color-blue-500); }
.variant-danger .dialog-header h5 { color: var(--color-general-red); }

/* Body Area */
.dialog-body {
  display: flex;
  flex-direction: column;
  padding: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex: 1;
}

/* Plain variant adjustments */
.variant-plain .dialog-body {
  justify-content: center;
  gap: 36px;
  height: 287px;
  padding: 32px;
}

.dialog-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.dialog-message {
  color: var(--color-general-black);
  text-align: center;
  font-family: var(--font-be-vietnam);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  max-width: 508px;
  margin: 0;
}

/* Action Buttons */
.dialog-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 29px;
  width: 100%;
}

.btn-dialog {
  display: flex;
  padding: 16px 20px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
  border-radius: 8px;
  font-family: var(--font-plus-jakarta);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, background 0.2s;
}

.btn-dialog:hover {
  opacity: 0.9;
}

/* Variants - Buttons */
.variant-primary .btn-confirm {
  background: var(--color-blue-500);
  color: white;
  border: none;
}
.variant-primary .btn-cancel {
  background: transparent;
  border: 1px solid var(--color-blue-500);
  color: var(--color-blue-500);
}

.variant-danger .btn-confirm {
  background: var(--color-general-red);
  color: white;
  border: none;
}
.variant-danger .btn-cancel {
  background: transparent;
  border: 1px solid var(--color-general-black);
  color: var(--color-general-black);
}

.variant-plain .btn-confirm {
  background: var(--color-blue-500);
  color: white;
  border: none;
}
.variant-plain .btn-cancel {
  background: transparent;
  border: 1px solid var(--color-general-border);
  color: var(--color-general-black);
}

@media (max-width: 600px) {
  .dialog-box {
    width: 90%;
  }
  .dialog-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }
}
</style>